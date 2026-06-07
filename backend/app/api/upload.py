from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
import uuid
from typing import Dict

router = APIRouter()

UPLOAD_DIR = "uploads"

# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image", response_model=Dict[str, str])
async def upload_image(file: UploadFile = File(...)):
    """Uploads an image and returns its URL."""
    try:
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL path
        url = f"/uploads/{unique_filename}"
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
