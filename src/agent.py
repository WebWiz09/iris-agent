import logging
import textwrap

from dotenv import load_dotenv
from livekit.plugins import google
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    STTContextOptions,
    TurnHandlingOptions,
    cli,
    inference,
    room_io,
)

logger = logging.getLogger("agent")

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
            # See all available models at https://docs.livekit.io/agents/models/llm/
            # To use a realtime model instead of a voice pipeline, replace the LLM
            # with a realtime model and remove the STT/TTS from the AgentSession
            # (Note: This is for OpenAI GPT-Live, the recommended speech-to-speech
            # model. For other providers, see https://docs.livekit.io/agents/models/realtime/)
            # Replace the llm argument with the model's LiveKit Inference ID:
            #    llm="openai/gpt-live-1",
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

                - When asked to quiz, ask one question at a time about the material in front of you, wait for the answer, say whether it was right, give a short explanation, then ask the next.
                - For exam practice, ask multiple choice questions and read the options as A, B, C and D. Say these are practice questions from the student's own material, not official exam questions.
                - After about five questions, give a short spoken score and one tip on what to review.

                # Boundaries

                - Stay on studying and learning. Politely decline anything harmful or unrelated.
                - For medical, legal, or financial topics, give general information only and suggest a qualified professional.
                - Do not repeat or store personal details beyond the student's name.
                """
            ),
        )

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer(initialize_process_timeout=60)

@server.rtc_session()
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using AssemblyAI, Fish Audio, and the LiveKit turn detector
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model="gemini-3.8-live",
            api_version="v1beta",
            voice="Puck",
            temperature=0.8,
        ),
    )

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
       agent=Assistant(),
       room=ctx.room,
    )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = anam.AvatarSession(
    #     persona_config=anam.PersonaConfig(
    #         name="...",
    #         avatarId="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/anam
    #     ),
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Join the room and connect to the user
    await ctx.connect()

    # Speak first: greet the user before they say anything
    await session.generate_reply(
        instructions="Greet the student briefly as Iris, their voice study tutor, and ask for their name."
    )


if __name__ == "__main__":
    cli.run_app(server)
