import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Props = { onAction: (action: string) => void };

type RepeatButtonProps = {
  action: string;
  label: ReactNode;
  ariaLabel: string;
  onAction: (action: string) => void;
  delay?: number;
  interval?: number;
  className?: string;
};

function RepeatButton({
  action,
  label,
  ariaLabel,
  onAction,
  delay = 220,
  interval = 70,
  className,
}: RepeatButtonProps) {
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    onAction(action);
    clearTimers();
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => onAction(action), interval);
    }, delay);
  }, [action, onAction, clearTimers, delay, interval]);

  const stop = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

export default function ControlsOverlay({ onAction }: Props) {
  const stableOnAction = useCallback((a: string) => onAction(a), [onAction]);

  return (
    <div className="controls-overlay" aria-label="Game controls">
      {/* Movement: left / soft drop / right with repeat */}
      <div className="controls-row">
        <RepeatButton
          action="arrowleft"
          label={<span className="ctrl-arrow">‹</span>}
          ariaLabel="Move left"
          onAction={stableOnAction}
        />
        <RepeatButton
          action="arrowdown"
          label={<span className="ctrl-arrow">↓</span>}
          ariaLabel="Soft drop"
          onAction={stableOnAction}
        />
        <RepeatButton
          action="arrowright"
          label={<span className="ctrl-arrow">›</span>}
          ariaLabel="Move right"
          onAction={stableOnAction}
        />
      </div>

      {/* Actions: rotate / hard drop / hold */}
      <div className="controls-row actions-row">
        <RepeatButton
          action="arrowup"
          label="↻"
          ariaLabel="Rotate"
          onAction={stableOnAction}
        />
        <RepeatButton
          action=" "
          label={<span className="ctrl-label">Drop</span>}
          ariaLabel="Hard drop"
          onAction={stableOnAction}
          className="wide"
        />
        <RepeatButton
          action="c"
          label={<span className="ctrl-label">Hold</span>}
          ariaLabel="Hold"
          onAction={stableOnAction}
        />
      </div>

      {/* Utility: pause */}
      <div className="controls-row pause-row">
        <RepeatButton
          action="p"
          label={<span className="ctrl-label">Pause</span>}
          ariaLabel="Pause"
          onAction={stableOnAction}
        />
      </div>
    </div>
  );
}
