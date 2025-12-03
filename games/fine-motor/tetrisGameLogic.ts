import { BOARD_HEIGHT, BOARD_WIDTH, TETROMINOS } from './tetrisConstants';
import { ActivePiece, Grid, TetrominoType } from './tetrisTypes';

export const createEmptyGrid = (): Grid =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ filled: false }))
  );

export const getRandomTetromino = (): ActivePiece => {
  const keys = Object.keys(TETROMINOS) as TetrominoType[];
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  const config = TETROMINOS[randKey];

  return {
    ...config,
    position: {
      x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(config.shape[0].length / 2),
      y: 0,
    },
    rotation: 0,
  };
};

export const rotateMatrix = (matrix: number[][]): number[][] => {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
};

export const checkCollision = (
  piece: ActivePiece,
  grid: Grid,
  offsetX = 0,
  offsetY = 0
): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 0) {
        const newX = piece.position.x + x + offsetX;
        const newY = piece.position.y + y + offsetY;

        // Wall collisions
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return true;
        }

        // Existing block collisions (ignore if y < 0, meaning above board)
        if (newY >= 0 && grid[newY][newX].filled) {
          return true;
        }
      }
    }
  }
  return false;
};

// Calculate the shadow/ghost position (lowest possible Y)
export const getHardDropPosition = (piece: ActivePiece, grid: Grid): number => {
  let dropY = 0;
  while (!checkCollision(piece, grid, 0, dropY + 1)) {
    dropY++;
  }
  return dropY;
};

// Calculate the actual visual bounds of the filled cells within the shape matrix
export const getActualShapeBounds = (shape: number[][]) => {
  let minX = shape[0].length;
  let maxX = -1;
  let minY = shape.length;
  let maxY = -1;

  shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });
  });

  return { minX, maxX, minY, maxY };
};

