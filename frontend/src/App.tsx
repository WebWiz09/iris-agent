import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RoomAudioRenderer, RoomContext } from '@livekit/components-react';
import '@livekit/components-styles';
import './styles/iris.css';

import { IrisSessionProvider } from './context/IrisSessionContext';
import { useIrisSession } from './context/useIrisSession';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { WelcomePage } from './pages/WelcomePage';
import { StudyPage } from './pages/StudyPage';
import { CameraPage } from './pages/CameraPage';
import { UploadPage } from './pages/UploadPage';
import { QuizPage } from './pages/QuizPage';
import { AccessibilityPage } from './pages/AccessibilityPage';

// Route announcer for accessible document titles and focus management
function RouteAnnouncer() {
  const location = useLocation();

  useEffect(() => {
    let title = 'Iris — Voice Study Tutor';
    switch (location.pathname) {
      case '/study':
        title = 'Study Session — Iris';
        break;
      case '/camera':
        title = 'Page Camera & Diagram Coaching — Iris';
        break;
      case '/upload':
        title = 'Course Notes & Document Upload — Iris';
        break;
      case '/quiz':
        title = 'Quiz & Exam Practice — Iris';
        break;
      case '/accessibility':
        title = 'Accessibility Settings — Iris';
        break;
      default:
        title = 'Iris — Voice Study Tutor';
    }
    document.title = title;

    // Focus main heading when navigating
    const mainHeading = document.querySelector('h1');
    if (mainHeading) {
      mainHeading.focus?.();
    }
  }, [location.pathname]);

  return null;
}

// LiveKit Audio Renderer wrapper
function LiveKitAudioRenderer() {
  const { livekitRoom } = useIrisSession();

  if (!livekitRoom) return null;

  return (
    <RoomContext.Provider value={livekitRoom}>
      <RoomAudioRenderer />
    </RoomContext.Provider>
  );
}

function MainLayout() {
  const { highContrast, largeText } = useIrisSession();

  return (
    <div
      className={`iris-root ${highContrast ? 'high-contrast' : ''} ${
        largeText ? 'large-text' : ''
      }`}
    >
      <a href="#main-content" className="iris-skip-link">
        Skip to main content
      </a>

      <Header />
      <RouteAnnouncer />

      <main id="main-content" className="iris-main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Navigation />
      <LiveKitAudioRenderer />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <IrisSessionProvider>
        <MainLayout />
      </IrisSessionProvider>
    </BrowserRouter>
  );
}

export default App;
