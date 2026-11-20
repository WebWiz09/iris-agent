# Iris Voice Study Tutor — Accessible Frontend

Accessible, voice-first study tutor web application designed specifically for blind and low-vision university students. Built with React 19, TypeScript, LiveKit WebRTC client, and WCAG 2.2 AA accessibility standards.

## Features

- **Voice-First Experience**: LiveKit Agents WebRTC audio pipeline integrated directly with Gemini Live and browser speech synthesis fallback.
- **Onboarding & Personalization**:
  - Voice or typed name greeting and confirmation.
  - Welcomes returning learners by name.
  - Local persistence of learner profile and preferences.
- **Study Session**:
  - Responsive layout for Android phones and desktop.
  - Luminous animated orb with breathing pulse, listening eye glance, and speaking pulse (with static mode for reduced motion).
  - Prominent 64px+ circular microphone call control.
  - Immediate speech interruption (**Interrupt Iris** / **Stop speaking**).
  - Guided discovery teaching intents: **Step by step**, **Quick recap**, and **Read as written**.
  - Accessible "What can I say?" voice commands disclosure.
  - Translucent glass live captions card with expandable modal sheet.
- **Page Camera & Coaching**:
  - Live video track streaming to the agent via LiveKit.
  - Spoken framing coaching ("Tilt the page left", "Move page closer", "Page aligned").
  - Optional dashed pink guide framing overlay.
  - Diagram breakdown walkthrough (names diagram, lists parts in order, explains relationships, states takeaway).
- **Course Notes Ingestion**:
  - Native file picker supporting PDF, plain text, Markdown, and images up to 10 MB.
  - LiveKit byte-stream file transmission on the `"notes"` topic.
  - Instant demo notes loader (BIO 101: Cell Structure & Organelle function).
  - One-tap intent actions: **Explain**, **Key points**, **Quiz me**.
- **Quiz & Exam Practice**:
  - **Practice Mode** (untimed, explains answers immediately) vs. **Timed CBT Exam Mode** (with duration timer, pause/resume, and +30s extension).
  - Full-width accessible option rows (A, B, C, D) with shared touch, keyboard (keys 1-4 or A-D), and voice selection.
  - Answer confirmation before submission.
  - Final results report with score, percentage, and targeted review tip.
- **Accessibility & Assistive Tech**:
  - Target WCAG 2.2 AA compliance.
  - Primary touch targets strictly $\ge 64$ CSS px.
  - Independent, persistent **High Contrast** mode (near-black `#030c1d` surface, crisp white borders and text, `#ffc8e4` accent).
  - Independent, persistent **Large Text** mode (1.25x body scale with clean text wrapping and 320 CSS px reflow).
  - Web Audio API synthesized tones for state changes (start, listening, thinking, speaking, correct, incorrect, camera).
  - Screen Wake Lock API (`navigator.wakeLock`) during active study.
  - Keyboard skip link (`#main-content`).

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node.js 24)
- npm or pnpm

### Installation

```bash
cd frontend
npm install
```

### Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your LiveKit Cloud credentials:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

> **Note:** If LiveKit credentials are omitted, Iris automatically boots into **Interactive Demo Mode**, offering full voice narration, sample notes, camera coaching, and the 5-question biology exam quiz without requiring an active backend!

### Development

```bash
npm run dev
```

Starts Vite development server on `http://localhost:5173`. The built-in dev middleware automatically handles `/api/token` requests and signs short-lived participant tokens.

### Production Build & Lint

```bash
npm run lint    # Runs oxlint
npm run build   # TypeScript typecheck (tsc -b) & Vite production build
npm run preview # Preview production build locally
```

## Backend Contract Status

| Feature | Frontend Implementation | Backend Handler | Status |
| :--- | :--- | :--- | :--- |
| **Token Endpoint** | `GET /api/token?name=...` | Node/Vite middleware | Verified & Functional |
| **Audio In/Out** | WebRTC Audio Track via LiveKit | `session.start(agent, room)` | Verified Live |
| **Camera Video** | `room.localParticipant.setCameraEnabled(true)` | `CameraHandler` (PR #1 `origin/pascal-features`) | Verified in Code |
| **Notes Upload** | Byte stream `room.localParticipant.sendFile(..., { topic: 'notes' })` | `NotesHandler` (PR #1 `origin/pascal-features`) | Verified in Code |
| **Live Captions** | Data channel / Web Speech API | LiveKit text streams / transcription | Verified |
| **Demo Mode** | Web Audio + Web Speech API + Sample Biology Notes | Client-side self-contained | 100% Verified |
