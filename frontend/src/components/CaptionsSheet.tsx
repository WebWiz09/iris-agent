import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Send, X } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

interface CaptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaptionsSheet({ isOpen, onClose }: CaptionsSheetProps) {
  const { transcripts, sendTextMessage } = useIrisSession();
  const [typedMessage, setTypedMessage] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      closeBtnRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, transcripts.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    sendTextMessage(typedMessage.trim());
    setTypedMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="iris-dialog"
      aria-modal="true"
      aria-labelledby="captions-dialog-title"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="iris-sheet">
        <div className="iris-sheet-handle" aria-hidden="true" />
        <header className="iris-sheet-header">
          <div>
            <span className="iris-step-tag" style={{ margin: 0 }}>
              Full Conversation
            </span>
            <h2 id="captions-dialog-title">Captions & Reply</h2>
          </div>
          <button
            ref={closeBtnRef}
            className="iris-sheet-close"
            type="button"
            onClick={onClose}
            aria-label="Close captions sheet"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <div className="iris-sheet-body">
          <div className="iris-transcript-stream" role="log" aria-label="Conversation history">
            {transcripts.length === 0 ? (
              <p style={{ color: 'var(--iris-muted)', textAlign: 'center', marginTop: 32 }}>
                No spoken turns yet. Say "Hi Iris" or type a message below.
              </p>
            ) : (
              transcripts.map((msg) => (
                <div
                  key={msg.id}
                  className={`iris-chat-bubble ${msg.speaker === 'iris' ? 'agent' : 'user'}`}
                >
                  <strong>{msg.speaker === 'iris' ? 'Iris' : 'You'}</strong>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 'auto' }}>
            <label htmlFor="typed-chat-input" className="sr-only">
              Type a question or message for Iris
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="typed-chat-input"
                className="iris-input"
                style={{ margin: 0 }}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type a question or command..."
              />
              <button
                type="submit"
                className="iris-btn primary"
                style={{ minHeight: '64px', width: 'auto', padding: '0 20px', flexShrink: 0 }}
                aria-label="Send typed message"
                disabled={!typedMessage.trim()}
              >
                <Send size={20} aria-hidden="true" />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}
