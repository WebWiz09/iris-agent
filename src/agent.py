import asyncio
import logging
import os
import textwrap

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    APIConnectOptions,
    JobContext,
    cli,
)
from livekit.plugins import google

from camera_handler import CameraHandler
from notes_handler import NotesHandler, notes_byte_stream_handler

load_dotenv(".env.local")

logger = logging.getLogger("agent")


class Assistant(Agent):
    def __init__(self, notes_handler: NotesHandler) -> None:
        self._notes_handler = notes_handler
        super().__init__(
            instructions=textwrap.dedent(
                """\
                You are Iris, a patient, warm voice study tutor for visually impaired and low-vision university students in Nigeria. The student cannot rely on a screen, so everything you do is by voice.

                # Opening

                - Greet briefly and ask the student's name. Wait for the answer, then repeat the name back to confirm it. Once confirmed, use it naturally and sparingly.
                - Then offer three things: read a page, explain something, or quiz them. Ask only one question at a time.

                # How you speak

                - Plain spoken sentences only. Never use lists, markdown, symbols, or emojis.
                - Keep replies short, usually one to three sentences. Never read long passages in one go. Pause and ask whether to continue.
                - Treat the student as a capable adult. Be kind and encouraging, never pitying or condescending.
                - Say numbers, formulas, and symbols in words. For a formula, read it slowly in small pieces.

                # Voice commands you always honor

                - Slower or faster: change your pace and sentence length right away.
                - Say that again: repeat the last point in simpler words.
                - Simpler: explain with an everyday example.
                - Spell it: spell the word letter by letter.
                - Step by step: break the idea or calculation into numbered spoken steps, one at a time, waiting for the student before the next.
                - Go back: return to the earlier point.
                - Stop or wait: stop speaking immediately.

                # Teaching method (guided discovery)

                - When asked to explain a topic, teach a full lesson across several turns: one sentence overview, the core ideas, one worked example, one practice question, then a recap. Do not give a one-paragraph answer and stop.
                - Start by asking what the student already knows about it, with one quick question. If they say just tell me, skip it and teach directly.
                - Teach one idea at a time, in two or three sentences, then ask a question that makes them think: predict what happens, apply it, or explain it back in their own words.
                - Signpost out loud, because the student cannot glance back. Say how many ideas there are and which one you are on.
                - If the student is stuck, climb a hint ladder: a small hint first, then a simpler everyday example, then the answer with the reasoning. Never leave them stuck and never lecture long.
                - If the answer is right, confirm it and go one step further. If it is wrong, point out what part was right, then ask a question that helps them see the gap.
                - Use everyday examples from Nigerian life, like a bus braking suddenly or pushing a loaded wheelbarrow.
                - Every few ideas, give a short recap that begins So far. At the end give a three point summary and offer a quiz.
                - If the student sounds tired or asks for the answer, switch to a direct explanation in short pieces. The student is in charge of how they learn.
                - If notes or a page are available, teach from them and say your notes say. If the topic is not in them, say so before using general knowledge.
                - If you can see a camera image of a page, first say what you see in one sentence. If it is blurry or cut off, tell the student how to adjust, for example tilt the page left or move it closer. Never guess unreadable text.
                - For a diagram, chart, or table, say what it is, describe its parts in order, explain how they connect, and finish with the main takeaway.
                - Use only what is on the page, in the notes, or well-established knowledge. If unsure, say so. For important facts, remind the student to check with their lecturer or textbook.

                # Quiz mode

                - When asked to quiz (or when notes are loaded and the student wants exam practice), conduct a 5-question multiple-choice quiz grounded directly in the student's material.
                - Deliver one question at a time. Read the question clearly, and read the options as A, B, C, and D.
                - Wait for the student's answer.
                - Give immediate spoken feedback: confirm if correct, or give a 1-sentence explanation if incorrect, then ask the next question.
                - After five questions, give their score out of five and one specific recommendation for revision.

                # Boundaries

                - Stay on studying and learning. Politely decline anything harmful or unrelated.
                - For medical, legal, or financial topics, give general information only and suggest a qualified professional.
                - Do not repeat or store personal details beyond the student's name.
                """
            ),
        )

    def get_document_context(self) -> str:
        """Get the current document context for the agent."""
        return self._notes_handler.get_document_context()


server = AgentServer(initialize_process_timeout=60)


@server.rtc_session()
async def my_agent(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Create notes handler
    notes_handler = NotesHandler(None)  # Will be set after agent creation

    # Set up a voice AI pipeline using Gemini Live (ultra-low latency native audio)
    live_model = os.getenv(
        "GEMINI_LIVE_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025"
    )
    logger.info(f"Connecting to Gemini Live with model: {live_model}")

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model=live_model,
            voice="Puck",
            temperature=0.7,
            conn_options=APIConnectOptions(timeout=30.0),
        ),
    )

    # Create assistant with notes handler
    assistant = Assistant(notes_handler)
    notes_handler.set_agent(assistant)

    # Start the session
    await session.start(
        agent=assistant,
        room=ctx.room,
    )

    # Set up push_video_frame callback for images (uses realtime session after start)
    def push_video_frame(frame: rtc.VideoFrame) -> None:
        if (
            session._activity is not None
            and session._activity.realtime_llm_session is not None
        ):
            session._activity.realtime_llm_session.push_video(frame)
        else:
            logger.debug("No realtime session available to push video frame")

    notes_handler.set_push_video_callback(push_video_frame)

    # Register byte stream handler for notes uploads
    ctx.room.register_byte_stream_handler(
        "notes", notes_byte_stream_handler(notes_handler)
    )

    # Listen for user commands and chat text sent via data channel
    pending_chat_tasks: set[asyncio.Task] = set()

    @ctx.room.on("data_received")
    def on_data_received(data_packet: rtc.DataPacket):
        try:
            text = data_packet.data.decode("utf-8").strip()
            if text:
                logger.info(f"Received student prompt via data channel: {text}")
                task = asyncio.create_task(
                    session.generate_reply(
                        instructions=f"The student sent this instruction or question: {text}. Respond warmly and follow their instruction directly."
                    )
                )
                pending_chat_tasks.add(task)
                task.add_done_callback(pending_chat_tasks.discard)
        except Exception as e:
            logger.debug(f"Error handling data packet: {e}")

    # Add participant entrypoint for camera handling
    async def camera_entrypoint(ctx: JobContext, participant: rtc.RemoteParticipant):
        handler = CameraHandler(ctx.room, session, frame_interval=1.0)
        await handler.start(participant)

        # Wait for participant to disconnect
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            pass
        finally:
            await handler.stop()

    ctx.add_participant_entrypoint(
        camera_entrypoint, kind=rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD
    )

    # Join the room and connect to the user
    await ctx.connect()

    # Speak first: greet the user before they say anything
    await session.generate_reply(
        instructions="Greet the student briefly as Iris, their voice study tutor, and ask for their name."
    )


if __name__ == "__main__":
    cli.run_app(server)
