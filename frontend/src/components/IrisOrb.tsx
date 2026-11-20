import type { AgentState } from '../context/IrisSessionContextTypes';

interface IrisOrbProps {
  state: AgentState;
}

export function IrisOrb({ state }: IrisOrbProps) {
  const stateClass =
    state === 'listening'
      ? 'iris-orb-listening'
      : state === 'speaking'
        ? 'iris-orb-speaking'
        : state === 'thinking'
          ? 'iris-orb-thinking'
          : 'iris-orb-idle';

  return (
    <div className="iris-orb-wrapper">
      <div className={`iris-orb ${stateClass}`} aria-hidden="true">
        <div className="iris-orb-body">
          <span className="iris-orb-membrane membrane-one" />
          <span className="iris-orb-membrane membrane-two" />
          <span className="iris-orb-membrane membrane-three" />
          <span className="iris-orb-cloud" />
        </div>

        {state === 'listening' && (
          <svg className="iris-listening-eye" viewBox="0 0 220 140" focusable="false">
            <path className="iris-eye-contour" d="M12 70 Q110 -19 208 70 Q110 159 12 70Z" />
            <g className="iris-eye-look">
              <circle className="iris-eye-iris" cx="110" cy="70" r="32" />
              <circle className="iris-eye-pupil" cx="110" cy="70" r="16" />
              <circle className="iris-eye-highlight" cx="101" cy="60" r="5" />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
