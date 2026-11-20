import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Room, RoomEvent, Track, LocalVideoTrack, type RemoteParticipant } from 'livekit-client';
import { playAudioCue, setAudioCuesEnabled } from '../services/audioCues';
import { requestWakeLock, releaseWakeLock } from '../services/wakeLock';
import {
  DEMO_NOTES_TITLE,
  DEMO_QUIZ_QUESTIONS,
  GUIDED_LESSON_STEPS,
  type QuizQuestion,
} from '../services/demoData';
import {
  IrisSessionContext,
  type ChatMessage,
  type ConnectionStatus,
  type AgentState,
} from './IrisSessionContextTypes';

export function IrisSessionProvider({ children }: { children: ReactNode }) {
  // Saved profile and settings
  const [studentName, setStudentNameState] = useState<string>(() => {
    return localStorage.getItem('iris_student_name') || '';
  });
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('iris_onboarded') === 'true';
  });
  const isReturningStudent = Boolean(hasOnboarded && studentName);

  // Accessibility flags
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('iris_high_contrast') === 'true';
  });
  const [largeText, setLargeText] = useState<boolean>(() => {
    return localStorage.getItem('iris_large_text') === 'true';
  });
  const [audioCues, setAudioCues] = useState<boolean>(() => {
    return localStorage.getItem('iris_audio_cues') !== 'false';
  });

  // Session & LiveKit state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [currentSource, setCurrentSource] = useState<string>('General Biology (Cell Structure)');
  const [latestCaption, setLatestCaption] = useState<string>('Welcome. Tap Start to study with Iris.');
  const [transcripts, setTranscripts] = useState<ChatMessage[]>([]);
  const [isAudioPlaybackBlocked, setIsAudioPlaybackBlocked] = useState<boolean>(false);

  // LiveKit Room state
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Notes upload state
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  // Quiz state
  const [quizQuestions] = useState<QuizQuestion[]>(DEMO_QUIZ_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);

  // Demo step index for guided lesson simulation
  const demoStepRef = useRef<number>(0);

  // Apply visual modes to body
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('iris_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    if (largeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
    localStorage.setItem('iris_large_text', String(largeText));
  }, [largeText]);

  useEffect(() => {
    setAudioCuesEnabled(audioCues);
    localStorage.setItem('iris_audio_cues', String(audioCues));
  }, [audioCues]);

  // Append new transcript message
  const addTranscript = (speaker: 'iris' | 'student', text: string) => {
    const msg: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      speaker,
      text,
      timestamp: new Date(),
    };
    setTranscripts((prev) => [...prev, msg]);
    setLatestCaption(text);
  };

  // Helper for demo speech synthesis
  const speakDemo = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setAgentState('speaking');
        playAudioCue('speaking');
      };
      utterance.onend = () => {
        setAgentState('listening');
        playAudioCue('listening');
        onEnd?.();
      };
      utterance.onerror = () => {
        setAgentState('listening');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setAgentState('speaking');
      setTimeout(() => {
        setAgentState('listening');
        onEnd?.();
      }, 2400);
    }
  };

  // Camera handling
  const stopCamera = useCallback(async () => {
    if (livekitRoom) {
      await livekitRoom.localParticipant.setCameraEnabled(false);
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      setLocalVideoTrack(null);
    }
    setCameraActive(false);
  }, [livekitRoom, localVideoTrack]);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setCameraError(null);
      if (livekitRoom) {
        await livekitRoom.localParticipant.setCameraEnabled(true, {
          facingMode: 'environment',
        });
        const pub = livekitRoom.localParticipant.getTrackPublication(Track.Source.Camera);
        if (pub && pub.track) {
          setLocalVideoTrack(pub.track as LocalVideoTrack);
        }
        setCameraActive(true);
        playAudioCue('camera');
        return true;
      }

      // Local fallback for standalone/demo camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const lkTrack = new LocalVideoTrack(videoTrack);
        setLocalVideoTrack(lkTrack);
        setCameraActive(true);
        playAudioCue('camera');
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied or unavailable.';
      setCameraError(msg);
      return false;
    }
  }, [livekitRoom]);

  // Connect session
  const connectSession = async (preferredName?: string) => {
    const nameToUse = preferredName || studentName || 'Student';
    setConnectionStatus('connecting');
    playAudioCue('start');
    await requestWakeLock();

    try {
      const res = await fetch(`/api/token?name=${encodeURIComponent(nameToUse)}`);
      const data = await res.json();

      if (!data.configured || data.demoMode || !data.token) {
        setConnectionStatus('demo');
        addTranscript(
          'iris',
          `Hello ${nameToUse}! I'm Iris, your voice study tutor. We're ready in demo mode. You can ask questions, inspect a diagram with the camera, upload notes, or take a quiz.`
        );
        speakDemo(
          `Hello ${nameToUse}! I am Iris, your voice study tutor. We can read a page, explain cell structure, or quiz you for exam practice.`
        );
        return;
      }

      // Connect real LiveKit Room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.on(RoomEvent.Connected, () => {
        setConnectionStatus('connected');
        playAudioCue('listening');
        setAgentState('listening');
      });

      room.on(RoomEvent.Reconnecting, () => {
        setConnectionStatus('reconnecting');
      });

      room.on(RoomEvent.Reconnected, () => {
        setConnectionStatus('connected');
        setAgentState('listening');
      });

      room.on(RoomEvent.Disconnected, () => {
        setConnectionStatus('disconnected');
        setAgentState('idle');
      });

      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setIsAudioPlaybackBlocked(!room.canPlaybackAudio);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const irisSpeaking = speakers.some((s) => !s.isLocal);
        if (irisSpeaking) {
          setAgentState('speaking');
        } else {
          setAgentState('listening');
        }
      });

      // Data channel listener
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        try {
          const text = new TextDecoder().decode(payload);
          addTranscript(participant ? 'iris' : 'iris', text);
        } catch {
          // Ignore binary or non-text data
        }
      });

      // Live transcriptions from LiveKit room
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const isAgent = !participant || !participant.isLocal;
        const speaker = isAgent ? 'iris' : 'student';
        const fullText = segments
          .map((s) => s.text)
          .join(' ')
          .trim();
        if (fullText) {
          addTranscript(speaker, fullText);
          if (isAgent) {
            setLatestCaption(fullText);
          }
        }
      });

      await room.connect(data.serverUrl, data.token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setLivekitRoom(room);
      setConnectionStatus('connected');
      addTranscript('iris', `Connected to Iris room. Greet Iris to begin.`);
    } catch (err) {
      console.warn('LiveKit connection unavailable, switching to Demo Mode:', err);
      setConnectionStatus('demo');
      addTranscript(
        'iris',
        `Welcome ${nameToUse}. We're exploring in Demo Mode. I'm ready to teach cell biology, explain diagrams, or quiz you!`
      );
      speakDemo(`Welcome, ${nameToUse}. What would you like to understand today?`);
    }
  };

  const resumeAudioPlayback = async () => {
    if (livekitRoom) {
      await livekitRoom.startAudio();
      setIsAudioPlaybackBlocked(false);
    }
  };

  // Disconnect session
  const disconnectSession = async () => {
    playAudioCue('end');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (livekitRoom) {
      livekitRoom.disconnect();
      setLivekitRoom(null);
    }
    await stopCamera();
    await releaseWakeLock();
    setConnectionStatus('disconnected');
    setAgentState('idle');
    addTranscript('iris', 'Study session ended. Great work!');
  };

  // Mic toggle
  const toggleMic = async () => {
    if (livekitRoom) {
      const nextMuted = !isMicMuted;
      await livekitRoom.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMicMuted(nextMuted);
      playAudioCue(nextMuted ? 'thinking' : 'listening');
    } else {
      const nextMuted = !isMicMuted;
      setIsMicMuted(nextMuted);
      playAudioCue(nextMuted ? 'thinking' : 'listening');
      if (!nextMuted) {
        setAgentState('listening');
      }
    }
  };

  // Interrupt Iris speech immediately
  const interruptIris = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAgentState('listening');
    playAudioCue('listening');
    addTranscript('student', '[Interrupted Iris]');
  };

  // Send typed message
  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;
    addTranscript('student', text);
    playAudioCue('thinking');
    setAgentState('thinking');

    if (livekitRoom) {
      try {
        const encoder = new TextEncoder();
        await livekitRoom.localParticipant.publishData(encoder.encode(text), {
          reliable: true,
          topic: 'chat',
        });
      } catch (err) {
        console.error('Failed to send text to LiveKit room:', err);
      }
    } else {
      setTimeout(() => {
        let reply = "Let's break that down together. In a eukaryotic cell, structure determines function.";
        const lower = text.toLowerCase();
        if (lower.includes('mitochondria') || lower.includes('energy') || lower.includes('atp')) {
          reply = 'Mitochondria produce ATP through cellular respiration, powering every movement and reaction in your body.';
        } else if (lower.includes('ribosome') || lower.includes('protein')) {
          reply = 'Ribosomes read RNA instructions and build protein chains, like workers assembling parts in a workshop.';
        } else if (lower.includes('membrane')) {
          reply = 'The cell membrane is selectively permeable: it acts like a security gate, letting nutrients in while keeping waste out.';
        }
        addTranscript('iris', reply);
        speakDemo(reply);
      }, 1000);
    }
  };

  // Send teaching intent (guided discovery)
  const sendTeachingIntent = async (intent: 'step_by_step' | 'quick_recap' | 'read_as_written' | 'quiz_me') => {
    let promptText = '';
    if (intent === 'step_by_step') {
      promptText = 'Please teach this topic step by step, one idea at a time with signposts and everyday examples.';
      addTranscript('student', 'Teach step by step');
      const step = GUIDED_LESSON_STEPS[demoStepRef.current % GUIDED_LESSON_STEPS.length];
      demoStepRef.current += 1;
      const fullSpeech = `${step.title}. ${step.speech} Thinking question: ${step.checkQuestion}`;
      setTimeout(() => {
        addTranscript('iris', fullSpeech);
        speakDemo(fullSpeech);
      }, 700);
    } else if (intent === 'quick_recap') {
      promptText = 'Give me a quick recap of what we covered so far.';
      addTranscript('student', 'Give a quick recap');
      const recap = 'Quick recap: Mitochondria make ATP for energy, ribosomes assemble proteins, and the cell membrane regulates transport. Three essential roles.';
      setTimeout(() => {
        addTranscript('iris', recap);
        speakDemo(recap);
      }, 700);
    } else if (intent === 'read_as_written') {
      promptText = 'Read the exact text from the source notes or page.';
      addTranscript('student', 'Read as written');
      const text = 'Your notes say: All living organisms consist of one or more cells. Mitochondria generate ATP through aerobic cellular respiration.';
      setTimeout(() => {
        addTranscript('iris', text);
        speakDemo(text);
      }, 700);
    } else if (intent === 'quiz_me') {
      promptText = 'Quiz me on this material, one question at a time.';
      addTranscript('student', 'Quiz me');
      const quizIntro = "Let's test what you've learned. Question one: Which organelle releases most of the usable ATP energy in a cell?";
      setTimeout(() => {
        addTranscript('iris', quizIntro);
        speakDemo(quizIntro);
      }, 700);
    }

    if (livekitRoom) {
      try {
        const encoder = new TextEncoder();
        await livekitRoom.localParticipant.publishData(encoder.encode(promptText), { reliable: true });
      } catch {
        // Continue gracefully
      }
    }
  };

  // Voice commands
  const sendVoiceCommand = async (cmd: string) => {
    addTranscript('student', cmd);
    playAudioCue('thinking');
    setAgentState('thinking');

    setTimeout(() => {
      let reply = `Understood. Continuing with ${cmd}.`;
      const lower = cmd.toLowerCase();
      if (lower.includes('slower')) {
        reply = 'Adjusting pace. I will speak more slowly with longer pauses.';
      } else if (lower.includes('faster')) {
        reply = 'Understood. Picking up the pace.';
      } else if (lower.includes('simpler')) {
        reply = 'Think of pushing a loaded wheelbarrow on a farm: you need force and energy to overcome inertia. That energy comes from cellular ATP.';
      } else if (lower.includes('spell')) {
        reply = 'M-I-T-O-C-H-O-N-D-R-I-O-N. Mitochondrion.';
      } else if (lower.includes('step by step')) {
        reply = 'Step one: Nutrients enter the cell. Step two: Glycolysis splits glucose. Step three: Mitochondria convert this into ATP.';
      } else if (lower.includes('say that again')) {
        reply = 'Repeating: Mitochondria are the powerhouses that generate cellular energy through respiration.';
      } else if (lower.includes('stop')) {
        reply = 'Stopped.';
      }
      addTranscript('iris', reply);
      speakDemo(reply);
    }, 600);
  };

  // Upload notes handling
  const uploadNotesFile = async (file: File) => {
    setUploadedFileName(file.name);
    setUploadStatus('uploading');
    setUploadMessage(`Sending ${file.name} ( ${(file.size / 1024).toFixed(1)} KB)...`);
    playAudioCue('upload');

    if (livekitRoom) {
      try {
        const participant = livekitRoom.localParticipant as any;
        if (typeof participant.sendFile === 'function') {
          await participant.sendFile(file, { topic: 'notes' });
        } else if (typeof participant.streamBytes === 'function') {
          const buffer = await file.arrayBuffer();
          const writer = await participant.streamBytes({ topic: 'notes' });
          await writer.write(new Uint8Array(buffer));
          await writer.close();
        } else {
          const buffer = await file.arrayBuffer();
          await participant.publishData(new Uint8Array(buffer), {
            reliable: true,
            topic: 'notes',
          });
        }
        setUploadStatus('ready');
        setCurrentSource(file.name);
        const readyMsg = `Your notes from ${file.name} are loaded into Iris. Would you like an explanation of the core concepts, key points, or a practice quiz?`;
        setUploadMessage(readyMsg);
        addTranscript('iris', readyMsg);
        speakDemo(readyMsg);
      } catch (err) {
        console.warn('Byte stream upload error:', err);
        setUploadStatus('ready');
        setCurrentSource(file.name);
        const fallbackMsg = `File ${file.name} received. I will teach from these notes.`;
        setUploadMessage(fallbackMsg);
        addTranscript('iris', fallbackMsg);
        speakDemo(fallbackMsg);
      }
    } else {
      setTimeout(() => {
        setUploadStatus('processing');
        setUploadMessage('Extracting document sections and key terms...');
        setTimeout(() => {
          setUploadStatus('ready');
          setCurrentSource(file.name);
          const orientationMsg = `These notes cover ${file.name}. We can work through them together, one idea at a time. Choose Explain, Key points, or Quiz me.`;
          setUploadMessage(orientationMsg);
          addTranscript('iris', orientationMsg);
          speakDemo(orientationMsg);
        }, 1200);
      }, 800);
    }
  };

  const useDemoNotes = () => {
    setUploadedFileName(DEMO_NOTES_TITLE);
    setUploadStatus('ready');
    setCurrentSource(DEMO_NOTES_TITLE);
    playAudioCue('upload');
    const msg = `Loaded ${DEMO_NOTES_TITLE}. These university biology notes cover cell structures, organelle functions, and membrane transport. How shall we begin?`;
    setUploadMessage(msg);
    addTranscript('iris', msg);
    speakDemo(msg);
  };

  // Quiz actions
  const selectQuizAnswer = (index: number) => {
    if (isAnswerConfirmed) return;
    setSelectedAnswer(index);
    playAudioCue('thinking');
  };

  const confirmQuizAnswer = useCallback(() => {
    if (selectedAnswer === null || isAnswerConfirmed) return;
    setIsAnswerConfirmed(true);

    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;

    if (isCorrect) {
      setScore((s) => s + 1);
      playAudioCue('correct');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // Ignore
        }
      }
    } else {
      playAudioCue('incorrect');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([25, 35, 25]);
        } catch {
          // Ignore
        }
      }
    }

    const feedbackText = isCorrect
      ? question.explanation
      : `Not quite. Option ${String.fromCharCode(65 + question.correct)}, ${question.options[question.correct]}, is correct. ${question.explanation}`;

    speakDemo(feedbackText);
  }, [selectedAnswer, isAnswerConfirmed, quizQuestions, currentQuestionIndex]);

  const nextQuizQuestion = () => {
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswerConfirmed(false);
      const nextQ = quizQuestions[currentQuestionIndex + 1];
      speakDemo(`Question ${currentQuestionIndex + 2}: ${nextQ.question}`);
    } else {
      setIsQuizFinished(true);
      playAudioCue('start');
      const finalMsg = `Quiz complete! You scored ${score} out of ${quizQuestions.length}. Review the membrane transport section for extra practice.`;
      speakDemo(finalMsg);
    }
  };

  const retryCurrentQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerConfirmed(false);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerConfirmed(false);
    setScore(0);
    setIsQuizFinished(false);
  };

  // Profile methods
  const confirmStudentName = (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return;
    setStudentNameState(cleaned);
    setHasOnboarded(true);
    localStorage.setItem('iris_student_name', cleaned);
    localStorage.setItem('iris_onboarded', 'true');
    playAudioCue('start');
  };

  const clearLocalData = () => {
    localStorage.removeItem('iris_student_name');
    localStorage.removeItem('iris_onboarded');
    setStudentNameState('');
    setHasOnboarded(false);
  };

  return (
    <IrisSessionContext.Provider
      value={{
        studentName,
        isReturningStudent,
        hasOnboarded,
        setStudentName: setStudentNameState,
        confirmStudentName,
        highContrast,
        largeText,
        audioCues,
        toggleHighContrast: () => setHighContrast((v) => !v),
        toggleLargeText: () => setLargeText((v) => !v),
        toggleAudioCues: () => setAudioCues((v) => !v),
        clearLocalData,
        connectionStatus,
        agentState,
        livekitRoom,
        connectSession,
        disconnectSession,
        isAudioPlaybackBlocked,
        resumeAudioPlayback,
        isMicMuted,
        toggleMic,
        interruptIris,
        currentSource,
        latestCaption,
        transcripts,
        sendTextMessage,
        sendTeachingIntent,
        sendVoiceCommand,
        cameraActive,
        localVideoTrack,
        cameraError,
        startCamera,
        stopCamera,
        uploadedFileName,
        uploadStatus,
        uploadMessage,
        uploadNotesFile,
        useDemoNotes,
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
      }}
    >
      {children}
    </IrisSessionContext.Provider>
  );
}
