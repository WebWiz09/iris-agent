import asyncio
import io
import logging
import mimetypes
from dataclasses import dataclass
from typing import Callable, Optional

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

from livekit import rtc
from livekit.agents import Agent

try:
    from PIL import Image
except ImportError:
    Image = None

logger = logging.getLogger("notes_handler")

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Supported MIME types
SUPPORTED_MIME_TYPES = {
    "application/pdf": "pdf",
    "text/plain": "text",
    "text/markdown": "text",
    "image/png": "image",
    "image/jpeg": "image",
    "image/jpg": "image",
    "image/webp": "image",
    "image/gif": "image",
}

# Map file extensions to MIME types for validation
EXTENSION_TO_MIME = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


@dataclass
class UploadedDocument:
    """Represents an uploaded document with extracted content."""

    filename: str
    mime_type: str
    size: int
    text_content: str
    is_scanned_pdf: bool = False
    extraction_error: Optional[str] = None
    # Raw image data for images (to be pushed as video frame)
    image_data: Optional[bytes] = None
    image_format: Optional[str] = None


class NotesHandler:
    """Handles receiving and processing document uploads via LiveKit byte streams."""

    def __init__(
        self,
        agent: Agent | None = None,
        push_video_frame: Callable[[rtc.VideoFrame], None] | None = None,
    ) -> None:
        self._agent = agent
        self._push_video_frame = push_video_frame
        self._current_document: Optional[UploadedDocument] = None
        self._pending_tasks: set[asyncio.Task] = set()

    def set_agent(self, agent: Agent) -> None:
        """Set the agent reference after initialization."""
        self._agent = agent

    def set_push_video_callback(
        self, callback: Callable[[rtc.VideoFrame], None]
    ) -> None:
        """Set the callback for pushing video frames (e.g., for uploaded images)."""
        self._push_video_frame = callback

    @property
    def current_document(self) -> Optional[UploadedDocument]:
        return self._current_document

    def clear_document(self) -> None:
        """Clear the current document."""
        self._current_document = None
        # Clear document context from agent instructions
        task = asyncio.create_task(self.clear_document_context())
        self._pending_tasks.add(task)
        task.add_done_callback(self._pending_tasks.discard)

    async def handle_byte_stream(
        self,
        reader: rtc.ByteStreamReader,
        participant_identity: str,
    ) -> None:
        """Handle an incoming byte stream for a document upload."""
        logger.info(
            f"Received byte stream from {participant_identity} for topic 'notes'"
        )

        # Read stream info
        info = reader.info
        filename = info.attributes.get("filename", "unknown")
        mime_type = info.attributes.get("mime_type", "")

        # Validate file type
        if not mime_type:
            mime_type = self._guess_mime_type(filename)

        if mime_type not in SUPPORTED_MIME_TYPES:
            logger.warning(f"Unsupported file type: {mime_type} for {filename}")
            await self._notify_agent(
                f"The student uploaded a file ({filename}) but it's in an unsupported format. "
                "Please let them know we only support PDF, plain text, and image files."
            )
            # Consume the stream to avoid resource leaks
            async for _ in reader:
                pass
            return

        # Read all chunks
        chunks = []
        total_size = 0

        try:
            async for chunk in reader:
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    logger.warning(
                        f"File {filename} exceeds maximum size of {MAX_FILE_SIZE} bytes"
                    )
                    await self._notify_agent(
                        f"The student uploaded {filename} but it's too large. "
                        "Please let them know the maximum file size is 10 MB."
                    )
                    # Continue consuming to clean up
                    async for _ in reader:
                        pass
                    return
                chunks.append(chunk)
        except Exception as e:
            logger.error(f"Error reading byte stream for {filename}: {e}")
            await self._notify_agent(
                f"There was an error receiving the file {filename}. "
                "Please ask the student to try again."
            )
            return

        if not chunks:
            logger.warning(f"Empty file uploaded: {filename}")
            await self._notify_agent(
                f"The student uploaded {filename} but it appears to be empty. "
                "Please ask them to try again with a valid file."
            )
            return

        file_data = b"".join(chunks)
        logger.info(f"Received file: {filename} ({mime_type}, {total_size} bytes)")

        # Process the file in a background thread to prevent blocking the event loop
        document = await self._process_file(filename, mime_type, file_data)
        self._current_document = document

        # Notify the agent about the uploaded document and seed the conversation context
        await self._notify_agent_about_document(document)

    def _guess_mime_type(self, filename: str) -> str:
        """Guess MIME type from filename."""
        mime_type, _ = mimetypes.guess_type(filename)
        if mime_type:
            return mime_type
        # Fallback to extension mapping
        for ext, mime in EXTENSION_TO_MIME.items():
            if filename.lower().endswith(ext):
                return mime
        return "application/octet-stream"

    async def _process_file(
        self,
        filename: str,
        mime_type: str,
        data: bytes,
    ) -> UploadedDocument:
        """Process a file based on its MIME type in a non-blocking thread."""
        return await asyncio.to_thread(
            self._process_file_sync, filename, mime_type, data
        )

    def _process_file_sync(
        self,
        filename: str,
        mime_type: str,
        data: bytes,
    ) -> UploadedDocument:
        file_type = SUPPORTED_MIME_TYPES.get(mime_type, "unknown")

        if file_type == "pdf":
            return self._process_pdf_sync(filename, data)
        elif file_type == "text":
            return self._process_text_sync(filename, data)
        elif file_type == "image":
            return self._process_image_sync(filename, mime_type, data)
        else:
            return UploadedDocument(
                filename=filename,
                mime_type=mime_type,
                size=len(data),
                text_content="",
                extraction_error=f"Unsupported file type: {mime_type}",
            )

    async def _process_pdf(self, filename: str, data: bytes) -> UploadedDocument:
        """Extract text from a PDF file."""
        return await asyncio.to_thread(self._process_pdf_sync, filename, data)

    def _process_pdf_sync(self, filename: str, data: bytes) -> UploadedDocument:
        if pdfplumber is None:
            return UploadedDocument(
                filename=filename,
                mime_type="application/pdf",
                size=len(data),
                text_content="",
                is_scanned_pdf=False,
                extraction_error="pdfplumber is not installed. Please install pdfplumber to extract text from PDF files.",
            )

        text_content = ""
        is_scanned = False
        extraction_error = None

        try:
            with pdfplumber.open(io.BytesIO(data)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n\n"

                # Check if PDF appears to be scanned (no text extracted but has images)
                if not text_content.strip():
                    has_images = any(page.images for page in pdf.pages)
                    if has_images:
                        is_scanned = True
                        extraction_error = "PDF appears to be scanned (image-based). Text extraction not possible."
                    else:
                        extraction_error = "No text could be extracted from the PDF."

        except Exception as e:
            logger.warning(f"PDF extraction failed for {filename}: {e}")
            extraction_error = f"Failed to extract text from PDF: {e!s}"

        return UploadedDocument(
            filename=filename,
            mime_type="application/pdf",
            size=len(data),
            text_content=text_content.strip(),
            is_scanned_pdf=is_scanned,
            extraction_error=extraction_error,
        )

    async def _process_text(self, filename: str, data: bytes) -> UploadedDocument:
        """Process a plain text file."""
        return await asyncio.to_thread(self._process_text_sync, filename, data)

    def _process_text_sync(self, filename: str, data: bytes) -> UploadedDocument:
        text_content = ""
        extraction_error = None

        try:
            # Try common encodings
            for encoding in ["utf-8", "utf-16", "latin-1", "cp1252"]:
                try:
                    text_content = data.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                extraction_error = (
                    "Could not decode text file with any supported encoding"
                )
        except Exception as e:
            logger.warning(f"Text file processing failed for {filename}: {e}")
            extraction_error = f"Failed to process text file: {e!s}"

        return UploadedDocument(
            filename=filename,
            mime_type="text/plain",
            size=len(data),
            text_content=text_content.strip(),
            extraction_error=extraction_error,
        )

    async def _process_image(
        self, filename: str, mime_type: str, data: bytes
    ) -> UploadedDocument:
        """Process an image file (acknowledge receipt, text extraction would need OCR)."""
        return await asyncio.to_thread(
            self._process_image_sync, filename, mime_type, data
        )

    def _process_image_sync(
        self, filename: str, mime_type: str, data: bytes
    ) -> UploadedDocument:
        if Image is None:
            return UploadedDocument(
                filename=filename,
                mime_type=mime_type,
                size=len(data),
                text_content=f"[Image: {filename}]",
                extraction_error="Pillow is not installed. Please install pillow to process image files.",
            )

        extraction_error = None
        text_content = ""
        image_data = None
        image_format = None

        try:
            # Validate it's a valid image and get raw data
            img = Image.open(io.BytesIO(data))
            img.verify()
            img = Image.open(io.BytesIO(data))  # Reopen after verify

            image_data = data
            image_format = img.format

            text_content = (
                f"[Image: {filename}, {img.width}x{img.height}, {img.format}]"
            )
            extraction_error = "Image received. Text extraction from images requires OCR which is not currently available."

            # Push image as a video frame if callback is available
            if self._push_video_frame:
                try:
                    # Convert PIL image to VideoFrame
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format="JPEG", quality=85)
                    img_buffer.seek(0)
                    img_jpeg = Image.open(img_buffer)

                    # Create VideoFrame from image
                    video_frame = rtc.VideoFrame(
                        width=img_jpeg.width,
                        height=img_jpeg.height,
                        data=img_jpeg.tobytes(),
                        format=rtc.VideoBufferType.RGB24,
                    )
                    self._push_video_frame(video_frame)
                    logger.info(f"Pushed uploaded image {filename} as video frame")
                except Exception as e:
                    logger.warning(f"Failed to push image as video frame: {e}")

        except Exception as e:
            logger.warning(f"Image processing failed for {filename}: {e}")
            extraction_error = f"Failed to process image: {e!s}"
            text_content = f"[Image: {filename} - could not be processed]"

        return UploadedDocument(
            filename=filename,
            mime_type=mime_type,
            size=len(data),
            text_content=text_content,
            extraction_error=extraction_error,
            image_data=image_data,
            image_format=image_format,
        )

    async def _notify_agent(self, message: str) -> None:
        """Send a message to the agent to speak."""
        try:
            await self._agent.session.generate_reply(instructions=message)
        except Exception as e:
            logger.warning(f"Failed to notify agent: {e}")

    async def _notify_agent_about_document(self, document: UploadedDocument) -> None:
        """Notify the agent about the uploaded document and its content."""
        if document.extraction_error and document.is_scanned_pdf:
            message = (
                f"The student uploaded {document.filename}. It appears to be a scanned PDF "
                "that I cannot read text from. Please let them know I can't extract text from "
                "scanned documents and ask if they have a text-based version or can describe "
                "what's on the page."
            )
        elif document.extraction_error:
            message = (
                f"The student uploaded {document.filename} but I couldn't read it: "
                f"{document.extraction_error}. Please let them know there was an issue "
                "and ask them to try again or describe the content."
            )
        elif document.text_content:
            # Provide up to 2500 characters of clean content for the agent to teach from and quiz on
            content_digest = document.text_content[:2500].strip()
            message = (
                f"The student uploaded their study notes: '{document.filename}'.\n"
                f"Extracted content from their notes:\n{content_digest}\n\n"
                "Instructions: Confirm warmly in 1 or 2 spoken sentences that you have received and reviewed their notes. "
                "Mention what the notes cover, and ask if they would like you to explain the key ideas step by step or conduct a 5-question multiple-choice practice quiz."
            )
        else:
            message = (
                f"The student uploaded {document.filename} but no text content could be extracted. "
                "Please ask them to describe what's in it or try a different format."
            )

        await self._notify_agent(message)

    def get_document_context(self) -> str:
        """Get the current document's text content for use as agent context."""
        if not self._current_document or not self._current_document.text_content:
            return ""

        return f"\n--- Student's uploaded document: {self._current_document.filename} ---\n{self._current_document.text_content}\n--- End of document ---\n"

    async def inject_document_context(self) -> None:
        """Inject document context safely without overloading the realtime connection."""
        if (
            not self._agent
            or not self._current_document
            or not self._current_document.text_content
        ):
            return

        # Keep context clean to prevent 1008 policy/inactivity errors
        context = self.get_document_context()
        if len(context) > 2000:
            context = context[:2000] + "\n... [truncated for live audio speed]"

        base_instructions = getattr(self._agent, "_instructions", "") or ""
        if "--- Student's uploaded document:" not in base_instructions:
            updated = base_instructions + context
            try:
                await self._agent.update_instructions(updated)
                logger.info(
                    f"Injected document context for {self._current_document.filename}"
                )
            except Exception as e:
                logger.debug(f"Document context seeded via prompt: {e}")

    async def clear_document_context(self) -> None:
        """Remove document context from agent instructions."""
        if not self._agent:
            return

        base_instructions = self._agent._instructions or ""
        # Remove the document context section if present
        if "--- Student's uploaded document:" in base_instructions:
            parts = base_instructions.split("--- Student's uploaded document:")
            updated_instructions = parts[0].rstrip()
            try:
                await self._agent.update_instructions(updated_instructions)
                logger.info("Cleared document context from agent instructions")
            except Exception as e:
                logger.warning(f"Failed to clear document context: {e}")


def notes_byte_stream_handler(handler: NotesHandler):
    """Create a byte stream handler callback for the 'notes' topic."""

    async def _handler(reader: rtc.ByteStreamReader, participant_identity: str) -> None:
        await handler.handle_byte_stream(reader, participant_identity)

    return _handler
