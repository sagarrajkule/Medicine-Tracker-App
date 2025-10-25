import os
import re
import uuid
from datetime import datetime

def generate_filename(filename: str) -> str:
    # Extract file extension
    name, ext = os.path.splitext(filename)
    # Remove unwanted characters (allow only alphanum, dash, underscore, dot)
    name = re.sub(r'[^a-zA-Z0-9-_\.]', '_', name).strip('_')
    # Lowercase
    name = name.lower()

    # Append datetime or UUID to ensure uniqueness
    unique_suffix = datetime.utcnow().strftime('%Y%m%d%H%M%S') + '_' + str(uuid.uuid4())[:8]
    
    # Construct final filename
    final_name = f"{name}_{unique_suffix}{ext.lower()}"
    return final_name
