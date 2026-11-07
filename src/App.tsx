import { useEffect, useRef, useState } from 'react';
import type { GameState, Tetromino } from './game';
import { COLS, ROWS, ghostPiece, playGame, move, settle, hardDrop, rotate, holdPiece, togglePause } from './game';
import { initKeyboard, cleanupKeyboard } from './keyboard';
import ControlsOverlay from './ControlsOverlay';
import { sound } from './sound';
import './styles.css';

function MiniBoard({ piece }: { piece: Tetromino | null }) {
  const grid = Array.from({ length: 4 }, () => Array<boolean>(4).fill(false));
  if (piece?.cells) {
    piece.cells.forEach((pt) => {
      const lx = pt.x - piece.x;
      const ly = pt.y - piece.y;
      if (lx >= 0 && lx < 4 && ly >= 0 && ly < 4) grid[ly][lx] = true;
    });
  }
  return (
    <div className="mini-board" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const on = grid[r][c];
        return <div key={i} className={`mini-cell ${on && piece ? `color-${piece.id}` : ''}`} />;
      })}
    </div>
  );
}

function BoardView({ board, current, ghost }: { board: (number | null)[][]; current: Tetromino; ghost: Tetromino }) {
  const currentSet = new Set<number>();
  current.cells.forEach((p) => currentSet.add(p.y * COLS + p.x));
  const ghostSet = new Set<number>();
  ghost.cells.forEach((p) => ghostSet.add(p.y * COLS + p.x));

  return (
    <div className="board" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
      {Array.from({ length: ROWS * COLS }, (_, index) => {
        const r = Math.floor(index / COLS);
        const c = index % COLS;
        const id = board[r][c];
        let cls = 'cell';
        if (id !== null) cls += ` color-${id}`;
        if (ghostSet.has(index)) cls += ` ghost color-${ghost.id}`;
        if (currentSet.has(index)) cls += ` color-${current.id} tetromino`;
        return <div key={index} className={cls} />;
      })}
    </div>
  );
}

function handleGameAction(state: GameState, action: string): { newState: GameState; soundEffect?: string; clearLinesCount?: number } {
  let next = state;
  let snd = '';
  let linesBefore = state.lines;

  switch (action) {
    case 'arrowleft':
    case 'a':
      next = move(state, -1, 0);
      if (next !== state) snd = 'move';
      break;
    case 'arrowright':
    case 'd':
      next = move(state, 1, 0);
      if (next !== state) snd = 'move';
      break;
    case 'arrowdown':
    case 's':
      next = move(state, 0, 1);
      if (next !== state) snd = 'move';
      break;
    case ' ':
      next = hardDrop(state);
      snd = 'drop';
      break;
    case 'arrowup':
    case 'w':
    case 'z':
    case 'x':
      next = rotate(state);
      if (next !== state) snd = 'rotate';
      break;
    case 'c':
    case 'shift':
      next = holdPiece(state);
      if (next !== state) snd = 'rotate';
      break;
    case 'p':
    case 'escape':
      next = togglePause(state);
      break;
  }

  const cleared = next.lines - linesBefore;
  return {
    newState: next,
    soundEffect: snd,
    clearLinesCount: cleared > 0 ? cleared : undefined,
  };
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => playGame());
  const [showControls, setShowControls] = useState(false);
  const [muted, setMuted] = useState(false);
  const frameRef = useRef<number>(0);
  const actionQueueRef = useRef<string[]>([]);
  const elapsedRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  // Start background music on initial user interaction / load
  useEffect(() => {
    const startBgm = () => {
      sound.startMusic();
      window.removeEventListener('pointerdown', startBgm);
      window.removeEventListener('keydown', startBgm);
    };
    window.addEventListener('pointerdown', startBgm);
    window.addEventListener('keydown', startBgm);
    return () => {
      window.removeEventListener('pointerdown', startBgm);
      window.removeEventListener('keydown', startBgm);
      sound.stopMusic();
    };
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' ', 'a', 'd', 's', 'w', 'z', 'x', 'c', 'shift', 'p', 'escape'].includes(key)) {
        e.preventDefault();
        actionQueueRef.current.push(key);
      }
    };
    const onUp = (_e: KeyboardEvent) => {};
    initKeyboard(onDown, onUp);
    return () => cleanupKeyboard(onDown, onUp);
  }, []);

  const processAction = (action: string) => {
    setGame((prev) => {
      const { newState, soundEffect, clearLinesCount } = handleGameAction(prev, action);
      if (soundEffect === 'move') sound.playMove();
      if (soundEffect === 'rotate') sound.playRotate();
      if (soundEffect === 'drop') sound.playDrop();
      if (clearLinesCount && clearLinesCount > 0) sound.playClear(clearLinesCount);
      if (newState.isGameOver && !prev.isGameOver) sound.playGameOver();
      return newState;
    });
  };

  useEffect(() => {
    const loop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      elapsedRef.current += delta;

      while (actionQueueRef.current.length > 0) {
        const action = actionQueueRef.current.shift()!;
        processAction(action);
      }

      const interval = Math.max(180, 900 - (game.level - 1) * 70);
      if (elapsedRef.current >= interval) {
        elapsedRef.current -= interval;
        setGame((prev) => {
          if (prev.isPaused || prev.isGameOver) return prev;
          const moved = move(prev, 0, 1);
          if (moved === prev) {
            const settled = settle(prev);
            const cleared = settled.lines - prev.lines;
            if (cleared > 0) sound.playClear(cleared);
            if (settled.isGameOver) sound.playGameOver();
            return settled;
          }
          return moved;
        });
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [game.level]);

  const ghost = ghostPiece(game);

  const toggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  return (
    <div className="tetris-app" aria-label="Tetris game">
      <div className="game-area">
        <BoardView board={game.board} current={game.current} ghost={ghost} />

        <aside className="side-row" aria-label="Game side panel">
          <div className="mini-block">
            <h3>Hold</h3>
            <MiniBoard piece={game.hold} />
          </div>

          <div className="mini-block">
            <h3>Next</h3>
            <MiniBoard piece={game.next} />
          </div>

          <div className="stats-card" aria-live="polite">
            <div className="stats-header">Game Info</div>
            <div className="stat"><span>Level</span><strong>{game.level}</strong></div>
            <div className="stat"><span>Skor</span><strong>{game.score}</strong></div>
            <div className="stat"><span>Garis</span><strong>{game.lines}</strong></div>
            <div className="stat"><span>High</span><strong>{game.highScore}</strong></div>
            <div className="stats-actions">
              <button className="controls-btn" onClick={() => setGame(playGame())}>Restart</button>
              <button className="controls-btn" onClick={() => setShowControls((v) => !v)}>
                {showControls ? 'Hide' : 'Controls'}
              </button>
              <button className="controls-btn audio-btn" onClick={toggleSound}>
                {muted ? 'Sound: Off' : 'Sound: On'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showControls && <ControlsOverlay onAction={processAction} />}

      {game.isPaused && (
        <div className="overlay">
          <h2>Pause</h2>
          <p>Tekan P / ESC untuk lanjut</p>
        </div>
      )}

      {game.isGameOver && (
        <div className="overlay game-over">
          <h2>Game Over</h2>
          <p>Skor akhir: {game.score}</p>
          <button onClick={() => setGame(playGame())}>Mulai Ulang</button>
        </div>
      )}
    </div>
  );
}
