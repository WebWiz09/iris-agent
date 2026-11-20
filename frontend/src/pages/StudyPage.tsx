import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Square,
  MessageSquare,
  BookOpen,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';
import { IrisOrb } from '../components/IrisOrb';
import { LiveCaptionsCard } from '../components/LiveCaptionsCard';
import { CaptionsSheet } from '../components/CaptionsSheet';
import { VoiceCommandsDisclosure } from '../components/VoiceCommandsDisclosure';

export function StudyPage() {
  const navigate = useNavigate();
  const {
    studentName,
    connectionStatus,
    agentState,
    isMicMuted,
    toggleMic,
    interruptIris,
    currentSource,
    sendTeachingIntent,
    disconnectSession,
  } = useIrisSession();

  const [isCaptionsOpen, setIsCaptionsOpen] = useState(false);

  // Status message
  let statusText = 'Listening';
  if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
    statusText = 'Connecting to Iris...';
  } else if (isMicMuted) {
    statusText = 'Microphone muted';
  } else if (agentState === 'speaking') {
    statusText = 'Iris is speaking';
  } else if (agentState === 'thinking') {
    statusText = 'Iris is thinking...';
  }

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end your study session?')) {
      disconnectSession();
      navigate('/');
    }
  };

  return (
    <div className="iris-container desktop-two-col">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Session Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="iris-screen-heading" style={{ marginBottom: 4 }}>
              Study session
            </h1>
            <p className="iris-screen-subheading" style={{ marginBottom: 12 }}>
              With Iris • {studentName || 'Student'}
            </p>
          </div>
          <span
            style={{
              fontSize: '15px',
              color: 'var(--iris-muted)',
              border: '1px solid var(--iris-line)',
              padding: '4px 10px',
              borderRadius: '12px',
            }}
          >
            Source: {currentSource.length > 22 ? `${currentSource.slice(0, 22)}...` : currentSource}
          </span>
        </div>

        {/* Luminous Animated Orb */}
        <IrisOrb state={agentState} />

        {/* Live Captions Glass Card */}
        <LiveCaptionsCard onOpenSheet={() => setIsCaptionsOpen(true)} />

        {/* Plain Language Status */}
        <div
          className="iris-state-label"
          role="status"
          aria-live="polite"
          style={{ textAlign: 'center' }}
        >
          {statusText}
        </div>

        {/* Call-style Circular Mic / Interrupt Control */}
        <div className="iris-voice-control">
          {agentState === 'speaking' ? (
            <>
              <button
                className="iris-mic-btn interrupt"
                onClick={interruptIris}
                aria-label="Stop Iris speaking and return to listening"
              >
                <Square size={34} fill="currentColor" aria-hidden="true" />
              </button>
              <span className="iris-call-hint">Tap to interrupt Iris</span>
            </>
          ) : (
            <>
              <button
                className={`iris-mic-btn ${isMicMuted ? 'muted' : ''}`}
                onClick={toggleMic}
                aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMicMuted ? (
                  <MicOff size={38} aria-hidden="true" />
                ) : (
                  <Mic size={38} aria-hidden="true" />
                )}
              </button>
              <span className="iris-call-hint">
                {isMicMuted ? 'Microphone muted • tap to unmute' : 'Your turn • Iris is listening'}
              </span>
            </>
          )}
        </div>

        {/* Teaching Intent Choices */}
        <div style={{ margin: '14px 0' }}>
          <h2
            style={{
              fontSize: '18px',
              color: 'var(--iris-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
            }}
          >
            Teaching Choices
          </h2>
          <div className="iris-teaching-intents">
            <button
              className="iris-btn"
              onClick={() => sendTeachingIntent('step_by_step')}
              aria-label="Step by step guided lesson with signposts and everyday examples"
            >
              <BookOpen size={20} color="var(--iris-yellow)" aria-hidden="true" />
              <span>Step by step</span>
            </button>

            <button
              className="iris-btn"
              onClick={() => sendTeachingIntent('quick_recap')}
              aria-label="Quick recap summary of current concepts"
            >
              <HelpCircle size={20} color="var(--iris-yellow)" aria-hidden="true" />
              <span>Quick recap</span>
            </button>

            <button
              className="iris-btn"
              onClick={() => sendTeachingIntent('read_as_written')}
              aria-label="Read exact text from uploaded notes or page"
            >
              <span>Read as written</span>
            </button>
          </div>
        </div>

        {/* Camera Preview Quick Entry */}
        <button
          className="iris-btn"
          style={{ minHeight: '74px', margin: '12px 0', justifyContent: 'space-between' }}
          onClick={() => navigate('/camera')}
          aria-label="Page camera preview. Open camera coaching and diagram review."
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="iris-thumb-page" aria-hidden="true" />
            <span>
              Page camera
              <span className="button-note">Open framing coaching & diagram review</span>
            </span>
          </span>
          <ChevronRight size={24} color="var(--iris-yellow)" aria-hidden="true" />
        </button>

        {/* Voice Commands Disclosure */}
        <VoiceCommandsDisclosure />

        {/* Secondary Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <button
            className="iris-btn"
            onClick={() => setIsCaptionsOpen(true)}
            aria-label="Type a message or question to Iris"
          >
            <MessageSquare size={20} aria-hidden="true" />
            <span>Type message</span>
          </button>

          <button
            className="iris-btn danger"
            onClick={handleEndSession}
            aria-label="End study session"
          >
            <LogOut size={20} aria-hidden="true" />
            <span>End session</span>
          </button>
        </div>
      </div>

      {/* Desktop Transcript Side Panel */}
      <div
        className="desktop-side-panel"
        style={{
          display: 'none',
          padding: '24px',
          background: 'var(--iris-panel)',
          borderRadius: '24px',
          border: '1px solid var(--iris-line)',
        }}
      >
        <h2 style={{ fontSize: '24px', margin: '0 0 16px' }}>Live Transcript</h2>
        <p style={{ color: 'var(--iris-muted)', fontSize: '16px' }}>
          Real-time conversation history is visible on wider desktop screens:
        </p>
      </div>

      {/* Captions Modal Sheet */}
      <CaptionsSheet isOpen={isCaptionsOpen} onClose={() => setIsCaptionsOpen(false)} />
    </div>
  );
}
