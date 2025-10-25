# Medicine Tracker 💊

A full-stack personal medicine management system that helps you store and manage all your medicines, prescriptions, and treatment details — including file uploads to Google Drive.

## 🎯 Features

- ✅ **Complete Medicine Management**: Add, edit, delete, and view medicines
- 📊 **Smart Filtering**: Filter by category, type, or search by name/purpose
- 📈 **Statistics Dashboard**: View total medicines and category breakdown
- 📅 **Auto-calculate End Dates**: Automatically calculate end dates based on duration
- 📄 **Prescription Upload**: Upload prescription images/PDFs to Google Drive
- 👨‍⚕️ **Doctor Information**: Track doctor names and hospital locations
- 🏷️ **Tag System**: Organize medicines with custom tags
- 🎨 **Modern UI**: Beautiful, responsive design with glass-morphism effects

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (Database with Motor async driver)
- PyDrive2 (Google Drive integration)
- Pydantic (Data validation)

**Frontend:**
- React 19
- Tailwind CSS
- Shadcn/UI Components
- Axios (API calls)
- React Router (Navigation)
- Sonner (Toast notifications)

## 🔐 Google Drive Integration Setup

Currently, the application uses a **MOCK Google Drive service** for development. To enable real Google Drive uploads:

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Drive API**

### Step 2: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth Client ID"
3. Choose "Desktop app" as application type
4. Download the JSON file and rename it to `client_secrets.json`
5. Place the file in `/app/backend/client_secrets.json`

### Step 3: Create Settings File
Create a file `/app/backend/settings.yaml`:

```yaml
client_config_backend: file
client_config_file: client_secrets.json
save_credentials: True
save_credentials_backend: file
save_credentials_file: credentials.json
get_refresh_token: True
oauth_scope:
  - https://www.googleapis.com/auth/drive.file
```

### Step 4: Restart Backend
```bash
sudo supervisorctl restart backend
```

## 📚 API Documentation

Visit: http://localhost:8000/docs

### Main Endpoints
- `POST /api/medicines` - Create medicine
- `GET /api/medicines` - List medicines (with filters)
- `GET /api/medicines/{id}` - Get specific medicine
- `PUT /api/medicines/{id}` - Update medicine
- `DELETE /api/medicines/{id}` - Delete medicine
- `POST /api/upload-prescription` - Upload prescription
- `GET /api/stats` - Get statistics

## 🚀 Quick Start

The application is already running! Access it at:
- **Frontend**: http://localhost:3000/
- **Backend API**: http://localhost:8000/api/


## 📝 Usage

1. Click "Add Medicine" to add your first medicine
2. Fill in details (name, category, type, dosage, etc.)
3. Upload prescription (optional) - currently in mock mode
4. View all medicines on the dashboard
5. Use filters to search and organize
6. Edit or delete medicines as needed

---

**Built with FastAPI, React, and MongoDB**
