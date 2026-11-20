import { NavLink, useLocation } from 'react-router-dom';
import { Headphones, UploadCloud, CheckSquare, Camera, Sliders } from 'lucide-react';
import { useIrisSession } from '../context/useIrisSession';

export function Navigation() {
  const location = useLocation();
  const { hasOnboarded, connectionStatus } = useIrisSession();

  // Hide nav on the very first welcome screen before start if not onboarded
  if (location.pathname === '/' && !hasOnboarded && connectionStatus === 'disconnected') {
    return null;
  }

  return (
    <nav className="iris-bottom-nav" aria-label="Main Navigation">
      <NavLink
        to="/study"
        className={({ isActive }) => `iris-nav-item ${isActive ? 'active' : ''}`}
        aria-current={location.pathname === '/study' ? 'page' : undefined}
        aria-label="Study session — voice tutor"
      >
        <Headphones aria-hidden="true" />
        <span>Study</span>
      </NavLink>

      <NavLink
        to="/upload"
        className={({ isActive }) => `iris-nav-item ${isActive ? 'active' : ''}`}
        aria-current={location.pathname === '/upload' ? 'page' : undefined}
        aria-label="Upload — course notes and documents"
      >
        <UploadCloud aria-hidden="true" />
        <span>Upload</span>
      </NavLink>

      <NavLink
        to="/quiz"
        className={({ isActive }) => `iris-nav-item ${isActive ? 'active' : ''}`}
        aria-current={location.pathname === '/quiz' ? 'page' : undefined}
        aria-label="Quiz — practice and exam preparation"
      >
        <CheckSquare aria-hidden="true" />
        <span>Quiz</span>
      </NavLink>

      <NavLink
        to="/camera"
        className={({ isActive }) => `iris-nav-item ${isActive ? 'active' : ''}`}
        aria-current={location.pathname === '/camera' ? 'page' : undefined}
        aria-label="Page camera — page coaching and diagrams"
      >
        <Camera aria-hidden="true" />
        <span>Camera</span>
      </NavLink>

      <NavLink
        to="/accessibility"
        className={({ isActive }) => `iris-nav-item ${isActive ? 'active' : ''}`}
        aria-current={location.pathname === '/accessibility' ? 'page' : undefined}
        aria-label="Accessibility — contrast, font size, and sound"
      >
        <Sliders aria-hidden="true" />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
