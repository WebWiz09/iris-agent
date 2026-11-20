import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

export function QuizPage() {
  const navigate = useNavigate();
  const {
    quizQuestions,
    currentQuestionIndex,
    selectedAnswer,
    isAnswerConfirmed,
    score,
    isQuizFinished,
    selectQuizAnswer,
    confirmQuizAnswer,
    nextQuizQuestion,
    retryCurrentQuestion,
    resetQuiz,
  } = useIrisSession();

  // Mode: 'practice' (untimed, instant feedback) vs 'timed' (CBT exam mode)
  const [mode, setMode] = useState<'practice' | 'timed'>('practice');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180); // 3 minutes
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [hasStartedTiming, setHasStartedTiming] = useState<boolean>(false);

  const currentQ = quizQuestions[currentQuestionIndex];

  // Timer effect for Timed CBT
  useEffect(() => {
    if (mode !== 'timed' || isTimerPaused || !hasStartedTiming || isQuizFinished) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          confirmQuizAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isTimerPaused, hasStartedTiming, isQuizFinished, confirmQuizAnswer]);

  // Keyboard navigation for answers (A/B/C/D or 1/2/3/4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isQuizFinished) return;
      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') selectQuizAnswer(0);
      else if (key === 'B' || key === '2') selectQuizAnswer(1);
      else if (key === 'C' || key === '3') selectQuizAnswer(2);
      else if (key === 'D' || key === '4') selectQuizAnswer(3);
      else if (e.key === 'Enter' && selectedAnswer !== null && !isAnswerConfirmed) {
        confirmQuizAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnswer, isAnswerConfirmed, isQuizFinished, selectQuizAnswer, confirmQuizAnswer]);

  const handleReadQuestionAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const optionsText = currentQ.options
      .map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`)
      .join('. ');
    const speech = `Question ${currentQuestionIndex + 1}: ${currentQ.question}. Options: ${optionsText}.`;
    const u = new SpeechSynthesisUtterance(speech);
    window.speechSynthesis.speak(u);
    setHasStartedTiming(true);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isQuizFinished) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    return (
      <div className="iris-container">
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'var(--iris-yellow)',
              color: 'var(--iris-yellow-ink)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
            aria-hidden="true"
          >
            <Award size={48} />
          </div>

          <span className="iris-step-tag">Quiz Complete</span>
          <h1 className="iris-screen-heading">Great practice session!</h1>

          <div
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--iris-panel)',
              border: '2px solid var(--iris-line)',
              maxWidth: '480px',
              margin: '24px auto',
            }}
          >
            <span style={{ fontSize: '18px', color: 'var(--iris-muted)', display: 'block' }}>
              Your Score
            </span>
            <div
              style={{
                fontSize: '56px',
                fontWeight: 700,
                fontFamily: 'Space Grotesk',
                color: 'var(--iris-yellow)',
                margin: '8px 0',
              }}
            >
              {score} / {quizQuestions.length}
            </div>
            <p style={{ margin: 0, fontSize: '20px', color: 'var(--iris-ink)' }}>
              {percentage}% accuracy ({percentage >= 80 ? 'Excellent mastery' : 'Good progress'})
            </p>
          </div>

          <p style={{ color: 'var(--iris-muted)', fontSize: '18px', maxWidth: '540px', margin: '0 auto 32px' }}>
            Review tip: Double-check the distinction between smooth and rough endoplasmic reticulum before your test.
          </p>

          <div style={{ display: 'grid', gap: '12px', maxWidth: '480px', margin: '0 auto' }}>
            <button
              className="iris-btn primary"
              onClick={() => {
                resetQuiz();
                navigate('/study');
              }}
              aria-label="Return to study session"
            >
              <span>Return to Study</span>
            </button>

            <button
              className="iris-btn"
              onClick={() => resetQuiz()}
              aria-label="Repeat quiz from beginning"
            >
              <RefreshCw size={20} aria-hidden="true" />
              <span>Retry this quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="iris-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          className="iris-btn subtle"
          style={{ width: 'auto', minHeight: '52px', padding: '8px 16px' }}
          onClick={() => navigate('/study')}
          aria-label="End quiz and return to study session"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Exit quiz</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`iris-btn ${mode === 'practice' ? 'primary' : 'subtle'}`}
            style={{ width: 'auto', minHeight: '48px', padding: '6px 14px', fontSize: '15px' }}
            onClick={() => setMode('practice')}
            aria-pressed={mode === 'practice'}
          >
            Practice (Untimed)
          </button>
          <button
            className={`iris-btn ${mode === 'timed' ? 'primary' : 'subtle'}`}
            style={{ width: 'auto', minHeight: '48px', padding: '6px 14px', fontSize: '15px' }}
            onClick={() => {
              setMode('timed');
              setHasStartedTiming(true);
            }}
            aria-pressed={mode === 'timed'}
          >
            Timed CBT
          </button>
        </div>
      </div>

      {/* Question Progress and Timer Bar */}
      <div className="iris-quiz-top">
        <span className="iris-step-tag" style={{ margin: 0 }}>
          Quick Check • Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </span>

        {mode === 'timed' && (
          <div className="iris-timer-box">
            <Clock size={20} color="var(--iris-yellow)" aria-hidden="true" />
            <span aria-label={`${secondsRemaining} seconds remaining`}>
              {formatTimer(secondsRemaining)}
            </span>
            <button
              className="iris-timer-btn"
              onClick={() => setIsTimerPaused((v) => !v)}
              aria-label={isTimerPaused ? 'Resume exam timer' : 'Pause exam timer'}
            >
              {isTimerPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              className="iris-timer-btn"
              onClick={() => setSecondsRemaining((s) => s + 30)}
              aria-label="Add 30 seconds to exam timer"
            >
              <Plus size={18} />
              <span>30s</span>
            </button>
          </div>
        )}
      </div>

      {/* Spoken Question Narration Helper */}
      <button
        className="iris-btn subtle"
        style={{ minHeight: '52px', padding: '8px 14px', margin: '8px 0', fontSize: '16px' }}
        onClick={handleReadQuestionAloud}
        aria-label="Read question and all choices aloud"
      >
        <Volume2 size={20} color="var(--iris-yellow)" aria-hidden="true" />
        <span>Read question & choices aloud</span>
      </button>

      {/* Question Title */}
      <h1 className="iris-quiz-question">{currentQ.question}</h1>

      {/* Answer Options A - D */}
      <div className="iris-answer-list" role="radiogroup" aria-label="Multiple choice answers">
        {currentQ.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedAnswer === idx;
          const isCorrect = idx === currentQ.correct;

          let btnClass = 'iris-answer-btn';
          if (isSelected) btnClass += ' selected';
          if (isAnswerConfirmed) {
            if (isCorrect) btnClass += ' correct';
            else if (isSelected && !isCorrect) btnClass += ' incorrect';
          }

          return (
            <button
              key={option}
              className={btnClass}
              onClick={() => selectQuizAnswer(idx)}
              role="radio"
              aria-checked={isSelected}
              disabled={isAnswerConfirmed}
              aria-label={`Option ${letter}: ${option}${
                isAnswerConfirmed
                  ? isCorrect
                    ? ' — Correct answer'
                    : isSelected
                      ? ' — Your incorrect answer'
                      : ''
                  : isSelected
                    ? ' — Selected'
                    : ''
              }`}
            >
              <span className="iris-answer-letter">{letter}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback area */}
      {isAnswerConfirmed && (
        <div
          className="iris-quiz-feedback"
          role="region"
          aria-live="assertive"
          style={{
            borderLeft: `4px solid ${
              selectedAnswer === currentQ.correct ? '#34d399' : '#f87171'
            }`,
          }}
        >
          <strong style={{ display: 'block', marginBottom: '6px' }}>
            {selectedAnswer === currentQ.correct ? '✓ Correct!' : '✗ Not quite.'}
          </strong>
          {currentQ.explanation}
        </div>
      )}

      {/* Action controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
        {!isAnswerConfirmed ? (
          <>
            <button
              className="iris-btn subtle"
              onClick={retryCurrentQuestion}
              disabled={selectedAnswer === null}
              aria-label="Clear current selection"
            >
              <span>Clear choice</span>
            </button>

            <button
              className="iris-btn primary"
              onClick={confirmQuizAnswer}
              disabled={selectedAnswer === null}
              aria-label="Confirm your selected answer"
            >
              <CheckCircle2 size={20} aria-hidden="true" />
              <span>Confirm answer</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="iris-btn subtle"
              onClick={retryCurrentQuestion}
              aria-label="Retry this question"
            >
              <RefreshCw size={20} aria-hidden="true" />
              <span>Retry question</span>
            </button>

            <button
              className="iris-btn primary"
              onClick={nextQuizQuestion}
              aria-label={
                currentQuestionIndex + 1 >= quizQuestions.length
                  ? 'Finish quiz and view results'
                  : 'Proceed to next question'
              }
            >
              <span>
                {currentQuestionIndex + 1 >= quizQuestions.length ? 'View Results' : 'Next Question'}
              </span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
