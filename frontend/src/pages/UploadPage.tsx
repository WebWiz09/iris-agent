import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, ArrowLeft, BookOpen, List, CheckSquare } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

export function UploadPage() {
  const navigate = useNavigate();
  const {
    uploadedFileName,
    uploadStatus,
    uploadMessage,
    uploadNotesFile,
    useDemoNotes,
    sendTeachingIntent,
  } = useIrisSession();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds the 10 MB limit. Please select a smaller document or text file.');
      return;
    }

    await uploadNotesFile(file);
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], 'pasted_lecture_notes.txt', { type: 'text/plain' });
    await uploadNotesFile(file);
    setShowPasteBox(false);
  };

  const handleAction = async (action: 'explain' | 'key_points' | 'quiz_me') => {
    if (action === 'explain') {
      await sendTeachingIntent('step_by_step');
      navigate('/study');
    } else if (action === 'key_points') {
      await sendTeachingIntent('quick_recap');
      navigate('/study');
    } else if (action === 'quiz_me') {
      navigate('/quiz');
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

      <span className="iris-step-tag">Course Documents & Handouts</span>
      <h1 className="iris-screen-heading">Bring your course notes</h1>
      <p className="iris-screen-subheading">
        Upload PDF, text, or image handouts up to 10 MB. Iris grounds explanations and exam quizzes in your material.
      </p>

      {/* File Picker Box */}
      <div
        className="iris-file-picker"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Choose a file from device. Supports PDF, text, or images up to 10 megabytes."
      >
        <div className="iris-file-icon" aria-hidden="true">
          PDF
        </div>
        <div>
          <strong style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>
            Choose a local file
          </strong>
          <p style={{ margin: 0, color: 'var(--iris-muted)' }}>
            PDF, TXT, or images • Max 10 MB • Stays on device or streams to Iris
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,text/plain,application/pdf,image/*"
          className="iris-hidden-file-input"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Quick Action: Try Demo Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', margin: '14px 0' }}>
        <button
          className="iris-btn"
          onClick={useDemoNotes}
          aria-label="Use demo notes: Cell Structure and Organelle function"
        >
          <FileText size={20} color="var(--iris-yellow)" aria-hidden="true" />
          <span>Use demo notes</span>
        </button>

        <button
          className="iris-btn subtle"
          onClick={() => setShowPasteBox((v) => !v)}
          aria-expanded={showPasteBox}
          aria-label="Paste text directly from clipboard"
        >
          <span>{showPasteBox ? 'Hide paste box' : 'Paste notes text'}</span>
        </button>
      </div>

      {/* Optional Paste Area */}
      {showPasteBox && (
        <div style={{ margin: '16px 0', padding: '16px', borderRadius: '16px', background: 'var(--iris-panel)', border: '1px solid var(--iris-line)' }}>
          <label htmlFor="pasted-notes-area" style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>
            Paste lecture notes or transcript:
          </label>
          <textarea
            id="pasted-notes-area"
            rows={5}
            className="iris-input"
            style={{ minHeight: '120px', width: '100%', resize: 'vertical' }}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your syllabus, notes, or exam questions here..."
          />
          <button
            className="iris-btn primary"
            style={{ marginTop: '10px' }}
            onClick={handlePasteSubmit}
            disabled={!pastedText.trim()}
          >
            <span>Load pasted notes</span>
          </button>
        </div>
      )}

      {/* Status & Feedback Area */}
      {uploadedFileName && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'var(--iris-panel-raised)',
            border: '1px solid var(--iris-line)',
            margin: '18px 0',
          }}
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--iris-yellow)', fontWeight: 700 }}>
            <CheckCircle2 size={22} />
            <span>Selected: {uploadedFileName}</span>
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--iris-ink)' }}>{uploadMessage}</p>
        </div>
      )}

      {/* Orientation Actions when notes are ready */}
      {uploadStatus === 'ready' && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--iris-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            What would you like Iris to do with these notes?
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <button
              className="iris-btn primary"
              onClick={() => handleAction('explain')}
              aria-label="Explain: Teach guided concepts step by step from this document"
            >
              <BookOpen size={22} aria-hidden="true" />
              <span>
                Explain
                <span className="button-note">Guided teaching step by step from your notes</span>
              </span>
            </button>

            <button
              className="iris-btn"
              onClick={() => handleAction('key_points')}
              aria-label="Key points: Summarize the main exam takeaways from this document"
            >
              <List size={22} aria-hidden="true" />
              <span>
                Key points
                <span className="button-note">Three-point summary of core exam ideas</span>
              </span>
            </button>

            <button
              className="iris-btn"
              onClick={() => handleAction('quiz_me')}
              aria-label="Quiz me: Generate a five-question practice quiz grounded in this document"
            >
              <CheckSquare size={22} aria-hidden="true" />
              <span>
                Quiz me
                <span className="button-note">Exam practice multiple-choice test</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
