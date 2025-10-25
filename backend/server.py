from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import io

# === Setup ===
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Upload config
LOCAL_UPLOAD_ENABLED = os.environ.get('LOCAL_UPLOAD_ENABLED', 'false').lower() == 'true'
UPLOADS_DIR = ROOT_DIR / 'uploads'

if LOCAL_UPLOAD_ENABLED:
    UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Medicine Tracker API", version="1.0.0")

# Mount static uploads if enabled
if LOCAL_UPLOAD_ENABLED:
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== Models =====
class MedicineBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    category: str
    type: str
    tags: str
    purpose: str
    dosage: str
    duration_days: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_location: Optional[str] = None
    prescription_url: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class Medicine(MedicineBase):
    id: str
    created_at: str
    updated_at: str

class PrescriptionUploadResponse(BaseModel):
    file_id: str
    filename: str
    shareable_link: str
    message: str

# ===== Google Drive Mock Service =====
class MockGoogleDriveService:
    def __init__(self):
        self.uploads = {}
        logger.info("MockGoogleDriveService initialized")
    async def upload_file(self, file_content: bytes, filename: str, mimetype: str) -> tuple:
        import uuid
        file_id = str(uuid.uuid4())
        self.uploads[file_id] = {
            'filename': filename,
            'size': len(file_content),
            'mimetype': mimetype,
            'uploaded_at': datetime.now(timezone.utc).isoformat()
        }
        mock_link = f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
        logger.info(f"Mock upload successful: {filename} (ID: {file_id})")
        return file_id, mock_link

drive_service = MockGoogleDriveService()

# ===== Helper Functions =====
def calculate_end_date(start_date_str: str, duration_days: int) -> str:
    from datetime import datetime, timedelta
    start = datetime.fromisoformat(start_date_str)
    end = start + timedelta(days=duration_days)
    return end.isoformat()

# ===== Routes =====
@api_router.get("/")
async def root():
    return {"message": "Medicine Tracker API", "version": "1.0.0"}

@api_router.post("/medicines", response_model=Medicine)
async def create_medicine(medicine: MedicineCreate):
    import uuid
    medicine_dict = medicine.model_dump()
    medicine_dict['id'] = str(uuid.uuid4())
    medicine_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    medicine_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    if medicine_dict.get('start_date') and medicine_dict.get('duration_days'):
        if not medicine_dict.get('end_date'):
            medicine_dict['end_date'] = calculate_end_date(medicine_dict['start_date'], medicine_dict['duration_days'])
    await db.medicines.insert_one(medicine_dict)
    logger.info(f"Medicine created: {medicine_dict['name']} (ID: {medicine_dict['id']})")
    return Medicine(**medicine_dict)

@api_router.get("/medicines", response_model=List[Medicine])
async def get_medicines(category: Optional[str] = None, type: Optional[str] = None, tag: Optional[str] = None):
    query = {}
    if category: query['category'] = category
    if type: query['type'] = type
    if tag: query['tags'] = {'$regex': tag, '$options': 'i'}
    medicines = await db.medicines.find(query, {"_id": 0}).to_list(1000)
    return [Medicine(**med) for med in medicines]

@api_router.get("/medicines/{medicine_id}", response_model=Medicine)
async def get_medicine(medicine_id: str):
    medicine = await db.medicines.find_one({"id": medicine_id}, {"_id": 0})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return Medicine(**medicine)

@api_router.put("/medicines/{medicine_id}", response_model=Medicine)
async def update_medicine(medicine_id: str, medicine: MedicineCreate):
    existing = await db.medicines.find_one({"id": medicine_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Medicine not found")
    medicine_dict = medicine.model_dump()
    medicine_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    if medicine_dict.get('start_date') and medicine_dict.get('duration_days'):
        if not medicine_dict.get('end_date'):
            medicine_dict['end_date'] = calculate_end_date(medicine_dict['start_date'], medicine_dict['duration_days'])
    await db.medicines.update_one({"id": medicine_id}, {"$set": medicine_dict})
    updated = await db.medicines.find_one({"id": medicine_id}, {"_id": 0})
    logger.info(f"Medicine updated: {medicine_id}")
    return Medicine(**updated)

@api_router.delete("/medicines/{medicine_id}")
async def delete_medicine(medicine_id: str):
    result = await db.medicines.delete_one({"id": medicine_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medicine not found")
    logger.info(f"Medicine deleted: {medicine_id}")
    return {"message": "Medicine deleted successfully", "id": medicine_id}

# ===== Flag-based Upload Endpoint =====
@api_router.post("/upload-prescription", response_model=PrescriptionUploadResponse)
async def upload_prescription(file: UploadFile = File(...)):
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(allowed_types)}")
    max_size = 50 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=413, detail="File size exceeds 50MB limit")

    if LOCAL_UPLOAD_ENABLED:
        # Save file locally
        save_path = UPLOADS_DIR / file.filename
        with open(save_path, "wb") as out_file:
            out_file.write(file_content)
        file_url = f"/uploads/{file.filename}"
        message = "File uploaded successfully to local filesystem."
        file_id = file.filename
        logger.info(f"Prescription uploaded locally: {file.filename}")
    else:
        # Use mock Google Drive logic
        file_id, file_url = await drive_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            mimetype=file.content_type
        )
        message = "File uploaded successfully (mock mode)."
    await file.close()
    return PrescriptionUploadResponse(
        file_id=file_id,
        filename=file.filename,
        shareable_link=file_url,
        message=message
    )

@api_router.get("/stats")
async def get_stats():
    total = await db.medicines.count_documents({})
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    by_category = await db.medicines.aggregate(pipeline).to_list(100)
    return {
        "total_medicines": total,
        "by_category": {item['_id']: item['count'] for item in by_category}
    }

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("MongoDB connection closed")
