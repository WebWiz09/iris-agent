import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

const COMMANDS = [
  { phrase: 'say that again', description: 'Repeat the last point in simpler words' },
  { phrase: 'slower', description: 'Request Iris to speak more slowly' },
  { phrase: 'faster', description: 'Request Iris to speak more quickly' },
  { phrase: 'simpler', description: 'Explain with an everyday Nigerian example' },
  { phrase: 'spell it', description: 'Spell out the word letter by letter' },
  { phrase: 'step by step', description: 'Break the idea or calculation into spoken steps' },
  { phrase: 'go back', description: 'Return to the previous point' },
  { phrase: 'stop', description: 'Stop speaking immediately' },
  { phrase: 'read this page', description: 'Read directly from your notes or camera' },
  { phrase: 'quiz me', description: 'Start a practice exam quiz' },
];

export function VoiceCommandsDisclosure() {
  const [isOpen, setIsOpen] = useState(false);
  const { sendVoiceCommand } = useIrisSession();

  return (
    <div
      style={{
        margin: '18px 0',
        border: '1px solid var(--iris-line)',
        borderRadius: '16px',
        background: 'var(--iris-panel)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        className="iris-btn subtle"
        style={{
          minHeight: '60px',
          justifyContent: 'space-between',
          border: 'none',
          padding: '14px 18px',
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="voice-commands-list"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={20} color="var(--iris-yellow)" aria-hidden="true" />
          <span>What can I say to Iris?</span>
        </span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div
          id="voice-commands-list"
          style={{
            padding: '12px 18px 18px',
            borderTop: '1px solid rgba(98, 117, 146, 0.3)',
          }}
        >
          <p style={{ color: 'var(--iris-muted)', fontSize: '15px', marginTop: 0 }}>
            You can say any of these out loud at any time, or click to send as a command:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px',
            }}
          >
            {COMMANDS.map((cmd) => (
              <button
                key={cmd.phrase}
                type="button"
                className="iris-btn"
                style={{
                  minHeight: '60px',
                  padding: '10px 14px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
                onClick={() => sendVoiceCommand(cmd.phrase)}
                aria-label={`Say: ${cmd.phrase} — ${cmd.description}`}
              >
                <strong style={{ color: 'var(--iris-yellow)' }}>"{cmd.phrase}"</strong>
                <span style={{ fontSize: '14px', color: 'var(--iris-muted)', fontWeight: 400 }}>
                  {cmd.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
