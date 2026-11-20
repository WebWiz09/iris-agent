import { Link } from 'react-router-dom';
import { useIrisSession } from '../context/useIrisSession';
import { Settings, VolumeX } from 'lucide-react';

export function Header() {
  const { connectionStatus, agentState, isMicMuted, isAudioPlaybackBlocked, resumeAudioPlayback } =
    useIrisSession();

  let statusLabel = 'Offline';
  let dotClass = '';

  if (connectionStatus === 'connected') {
    statusLabel = agentState === 'speaking' ? 'Iris speaking' : agentState === 'listening' ? 'Listening' : 'Connected';
    dotClass = 'connected';
  } else if (connectionStatus === 'demo') {
    statusLabel = agentState === 'speaking' ? 'Iris speaking' : agentState === 'listening' ? 'Listening' : 'Demo Mode';
    dotClass = 'demo';
  } else if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
    statusLabel = 'Connecting...';
    dotClass = 'listening';
  }

  return (
    <header className="iris-brandbar" role="banner">
      <Link to="/" className="iris-wordmark" aria-label="Iris Home — Voice Study Tutor">
        <span className="iris-brand-mark" aria-hidden="true" />
        <span>IRIS</span>
      </Link>

      <div className="iris-header-tools">
        {isAudioPlaybackBlocked && (
          <button
            className="iris-btn subtle"
            style={{ minHeight: '44px', padding: '6px 12px', fontSize: '15px' }}
            onClick={resumeAudioPlayback}
            aria-label="Browser blocked audio. Click to enable sound."
          >
            <VolumeX size={18} aria-hidden="true" />
            <span>Enable sound</span>
          </button>
        )}

        <div className="iris-status-badge" role="status" aria-live="polite">
          <span className={`iris-status-dot ${dotClass}`} aria-hidden="true" />
          <span>{statusLabel}</span>
          {isMicMuted && <span style={{ opacity: 0.7 }}>(Mic muted)</span>}
        </div>

        <Link
          to="/accessibility"
          className="iris-header-link"
          aria-label="Accessibility options and display settings"
        >
          <Settings size={20} aria-hidden="true" />
          <span className="sr-only">Accessibility</span>
        </Link>
      </div>
    </header>
  );
}
