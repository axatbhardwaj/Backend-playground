# Skin Disease Checker API - Implementation Guide

## What You'll Build

You'll implement a **complete FastAPI web service** that processes skin images using AI. The system will have a clean architecture with separated concerns: data models, AI communication, and web endpoints.

### Learning Objectives
- Understand FastAPI application structure
- Implement proper data validation with Pydantic
- Build an AI service integration layer
- Handle file uploads and image processing
- Create clean API responses and error handling

### Architecture Overview
Your app will have three main layers:
1. **Models Layer** (`models.py`): Data structures and validation
2. **AI Layer** (`ollama_client.py`): Med-GEMMA model communication
3. **API Layer** (`app.py`): HTTP endpoints and request handling

## Understanding the Technologies

### Why FastAPI?
- **Modern Python web framework** for building APIs
- **Automatic API documentation** (Swagger UI)
- **Type hints** for better code and error catching
- **Async support** for handling multiple requests
- **Fast performance** compared to Flask/Django

### Why Ollama?
- **Runs AI models locally** on your machine (privacy!)
- **Easy model management** (download, run, switch models)
- **REST API interface** that our Python code can call
- **Cross-platform** (works on macOS, Linux, Windows)

### Why Med-GEMMA?
- **Medical-trained AI** from Google
- **Multimodal** (can understand both text AND images)
- **Open-source** and runs locally
- **Specialized** for healthcare content analysis

### Why uv?
- **Fast Python package manager** (much faster than pip)
- **Project management** (handles dependencies, virtual environments)
- **Reproducible builds** (everyone gets same versions)
- **Modern tooling** replacing pip + venv

## Implementation Steps

### Prerequisites Setup (Do This First)
Before implementing code, ensure you have:
- Python 3.11+ installed
- Ollama installed with `alibayram/medgemma:4b` model
- uv package manager installed

**Quick setup commands:**
```bash
# Install dependencies (run these once)
uv init
uv add fastapi uvicorn python-multipart httpx pillow pydantic

# Start Ollama service
ollama serve

# Run development server (in another terminal)
uv run uvicorn src.skin_checker.app:app --reload --port 8000
```

### Step 1: Implement Data Models (`models.py`)

**What this file does:** Defines the structure and validation for all data flowing through your API.

**Why it's needed:**
- Ensures type safety and data validation
- Provides clear contracts between API components
- Auto-generates API documentation
- Catches invalid data early

**What to implement:**

```python
from pydantic import BaseModel
from fastapi import UploadFile
from typing import Optional

class DiagnosisRequest(BaseModel):
    """Input validation for diagnosis requests"""
    # This represents the uploaded file
    pass  # You'll implement this

class DiagnosisResponse(BaseModel):
    """Standardized response format"""
    status: str  # "healthy" or "unhealthy"
    confidence: float  # 0.0 to 1.0
    disease: Optional[str] = None  # disease name if unhealthy
    disease_confidence: Optional[float] = None  # confidence if unhealthy

    class Config:
        # Ensures proper JSON serialization
        pass  # You'll implement this
```

**Implementation checklist:**
- [ ] Define `DiagnosisRequest` to validate file uploads
- [ ] Define `DiagnosisResponse` with proper field types
- [ ] Add field validation (confidence between 0-1)
- [ ] Add example data for API documentation

### Step 2: Implement Ollama Client (`ollama_client.py`)

**What this file does:** Acts as the bridge between your FastAPI app and the Med-GEMMA AI model.

**Why it's needed:**
- Isolates AI-specific logic from web logic
- Handles image format conversion (AI models need base64)
- Manages communication with Ollama's REST API
- Parses AI responses into structured data
- Provides error handling for AI service issues

**Key responsibilities:**
- Convert uploaded images to base64 format
- Build structured prompts for the AI model
- Send HTTP requests to Ollama API
- Parse JSON responses from the AI
- Handle network errors and timeouts

**What to implement:**

```python
import base64
import httpx
from PIL import Image
import io
from typing import Dict, Any
import json

class OllamaClient:
    """Handles communication with Med-GEMMA model via Ollama"""

    def __init__(self, model_name: str = "alibayram/medgemma:4b"):
        self.model_name = model_name
        self.base_url = "http://localhost:11434"  # Default Ollama port

    def diagnose_skin_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Main method: takes image bytes, returns diagnosis dict

        Steps:
        1. Convert image to base64
        2. Build prompt for Med-GEMMA
        3. Send to Ollama API
        4. Parse response
        5. Return structured data
        """
        pass  # You'll implement this

    def _image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes to base64 string"""
        pass  # You'll implement this

    def _build_prompt(self, base64_image: str) -> str:
        """Create the structured prompt for Med-GEMMA"""
        pass  # You'll implement this

    def _call_ollama_api(self, prompt: str) -> str:
        """Send request to Ollama and get response"""
        pass  # You'll implement this

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Extract structured data from AI response"""
        pass  # You'll implement this
```

