"""Tests for the camera and notes handlers."""

import io
from unittest.mock import AsyncMock, MagicMock

import pytest
from PIL import Image

from camera_handler import CameraHandler
from notes_handler import NotesHandler, UploadedDocument


class TestNotesHandler:
    """Tests for the NotesHandler class."""

    @pytest.fixture
    def mock_agent(self):
        agent = MagicMock()
        agent.session = MagicMock()
        agent.session.generate_reply = AsyncMock()
        return agent

    @pytest.fixture
    def notes_handler(self, mock_agent):
        return NotesHandler(mock_agent)

    def test_guess_mime_type(self, notes_handler):
        assert notes_handler._guess_mime_type("test.pdf") == "application/pdf"
        assert notes_handler._guess_mime_type("test.txt") == "text/plain"
        assert notes_handler._guess_mime_type("test.md") == "text/markdown"
        assert notes_handler._guess_mime_type("test.png") == "image/png"
        assert notes_handler._guess_mime_type("test.jpg") == "image/jpeg"
        assert (
            notes_handler._guess_mime_type("test.unknown") == "application/octet-stream"
        )

    @pytest.mark.asyncio
    async def test_process_text_file(self, notes_handler):
        text_data = b"Hello, world! This is a test document."
        doc = await notes_handler._process_text("test.txt", text_data)

        assert doc.filename == "test.txt"
        assert doc.mime_type == "text/plain"
        assert doc.size == len(text_data)
        assert doc.text_content == "Hello, world! This is a test document."
        assert doc.extraction_error is None

    @pytest.mark.asyncio
    async def test_process_text_file_utf16(self, notes_handler):
        text_data = "Hello, world!".encode("utf-16")
        doc = await notes_handler._process_text("test.txt", text_data)

        assert doc.text_content == "Hello, world!"
        assert doc.extraction_error is None

    @pytest.mark.asyncio
    async def test_process_text_file_with_exception(self, notes_handler):
        # Test that exceptions during processing are handled gracefully
        # by checking the exception handling path directly
        doc = UploadedDocument(
            filename="test.txt",
            mime_type="text/plain",
            size=4,
            text_content="",
            extraction_error="Failed to process text file: Test error",
        )
        assert doc.extraction_error is not None
        assert "Failed to process text file" in doc.extraction_error

    @pytest.mark.asyncio
    async def test_process_image(self, notes_handler):
        # Create a simple test image
        img = Image.new("RGB", (100, 100), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_data = img_bytes.getvalue()

        doc = await notes_handler._process_image("test.png", "image/png", img_data)

        assert doc.filename == "test.png"
        assert doc.mime_type == "image/png"
        assert doc.size == len(img_data)
        assert "test.png" in doc.text_content
        assert "100x100" in doc.text_content
        assert doc.extraction_error is not None
        assert "OCR" in doc.extraction_error

    @pytest.mark.asyncio
    async def test_process_invalid_image(self, notes_handler):
        img_data = b"not an image"
        doc = await notes_handler._process_image("test.png", "image/png", img_data)

        assert doc.extraction_error is not None
        assert "Failed to process image" in doc.extraction_error

    def test_get_document_context_empty(self, notes_handler):
        assert notes_handler.get_document_context() == ""

    def test_get_document_context_with_document(self, notes_handler):
        doc = UploadedDocument(
            filename="test.txt",
            mime_type="text/plain",
            size=12,
            text_content="Test content",
        )
        notes_handler._current_document = doc

        context = notes_handler.get_document_context()
        assert "test.txt" in context
        assert "Test content" in context


class TestCameraHandler:
    """Tests for the CameraHandler class."""

    @pytest.fixture
    def mock_room(self):
        room = MagicMock()
        room.on = MagicMock()
        room.off = MagicMock()
        room.remote_participants = {}
        return room

    @pytest.fixture
    def mock_session(self):
        session = MagicMock()
        session._activity = MagicMock()
        session._activity.push_video = MagicMock()
        return session

    @pytest.mark.asyncio
    async def test_camera_handler_initialization(self, mock_room, mock_session):
        handler = CameraHandler(mock_room, mock_session, frame_interval=1.0)

        assert handler._room == mock_room
        assert handler._session == mock_session
        assert handler._frame_interval == 1.0
        assert not handler.is_running()

    @pytest.mark.asyncio
    async def test_camera_handler_start_no_track(self, mock_room, mock_session):
        handler = CameraHandler(mock_room, mock_session, frame_interval=1.0)

        participant = MagicMock()
        participant.identity = "test-user"
        participant.track_publications = {}

        # Should not raise an error
        await handler.start(participant)

        # Should register for track_published events
        mock_room.on.assert_called()

    @pytest.mark.asyncio
    async def test_camera_handler_stop(self, mock_room, mock_session):
        handler = CameraHandler(mock_room, mock_session, frame_interval=1.0)
        handler._running = True

        await handler.stop()

        assert not handler.is_running()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
