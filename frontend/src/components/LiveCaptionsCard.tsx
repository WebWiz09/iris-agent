import { useIrisSession } from '../context/useIrisSession';

interface LiveCaptionsCardProps {
  onOpenSheet: () => void;
}

export function LiveCaptionsCard({ onOpenSheet }: LiveCaptionsCardProps) {
  const { latestCaption, agentState } = useIrisSession();

  return (
    <button
      className="iris-glass-trigger"
      onClick={onOpenSheet}
      aria-haspopup="dialog"
      aria-label="Live captions and conversation history, tap to open full transcript"
    >
      <span className="iris-glass-indicator" aria-hidden="true" />
      <div>
        <span className="iris-glass-title">
          Live captions {agentState === 'speaking' ? '• Speaking' : ''}
        </span>
        <span className="iris-glass-preview" aria-live="polite">
          {latestCaption || 'Listening to your question...'}
        </span>
      </div>
      <span className="iris-glass-arrow" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