**Implementation checklist:**
- [ ] Create `OllamaClient` class with proper initialization
- [ ] Implement `_image_to_base64()` method
- [ ] Implement `_build_prompt()` with clear instructions for Med-GEMMA
- [ ] Implement `_call_ollama_api()` with proper error handling
- [ ] Implement `_parse_response()` to extract JSON from AI text
- [ ] Implement main `diagnose_skin_image()` method

### Step 3: Implement FastAPI App (`app.py`)

**What this file does:** Defines the web API endpoints and orchestrates the entire request flow.

**Why it's needed:**
- Provides HTTP interface for clients
- Validates incoming requests
- Coordinates between models and AI client
- Handles errors and returns proper HTTP responses
- Serves as the main entry point for the application

**Key responsibilities:**
- Define `/diagnose` POST endpoint
- Handle multipart file uploads
- Validate input data
- Call the Ollama client for AI analysis
- Return structured JSON responses
- Handle various error scenarios

**What to implement:**

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .models import DiagnosisResponse
from .ollama_client import OllamaClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Skin Disease Checker API",
    description="AI-powered skin image analysis using Med-GEMMA",
    version="1.0.0"
)

# Add CORS middleware for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI client
ollama_client = OllamaClient()

@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose_skin(
    file: UploadFile = File(...)
) -> DiagnosisResponse:
    """
    Main endpoint: accepts skin image, returns diagnosis

    Steps:
    1. Validate file upload
    2. Read image bytes
    3. Call AI analysis
    4. Return formatted response
    """
    pass  # You'll implement this

@app.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "service": "skin-disease-checker"}

# This allows running the app directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Implementation checklist:**
- [ ] Set up FastAPI app with proper configuration
- [ ] Add CORS middleware for web compatibility
- [ ] Implement `/diagnose` endpoint with file upload
- [ ] Add input validation (file type, size limits)
- [ ] Implement error handling for various scenarios
- [ ] Add health check endpoint
- [ ] Configure logging for debugging

### Step 4: Test Your Implementation

**Testing Strategy:**
1. **Unit Tests:** Test individual components (models, client methods)
2. **Integration Tests:** Test the full API flow
3. **Manual Tests:** Use curl/Postman to test endpoints

**Basic Testing Commands:**
```bash
# Test the health endpoint
curl http://localhost:8000/

# Test diagnosis with a real image
curl -X POST -F "image=@skin_image.jpg" http://localhost:8000/diagnose

# Test with invalid file (should return error)
curl -X POST -F "image=@text_file.txt" http://localhost:8000/diagnose
```

**Expected API Behavior:**
- **Success Response:**
```json
{
  "status": "healthy",
  "confidence": 0.85,
  "disease": null,
  "disease_confidence": null
}
```

- **Error Response:**
```json
{
  "detail": "Invalid file type. Only JPEG and PNG images are supported."
}
```

### Step 5: Debug and Iterate

**Common Implementation Issues:**

1. **Import Errors:** Check your `__init__.py` files and Python path
2. **Ollama Connection:** Ensure `ollama serve` is running
3. **Base64 Issues:** Verify image conversion is working
4. **JSON Parsing:** Check AI response format matches your parser

**Debug Tips:**
- Add `print()` statements to see data flow
- Use FastAPI's automatic docs at `http://localhost:8000/docs`
- Check Ollama logs for AI-related errors
- Validate JSON responses with online tools

### Implementation Order
1. ✅ Start with `models.py` (foundation)
2. ✅ Implement `ollama_client.py` (AI logic)
3. ✅ Build `app.py` (web interface)
4. ✅ Test individual components
5. ✅ Test full integration
6. ✅ Add error handling and validation

## Key Concepts You'll Learn

- **Separation of Concerns:** Each file has a single responsibility
- **Data Validation:** Using Pydantic for type safety
- **API Design:** RESTful endpoints with proper HTTP methods
- **Error Handling:** Graceful failure and user-friendly messages
- **AI Integration:** Communicating with external ML services
- **Async Programming:** FastAPI's async/await patterns

## Important Notes

⚠️ **Educational Project Only:** This demonstrates AI integration patterns, NOT medical diagnosis. Always consult healthcare professionals for medical concerns.

- **Privacy First:** Images are processed locally, never sent externally
- **Model Limitations:** AI responses depend on training data quality
- **Single Image Processing:** Designed for one image at a time
- **Local AI:** Requires Ollama running with Med-GEMMA model
