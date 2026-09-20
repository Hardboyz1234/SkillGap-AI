"""
Extracts plain text from an uploaded resume file (PDF or DOCX) so it can
be fed into the Gemini analysis prompt.
"""
import io

from fastapi import UploadFile, HTTPException
from pypdf import PdfReader
from docx import Document


async def extract_resume_text(file: UploadFile) -> str:
    filename = (file.filename or "").lower()
    raw = await file.read()

    if filename.endswith(".pdf"):
        return _extract_pdf(raw)
    elif filename.endswith(".docx"):
        return _extract_docx(raw)
    elif filename.endswith(".txt"):
        return raw.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported resume format. Please upload a .pdf, .docx, or .txt file.",
        )


def _extract_pdf(raw: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(raw))
        if reader.is_encrypted:
            raise HTTPException(
                status_code=422,
                detail="This PDF is password-protected. Please upload an unlocked file.",
            )
        text_parts = [page.extract_text() or "" for page in reader.pages]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Couldn't read this PDF — it may be corrupted or in an unsupported format.",
        )

    text = "\n".join(text_parts).strip()
    if not text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this PDF (it may be a scanned image).",
        )
    return text


def _extract_docx(raw: bytes) -> str:
    try:
        doc = Document(io.BytesIO(raw))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Couldn't read this DOCX — it may be corrupted or not a real Word file.",
        )

    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from this DOCX.")
    return text
