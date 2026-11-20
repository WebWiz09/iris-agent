import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mic, UserCheck, Edit3 } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

export function WelcomePage() {
  const navigate = useNavigate();
  const {
    studentName,
    isReturningStudent,
    confirmStudentName,
    connectSession,
  } = useIrisSession();

  // Onboarding sub-steps: 'welcome' | 'asking' | 'confirm'
  const [step, setStep] = useState<'welcome' | 'asking' | 'confirm'>('welcome');
  const [nameInput, setNameInput] = useState(studentName || '');

  const handleStart = async () => {
    if (isReturningStudent) {
      // Returning student: greet by name and go directly to study
      await connectSession(studentName);
      navigate('/study');
    } else {
      // First-time learner: proceed to name greeting
      setStep('asking');
    }
  };

  const handleSimulateVoiceName = () => {
    const sample = 'Amaka';
    setNameInput(sample);
    setStep('confirm');
  };

  const handleConfirmName = async () => {
    const finalName = nameInput.trim() || 'Student';
    confirmStudentName(finalName);
    await connectSession(finalName);
    navigate('/study');
  };

  const handleSkip = async () => {
    confirmStudentName('Friend');
    await connectSession('Friend');
    navigate('/study');
  };

  return (
    <div className="iris-welcome-screen">
      {step === 'welcome' && (
        <>
          <div className="iris-welcome-hero">
            <span className="iris-step-tag">Your Voice Study Companion</span>
            <h1 id="welcome-heading">
              Study on
              <br />
              your terms.
            </h1>
            <p>
              {isReturningStudent
                ? `Welcome back, ${studentName}! Your study checkpoint is ready.`
                : 'Ask a question. Hear a clear answer. Keep moving.'}
            </p>
          </div>

          <button
            className="iris-btn primary iris-start-btn"
            onClick={handleStart}
            aria-label={
              isReturningStudent
                ? `Resume study session as ${studentName}`
                : 'Start. Begin study and tell Iris your name by voice'
            }
          >
            <span>{isReturningStudent ? 'Resume study' : 'Start'}</span>
            <span className="iris-start-arrow" aria-hidden="true">
              →
            </span>
          </button>

          <p style={{ textAlign: 'center', color: 'var(--iris-muted)', fontSize: '16px' }}>
            Voice first. You are always in control. Touch targets 64px or larger.
          </p>
        </>
      )}

      {step === 'asking' && (
        <div style={{ maxWidth: '600px' }}>
          <span className="iris-step-tag">Getting Started • Step 1 of 2</span>
          <h1 className="iris-screen-heading">
            Let’s begin
            <br />
            with your name.
          </h1>

          <div
            className="iris-transcript-live"
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'var(--iris-panel)',
              border: '1px solid var(--iris-line)',
              borderLeft: '4px solid var(--iris-yellow)',
              margin: '20px 0',
            }}
            aria-live="polite"
          >
            <strong
              style={{
                color: 'var(--iris-yellow)',
                display: 'block',
                fontSize: '15px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              Iris is speaking
            </strong>
            “Hi, I’m Iris. What name would you like me to use?”
          </div>

          <div style={{ display: 'grid', gap: '14px', marginTop: '24px' }}>
            <button
              className="iris-btn primary"
              onClick={handleSimulateVoiceName}
              aria-label="Say name by simulated voice: Amaka"
            >
              <Mic size={24} aria-hidden="true" />
              <span>
                Say my name
                <span className="button-note">Voice input: “Amaka”</span>
              </span>
            </button>

            <div>
              <label
                htmlFor="student-name-input"
                style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--iris-muted)',
                  marginBottom: '4px',
                }}
              >
                Or type your name
              </label>
              <input
                id="student-name-input"
                className="iris-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                aria-label="Enter your preferred name"
              />
            </div>

            <button
              className="iris-btn"
              onClick={() => setStep('confirm')}
              disabled={!nameInput.trim()}
              aria-label="Continue with entered name"
            >
              <span>Continue</span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>

            <button
              className="iris-btn subtle"
              onClick={handleSkip}
              aria-label="Skip name entry and continue"
            >
              <span>Skip for now</span>
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div style={{ maxWidth: '600px' }}>
          <span className="iris-step-tag">Getting Started • Step 2 of 2</span>
          <h1 className="iris-screen-heading">Did I get that right?</h1>

          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--iris-panel)',
              border: '2px solid var(--iris-line)',
              margin: '20px 0',
              fontSize: '22px',
            }}
            aria-live="polite"
          >
            <strong
              style={{
                color: 'var(--iris-yellow)',
                display: 'block',
                fontSize: '15px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              Name Heard
            </strong>
            <span style={{ fontSize: '28px', fontWeight: 700 }}>{nameInput || 'Amaka'}</span>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            <button
              className="iris-btn primary"
              onClick={handleConfirmName}
              aria-label={`Yes, that's right. Start study session as ${nameInput || 'Amaka'}`}
            >
              <UserCheck size={24} aria-hidden="true" />
              <span>Yes, that’s right — Start Study</span>
            </button>

            <button
              className="iris-btn subtle"
              onClick={() => setStep('asking')}
              aria-label="Edit your name"
            >
              <Edit3 size={20} aria-hidden="true" />
              <span>Change name</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
