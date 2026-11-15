from typing import List
from fastapi import APIRouter
from ..audio.separator import demucs_separator
from ..schemas.job import ModelInfoResponse

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=List[ModelInfoResponse])
def get_models():
    models = demucs_separator.get_available_models()
    return [ModelInfoResponse(**m) for m in models]
