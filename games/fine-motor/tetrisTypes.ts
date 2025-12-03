// Types for Tetris Game
export type TetrominoShape = number[][];

export enum TetrominoType {
  I = 'I',
  J = 'J',
  L = 'L',
  O = 'O',
  S = 'S',
  T = 'T',
  Z = 'Z',
}

export interface TetrominoConfig {
  type: TetrominoType;
  shape: TetrominoShape;
  color: string;
  emoji: string;
}

export interface GridCell {
  filled: boolean;
  color?: string;
  emoji?: string;
}

export type Grid = GridCell[][];

export interface Position {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: TetrominoType;
  position: Position;
  rotation: number; // 0, 1, 2, 3
  shape: TetrominoShape;
  color: string;
  emoji: string;
}

// Pop Game Types
export interface PopBlock {
  id: string; // Unique ID for animations if needed
  typeIndex: number; // Index in POP_BLOCK_TYPES
  color: string;
  emoji: string;
}

export type PopGrid = (PopBlock | null)[][];

