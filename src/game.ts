export const COLS = 10;
export const ROWS = 20;

export type Board = (number | null)[][];
export type Point = { x: number; y: number };
export type Tetromino = { id: number; cells: Point[]; x: number; y: number; rotation: number };
export type GameState = {
  board: Board;
  current: Tetromino;
  next: Tetromino;
  hold: Tetromino | null;
  score: number;
  level: number;
  lines: number;
  highScore: number;
  isPaused: boolean;
  isGameOver: boolean;
};

type Shape = number[][];

const SHAPES: Record<number, Shape[]> = {
  1: [[[1, 1], [1, 1]]],
  2: [[[0, 0, 0, 0], [2, 2, 2, 2]]],
  3: [[[0, 3, 3], [3, 3, 0]]],
  4: [[[4, 4, 0], [0, 4, 4]]],
  5: [[[0, 5, 0], [5, 5, 5]]],
  6: [[[6, 0, 0], [6, 6, 6]]],
  7: [[[0, 0, 7], [7, 7, 7]]],
};

const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<number | null>(COLS).fill(null));

function rotateShape(shape: Shape): Shape {
  const height = shape.length;
  const width = shape[0].length;
  return Array.from({ length: width }, (_, x) =>
    Array.from({ length: height }, (_, y) => shape[height - 1 - y][x]),
  );
}

function cellsFor(id: number, rotation: number, x: number, y: number): Point[] {
  let shape = SHAPES[id][0];
  for (let i = 0; i < rotation; i++) shape = rotateShape(shape);
  const cells: Point[] = [];
  shape.forEach((row, dy) =>
    row.forEach((value, dx) => {
      if (value) cells.push({ x: x + dx, y: y + dy });
    }),
  );
  return cells;
}

function fits(board: Board, cells: Point[]): boolean {
  return cells.every(p => p.x >= 0 && p.x < COLS && p.y >= 0 && p.y < ROWS && board[p.y][p.x] === null);
}

function piece(id: number): Tetromino {
  const p = { x: 3, y: 0, rotation: 0 };
  return { id, ...p, cells: cellsFor(id, p.rotation, p.x, p.y) };
}

function randomPiece(): Tetromino {
  return piece(Math.floor(Math.random() * 7) + 1);
}

function updateCells(current: Tetromino, x = current.x, y = current.y, rotation = current.rotation): Tetromino {
  return { ...current, x, y, rotation, cells: cellsFor(current.id, rotation, x, y) };
}

function lock(board: Board, current: Tetromino): Board {
  const next = board.map(row => [...row]);
  current.cells.forEach(p => {
    if (p.y >= 0 && p.y < ROWS && p.x >= 0 && p.x < COLS) next[p.y][p.x] = current.id;
  });
  return next;
}

function clearLines(board: Board): { board: Board; count: number } {
  const remaining = board.filter(row => row.some(cell => cell === null));
  const count = ROWS - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(Array<number | null>(COLS).fill(null));
  return { board: remaining, count };
}

export function move(state: GameState, dx: number, dy: number): GameState {
  const nextX = state.current.x + dx;
  const nextY = state.current.y + dy;
  const moved = updateCells(state.current, nextX, nextY);
  return fits(state.board, moved.cells) ? { ...state, current: moved } : state;
}

export function rotate(state: GameState): GameState {
  if (state.isPaused || state.isGameOver) return state;
  const rotation = (state.current.rotation + 1) % 4;
  for (const dx of [0, -1, 1, -2, 2]) {
    const rotated = updateCells(state.current, state.current.x + dx, state.current.y, rotation);
    if (fits(state.board, rotated.cells)) return { ...state, current: rotated };
  }
  return state;
}

export function settle(state: GameState): GameState {
  if (state.isPaused || state.isGameOver) return state;
  const moved = move(state, 0, 1);
  if (moved.current !== state.current) return moved;
  const cleared = clearLines(lock(state.board, state.current));
  const lines = state.lines + cleared.count;
  const level = Math.floor(lines / 10) + 1;
  const score = state.score + [0, 100, 300, 500, 800][cleared.count] * level;
  const current = state.next;
  const next = randomPiece();
  const gameOver = !fits(cleared.board, current.cells);
  const highScore = Math.max(state.highScore, score);
  if (typeof localStorage !== "undefined") localStorage.setItem("tetris-highScore", String(highScore));
  return { ...state, board: cleared.board, current, next, lines, level, score, highScore, isGameOver: gameOver };
}

export function hardDrop(state: GameState): GameState {
  let next = state;
  while (true) {
    const moved = move(next, 0, 1);
    if (moved.current === next.current) return settle(next);
    next = moved;
  }
}

export function holdPiece(state: GameState): GameState {
  if (state.isPaused || state.isGameOver) return state;
  if (!state.hold) return { ...state, hold: state.current, current: state.next, next: randomPiece() };
  return { ...state, hold: state.current, current: updateCells(state.hold, 3, 0, 0) };
}

export function togglePause(state: GameState): GameState {
  return state.isGameOver ? state : { ...state, isPaused: !state.isPaused };
}

export function playGame(): GameState {
  const highScore = typeof localStorage === "undefined" ? 0 : Number(localStorage.getItem("tetris-highScore") || 0);
  return {
    board: emptyBoard(),
    current: randomPiece(),
    next: randomPiece(),
    hold: null,
    score: 0,
    level: 1,
    lines: 0,
    highScore,
    isPaused: false,
    isGameOver: false,
  };
}

export function previewIndices(piece: Tetromino): Set<number> {
  const indices = new Set<number>();
  piece.cells.forEach(p => {
    const localX = p.x - piece.x;
    const localY = p.y - piece.y;
    if (localX >= 0 && localX < 4 && localY >= 0 && localY < 4) indices.add(localY * 4 + localX);
  });
  return indices;
}

export function ghostPiece(state: GameState): Tetromino {
  let ghost = state.current;
  while (true) {
    const next = updateCells(ghost, ghost.x, ghost.y + 1);
    if (!fits(state.board, next.cells)) return ghost;
    ghost = next;
  }
}
