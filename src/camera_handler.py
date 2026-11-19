import asyncio
import contextlib
import logging
from typing import Optional

from livekit import rtc
from livekit.agents import AgentSession
from livekit.agents.voice.io import VideoInput

logger = logging.getLogger("camera_handler")


class CameraVideoInput(VideoInput):
    """VideoInput implementation that reads from a participant's camera track at a fixed interval."""

    def __init__(
        self,
        track: rtc.RemoteVideoTrack,
        frame_interval: float = 1.0,
    ) -> None:
        super().__init__(label="camera")
        self._track = track
        self._frame_interval = frame_interval
        self._video_stream: Optional[rtc.VideoStream] = None
        self._running = False
        self._frame_queue: asyncio.Queue[rtc.VideoFrame] = asyncio.Queue(maxsize=2)
        self._producer_task: Optional[asyncio.Task] = None
        self._last_frame_time = 0.0

    async def start(self) -> None:
        """Start reading frames from the track."""
        if self._running:
            return

        self._running = True
        self._video_stream = rtc.VideoStream(
            self._track, format=rtc.VideoBufferType.RGB24
        )
        self._producer_task = asyncio.create_task(
            self._produce_frames(), name="camera-frame-producer"
        )
        logger.info(f"Started camera video input for track {self._track.sid}")

    async def _produce_frames(self) -> None:
        """Produce frames at the configured interval."""
        if not self._video_stream:
            return

        async for event in self._video_stream:
            if not self._running:
                break

            current_time = asyncio.get_event_loop().time()
            if current_time - self._last_frame_time < self._frame_interval:
                continue

            self._last_frame_time = current_time

            try:
                # Non-blocking put - drop frame if queue is full (backpressure)
                self._frame_queue.put_nowait(event.frame)
            except asyncio.QueueFull:
                # Queue full, drop oldest frame and add new one
                with contextlib.suppress(asyncio.QueueEmpty):
                    self._frame_queue.get_nowait()
                self._frame_queue.put_nowait(event.frame)

    def __aiter__(self) -> "CameraVideoInput":
        return self

    async def __anext__(self) -> rtc.VideoFrame:
        if not self._running:
            raise StopAsyncIteration

        try:
            frame = await asyncio.wait_for(self._frame_queue.get(), timeout=5.0)
            return frame
        except asyncio.TimeoutError:
            # No frame received within timeout, check if still running
            if not self._running:
                raise StopAsyncIteration from None
            # Return a blank frame or raise StopAsyncIteration?
            # For now, raise to signal no frame available
            raise StopAsyncIteration from None

    async def stop(self) -> None:
        """Stop the video input."""
        self._running = False

        if self._producer_task and not self._producer_task.done():
            self._producer_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._producer_task

        if self._video_stream:
            await self._video_stream.aclose()
            self._video_stream = None

        logger.info("Camera video input stopped")


class CameraHandler:
    """Handles receiving and processing camera video from a student's LiveKit video track."""

    def __init__(
        self,
        room: rtc.Room,
        session: AgentSession,
        frame_interval: float = 1.0,
    ) -> None:
        self._room = room
        self._session = session
        self._frame_interval = frame_interval
        self._camera_input: Optional[CameraVideoInput] = None
        self._current_participant: Optional[rtc.RemoteParticipant] = None
        self._running = False
        self._pending_tasks: set[asyncio.Task] = set()

    async def start(self, participant: rtc.RemoteParticipant) -> None:
        """Start handling camera video from a participant."""
        if self._running:
            logger.warning("Camera handler already running")
            return

        self._current_participant = participant
        self._running = True

        # Find the camera video track (source=CAMERA)
        camera_track = None
        for publication in participant.track_publications.values():
            if (
                publication.track
                and publication.source == rtc.TrackSource.SOURCE_CAMERA
            ):
                camera_track = publication.track
                break

        if not camera_track:
            logger.info(f"No camera track found for participant {participant.identity}")
            await self._wait_for_camera_track(participant)
            return

        await self._setup_camera_input(camera_track)

    async def _wait_for_camera_track(self, participant: rtc.RemoteParticipant) -> None:
        """Wait for a camera track to be published by the participant."""

        def on_track_published(
            publication: rtc.RemoteTrackPublication, p: rtc.RemoteParticipant
        ) -> None:
            if (
                p.identity == participant.identity
                and publication.source == rtc.TrackSource.SOURCE_CAMERA
                and publication.track
            ):
                self._room.off("track_published", on_track_published)
                task = asyncio.create_task(self._setup_camera_input(publication.track))
                self._pending_tasks.add(task)
                task.add_done_callback(self._pending_tasks.discard)

        self._room.on("track_published", on_track_published)

    async def _setup_camera_input(self, track: rtc.RemoteVideoTrack) -> None:
        """Set up the camera video input and attach to session."""
        logger.info(f"Setting up camera video input for track {track.sid}")

        self._camera_input = CameraVideoInput(
            track, frame_interval=self._frame_interval
        )
        await self._camera_input.start()

        # Attach to the agent session's video input
        self._session.input.video = self._camera_input

    async def stop(self) -> None:
        """Stop the camera handler."""
        self._running = False

        # Detach from session
        self._session.input.video = None

        if self._camera_input:
            await self._camera_input.stop()
            self._camera_input = None

        self._current_participant = None
        logger.info("Camera handler stopped")

    def is_running(self) -> bool:
        return self._running


async def handle_participant_camera(
    ctx,
    participant: rtc.RemoteParticipant,
    session: AgentSession,
) -> None:
    """Entrypoint for handling a participant's camera."""
    handler = CameraHandler(ctx.room, session, frame_interval=1.0)
    await handler.start(participant)

    # Keep the handler running until the participant disconnects
    try:
        await asyncio.Event().wait()  # Wait indefinitely
    except asyncio.CancelledError:
        await handler.stop()
    except Exception as e:
        logger.error(f"Error in camera handler for {participant.identity}: {e}")
        await handler.stop()
    finally:
        await handler.stop()
