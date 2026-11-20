import { createContext } from 'react';
import type { Room, LocalVideoTrack } from 'livekit-client';
import type { QuizQuestion } from '../services/demoData';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'demo';
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  id: string;
  speaker: 'iris' | 'student';
  text: string;
  timestamp: Date;
}

export interface IrisSessionContextValue {
  // Student Profile
  studentName: string;
  isReturningStudent: boolean;
  hasOnboarded: boolean;
  setStudentName: (name: string) => void;
  confirmStudentName: (name: string) => void;

  // Accessibility
  highContrast: boolean;
  largeText: boolean;
  audioCues: boolean;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleAudioCues: () => void;
  clearLocalData: () => void;

  // Connection & Room
  connectionStatus: ConnectionStatus;
  agentState: AgentState;
  livekitRoom: Room | null;
  connectSession: (preferredName?: string) => Promise<void>;
  disconnectSession: () => void;
  isAudioPlaybackBlocked: boolean;
  resumeAudioPlayback: () => Promise<void>;

  // Voice & Interaction
  isMicMuted: boolean;
  toggleMic: () => Promise<void>;
  interruptIris: () => void;
  currentSource: string;
  latestCaption: string;
  transcripts: ChatMessage[];
  sendTextMessage: (text: string) => Promise<void>;
  sendTeachingIntent: (intent: 'step_by_step' | 'quick_recap' | 'read_as_written' | 'quiz_me') => Promise<void>;
  sendVoiceCommand: (cmd: string) => Promise<void>;

  // Camera
  cameraActive: boolean;
  localVideoTrack: LocalVideoTrack | null;
  cameraError: string | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => Promise<void>;

  // Notes
  uploadedFileName: string;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  uploadMessage: string;
  uploadNotesFile: (file: File) => Promise<void>;
  useDemoNotes: () => void;

  // Quiz State
  quizQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  isAnswerConfirmed: boolean;
  score: number;
  isQuizFinished: boolean;
  selectQuizAnswer: (index: number) => void;
  confirmQuizAnswer: () => void;
  nextQuizQuestion: () => void;
  retryCurrentQuestion: () => void;
  resetQuiz: () => void;
}

export const IrisSessionContext = createContext<IrisSessionContextValue | null>(null);
