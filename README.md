# Iris Voice Agent

Voice-first study tutor for visually impaired and low-vision students, built with LiveKit Agents and Gemini Live.

## Setup

1. Install dependencies:
   ```bash
   uv sync
   ```
2. Copy `.env.example` to `.env.local` and fill in your own keys:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `GOOGLE_API_KEY` (from Google AI Studio)

## Run

- Local terminal test: `uv run python src/agent.py console`
- Connect to LiveKit Cloud: `uv run python src/agent.py dev`

## Critical Settings (Do Not Change)

- Model: `gemini-3.8-live`
- API Version: `v1beta` (required, otherwise Gemini Live returns HTTP 404)
- Keep `@server.rtc_session()` unnamed during dev so the agent auto-joins test rooms.
- Do not re-enable `ai_coustics` noise cancellation locally (causes CPU stalls on Windows).