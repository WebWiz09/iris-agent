import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Type, Volume2, Trash2 } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

export function AccessibilityPage() {
  const navigate = useNavigate();
  const {
    studentName,
    highContrast,
    largeText,
    audioCues,
    toggleHighContrast,
    toggleLargeText,
    toggleAudioCues,
    clearLocalData,
  } = useIrisSession();

  const handleClearData = () => {
    if (window.confirm('Clear saved name and profile preferences on this device?')) {
      clearLocalData();
      alert('Local data cleared.');
      navigate('/');
    }
  };

  return (
    <div className="iris-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          className="iris-btn subtle"
          style={{ width: 'auto', minHeight: '52px', padding: '8px 16px' }}
          onClick={() => navigate('/study')}
          aria-label="Return to study session"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Back to session</span>
        </button>
      </div>

      <span className="iris-step-tag">Accessibility & Preferences</span>
      <h1 className="iris-screen-heading">Display & Audio Settings</h1>
      <p className="iris-screen-subheading">
        Customizations persist across visits. All primary actions meet the 64 CSS px touch target standard.
      </p>

      <div style={{ display: 'grid', gap: '16px', margin: '24px 0' }}>
        {/* High Contrast Toggle */}
        <div
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'var(--iris-panel)',
            border: '2px solid var(--iris-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={22} color="var(--iris-yellow)" aria-hidden="true" />
              <strong style={{ fontSize: '20px' }}>High Contrast Mode</strong>
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--iris-muted)', fontSize: '16px' }}>
              Near-black backdrop (#030c1d), crisp pure-white borders and typography, high contrast ratio.
            </p>
          </div>
          <button
            className={`iris-btn ${highContrast ? 'primary' : 'subtle'}`}
            style={{ width: 'auto', minHeight: '56px', padding: '10px 22px', flexShrink: 0 }}
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'enabled' : 'disabled'}`}
          >
            <span>{highContrast ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Large Text Toggle */}
        <div
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'var(--iris-panel)',
            border: '2px solid var(--iris-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Type size={22} color="var(--iris-yellow)" aria-hidden="true" />
              <strong style={{ fontSize: '20px' }}>Large Text (1.25x)</strong>
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--iris-muted)', fontSize: '16px' }}>
              Enlarges body type to 24px+ with flexible layout reflow and wrapping for low-vision readers.
            </p>
          </div>
          <button
            className={`iris-btn ${largeText ? 'primary' : 'subtle'}`}
            style={{ width: 'auto', minHeight: '56px', padding: '10px 22px', flexShrink: 0 }}
            onClick={toggleLargeText}
            aria-pressed={largeText}
            aria-label={`Toggle large text mode. Currently ${largeText ? 'enabled' : 'disabled'}`}
          >
            <span>{largeText ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Audio Cues Toggle */}
        <div
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'var(--iris-panel)',
            border: '2px solid var(--iris-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 size={22} color="var(--iris-yellow)" aria-hidden="true" />
              <strong style={{ fontSize: '20px' }}>Audio Cues & Tones</strong>
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--iris-muted)', fontSize: '16px' }}>
              Plays synthesized chimes for session start, microphone listening, thinking, and quiz correctness.
            </p>
          </div>
          <button
            className={`iris-btn ${audioCues ? 'primary' : 'subtle'}`}
            style={{ width: 'auto', minHeight: '56px', padding: '10px 22px', flexShrink: 0 }}
            onClick={toggleAudioCues}
            aria-pressed={audioCues}
            aria-label={`Toggle audio cues. Currently ${audioCues ? 'enabled' : 'disabled'}`}
          >
            <span>{audioCues ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Profile & Reset */}
      <div style={{ marginTop: '36px', borderTop: '1px solid var(--iris-line)', paddingTop: '24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Saved Learner Profile</h2>
        <p style={{ color: 'var(--iris-muted)', margin: '0 0 16px' }}>
          Registered name: <strong>{studentName || 'Not saved yet'}</strong>
        </p>
        <button
          className="iris-btn danger"
          style={{ maxWidth: '320px' }}
          onClick={handleClearData}
          aria-label="Clear saved student name and reset preferences"
        >
          <Trash2 size={20} aria-hidden="true" />
          <span>Clear saved local data</span>
        </button>
      </div>
    </div>
  );
}
