import { TetrominoConfig, TetrominoType } from './tetrisTypes';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 15; // Slightly shorter for kids/mobile

// --- TETRIS ASSETS ---
export const TETROMINOS: Record<TetrominoType, TetrominoConfig> = {
  [TetrominoType.I]: {
    type: TetrominoType.I,
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'bg-cyan-400 border-cyan-500',
    emoji: '🧊',
  },
  [TetrominoType.J]: {
    type: TetrominoType.J,
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-blue-500 border-blue-600',
    emoji: '🐳',
  },
  [TetrominoType.L]: {
    type: TetrominoType.L,
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-orange-400 border-orange-500',
    emoji: '🦊',
  },
  [TetrominoType.O]: {
    type: TetrominoType.O,
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400 border-yellow-500',
    emoji: '⭐',
  },
  [TetrominoType.S]: {
    type: TetrominoType.S,
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'bg-green-500 border-green-600',
    emoji: '🐸',
  },
  [TetrominoType.T]: {
    type: TetrominoType.T,
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-purple-500 border-purple-600',
    emoji: '🍇',
  },
  [TetrominoType.Z]: {
    type: TetrominoType.Z,
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-red-500 border-red-600',
    emoji: '🍎',
  },
};

export const SCORES = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
};

// --- POP GAME ASSETS ---
export const POP_BLOCK_TYPES = [
  { color: 'bg-pink-400 border-pink-500', emoji: '🐷' },
  { color: 'bg-indigo-400 border-indigo-500', emoji: '🐙' },
  { color: 'bg-lime-400 border-lime-500', emoji: '🐢' },
  { color: 'bg-amber-400 border-amber-500', emoji: '🦁' },
  { color: 'bg-rose-400 border-rose-500', emoji: '🦄' },
];

export const POP_GAME_CONSTANTS = {
  INITIAL_ROWS: 5,
  SPAWN_INTERVAL_MS: 1000, // Speed of bottom block generation
  MIN_GROUP_SIZE: 2,
};

