import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';
import { DEMO_DIAGRAM } from '../services/demoData';

type CameraStep = 'align' | 'captured' | 'explaining' | 'done';

export function CameraPage() {
  const navigate = useNavigate();
  const {
    startCamera,
    stopCamera,
    cameraActive,
    cameraError,
    localVideoTrack,
    sendTextMessage,
  } = useIrisSession();

  const [step, setStep] = useState<CameraStep>('align');
  const [coachingText, setCoachingText] = useState('Hold your handout steady. Tilt the page left.');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Start camera stream on mount
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (localVideoTrack && videoRef.current) {
      localVideoTrack.attach(videoRef.current);
    }
  }, [localVideoTrack]);

  const handlePageAligned = () => {
    setStep('captured');
    setCoachingText('Page aligned! Holding frame for Iris...');

    setTimeout(() => {
      setStep('explaining');
      setCoachingText(`Iris is analyzing the diagram: "${DEMO_DIAGRAM.title}"...`);
      sendTextMessage(
        `I am showing a diagram on the camera. Please name it, explain the parts in order, and give the takeaway.`
      );

      setTimeout(() => {
        setStep('done');
        setCoachingText(
          `Explained: ${DEMO_DIAGRAM.title}. ${DEMO_DIAGRAM.takeaway}`
        );
      }, 2500);
    }, 1200);
  };

  const handleRepeatCoaching = () => {
    // Announce current coaching text via speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(coachingText);
      window.speechSynthesis.speak(u);
    }
  };

  const handleReturnToStudy = async () => {
    await stopCamera();
    navigate('/study');
  };

  return (
    <div className="iris-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          className="iris-btn subtle"
          style={{ width: 'auto', minHeight: '52px', padding: '8px 16px' }}
          onClick={handleReturnToStudy}
          aria-label="Return to study session"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Back to session</span>
        </button>
      </div>

      <span className="iris-step-tag">Page Camera & Diagram Coaching</span>
      <h1 className="iris-screen-heading" style={{ marginBottom: '8px' }}>
        Show your page
      </h1>
      <p className="iris-screen-subheading">
        Position printed notes or diagrams in front of the lens. Iris coaches your framing by voice.
      </p>

      {/* Spoken Coaching Banner */}
      <div
        className="iris-coach-banner"
        role="region"
        aria-live="assertive"
        aria-label="Camera coaching instruction"
      >
        <span>{coachingText}</span>
      </div>

      {cameraError ? (
        <div
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid #f87171',
            margin: '20px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fca5a5' }}>
            <AlertCircle size={28} />
            <h2 style={{ fontSize: '22px', margin: 0 }}>Camera Permission Needed</h2>
          </div>
          <p style={{ marginTop: '12px', color: 'var(--iris-ink)' }}>{cameraError}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="iris-btn primary" onClick={() => startCamera()}>
              <RefreshCw size={20} />
              <span>Retry Camera</span>
            </button>
            <button className="iris-btn" onClick={() => navigate('/upload')}>
              <span>Upload Image Instead</span>
            </button>
          </div>
        </div>
      ) : (
        /* Video Framing Guide */
        <div className="iris-frame-guide" aria-label="Camera framing view with dashed guide border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="iris-video-preview"
            aria-hidden="true"
          />
          <div className="iris-guide-corners" aria-hidden="true" />

          {/* Sample diagram overlay if camera feed is starting */}
          {!cameraActive && (
            <div
              style={{
                zIndex: 3,
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(8, 21, 46, 0.85)',
                borderRadius: '16px',
              }}
            >
              <Camera size={44} color="var(--iris-yellow)" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>Starting rear camera stream...</p>
            </div>
          )}
        </div>
      )}

      {/* Diagram Parts Breakdown when explained */}
      {step === 'done' && (
        <div
          style={{
            padding: '20px',
            borderRadius: '18px',
            background: 'var(--iris-panel)',
            border: '1px solid var(--iris-line)',
            borderLeft: '4px solid var(--iris-yellow)',
            margin: '18px 0',
          }}
          aria-live="polite"
        >
          <strong style={{ color: 'var(--iris-yellow)', fontSize: '18px', display: 'block' }}>
            Diagram breakdown: {DEMO_DIAGRAM.title}
          </strong>
          <p style={{ marginTop: '8px', color: 'var(--iris-ink)' }}>{DEMO_DIAGRAM.description}</p>
          <ul style={{ paddingLeft: '20px', color: 'var(--iris-muted)' }}>
            {DEMO_DIAGRAM.parts.map((p) => (
              <li key={p.name} style={{ margin: '6px 0' }}>
                <strong style={{ color: 'var(--iris-ink)' }}>{p.name}:</strong> {p.role}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
        {step === 'align' && (
          <>
            <button
              className="iris-btn primary"
              onClick={handlePageAligned}
              aria-label="Confirm page is aligned. Capture frame for Iris."
            >
              <Check size={22} aria-hidden="true" />
              <span>Page is aligned</span>
            </button>

            <button
              className="iris-btn subtle"
              onClick={handleRepeatCoaching}
              aria-label="Repeat camera coaching instruction out loud"
            >
              <RefreshCw size={20} aria-hidden="true" />
              <span>Repeat coaching instruction</span>
            </button>
          </>
        )}

        {(step === 'captured' || step === 'explaining') && (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--iris-yellow)' }}>
            <strong>Iris is analyzing the page...</strong>
          </div>
        )}

        {step === 'done' && (
          <>
            <button
              className="iris-btn primary"
              onClick={handleReturnToStudy}
              aria-label="Return to study session with this diagram explanation"
            >
              <span>Return to study session</span>
            </button>

            <button
              className="iris-btn"
              onClick={() => {
                setStep('align');
                setCoachingText('Hold your handout steady. Move the page closer.');
              }}
              aria-label="Try another page or diagram"
            >
              <RefreshCw size={20} aria-hidden="true" />
              <span>Try another page</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
