import { BOARD_HEIGHT, BOARD_WIDTH, POP_BLOCK_TYPES, POP_GAME_CONSTANTS } from './tetrisConstants';
import { PopGrid, PopBlock } from './tetrisTypes';

export const createEmptyPopGrid = (): PopGrid =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );

export const getRandomPopBlock = (): PopBlock => {
  const typeIndex = Math.floor(Math.random() * POP_BLOCK_TYPES.length);
  const config = POP_BLOCK_TYPES[typeIndex];
  return {
    id: Math.random().toString(36).substr(2, 9),
    typeIndex,
    ...config,
  };
};

export const initPopGameGrid = (): PopGrid => {
  const grid = createEmptyPopGrid();
  // Fill bottom N rows
  for (let y = BOARD_HEIGHT - 1; y >= BOARD_HEIGHT - POP_GAME_CONSTANTS.INITIAL_ROWS; y--) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      grid[y][x] = getRandomPopBlock();
    }
  }
  return grid;
};

// Flood Fill to find connected blocks of same type
export const findConnectedGroup = (grid: PopGrid, startX: number, startY: number): { x: number; y: number }[] => {
  const target = grid[startY][startX];
  if (!target) return [];

  const group: { x: number; y: number }[] = [];
  const visited = new Set<string>();
  const stack = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[y][x];
    if (cell && cell.typeIndex === target.typeIndex) {
      group.push({ x, y });

      // Check neighbors (Up, Down, Left, Right)
      const neighbors = [
        { nx: x, ny: y - 1 },
        { nx: x, ny: y + 1 },
        { nx: x - 1, ny: y },
        { nx: x + 1, ny: y },
      ];

      for (const { nx, ny } of neighbors) {
        if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
          stack.push({ x: nx, y: ny });
        }
      }
    }
  }

  return group;
};

// 1. Vertical Gravity: Blocks fall down
const applyVerticalGravity = (grid: PopGrid): PopGrid => {
  const newGrid = grid.map(row => [...row]); // Shallow copy rows
  
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let writeY = BOARD_HEIGHT - 1;
    // Iterate from bottom up, keep non-null blocks
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newGrid[y][x] !== null) {
        newGrid[writeY][x] = newGrid[y][x];
        if (writeY !== y) {
          newGrid[y][x] = null;
        }
        writeY--;
      }
    }
  }
  return newGrid;
};

// 2. Horizontal Gravity: Columns move toward the center
const applyHorizontalGravity = (grid: PopGrid): PopGrid => {
  const midPoint = BOARD_WIDTH / 2; 
  const newGrid = grid.map(row => [...row]);

  // Check which columns are empty
  const isEmptyCol = (colIndex: number) => {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (newGrid[y][colIndex] !== null) return false;
    }
    return true;
  };

  // Process Left Side (0 to midPoint-1): Shift Right towards Center
  const leftCols: (PopBlock | null)[][] = [];
  for(let x=0; x < midPoint; x++) {
     const col = [];
     for(let y=0; y<BOARD_HEIGHT; y++) col.push(newGrid[y][x]);
     leftCols.push(col);
  }
  
  // Filter out empty columns
  const validLeftCols = leftCols.filter(col => col.some(b => b !== null));
  const paddingCountLeft = midPoint - validLeftCols.length;
  // Clear left side
  for(let x=0; x < midPoint; x++) {
      for(let y=0; y<BOARD_HEIGHT; y++) newGrid[y][x] = null;
  }
  // Place back valid columns starting after padding
  validLeftCols.forEach((col, i) => {
      const targetX = paddingCountLeft + i;
      col.forEach((block, y) => {
          newGrid[y][targetX] = block;
      });
  });

  // Process Right Side (midPoint to Width): Shift Left towards Center
  const rightCols: (PopBlock | null)[][] = [];
  for(let x=midPoint; x < BOARD_WIDTH; x++) {
     const col = [];
     for(let y=0; y<BOARD_HEIGHT; y++) col.push(newGrid[y][x]);
     rightCols.push(col);
  }
  const validRightCols = rightCols.filter(col => col.some(b => b !== null));
  
  // Clear right side
  for(let x=midPoint; x < BOARD_WIDTH; x++) {
      for(let y=0; y<BOARD_HEIGHT; y++) newGrid[y][x] = null;
  }
  // Place back valid columns
  validRightCols.forEach((col, i) => {
      const targetX = midPoint + i;
      col.forEach((block, y) => {
          newGrid[y][targetX] = block;
      });
  });

  return newGrid;
};

export const applyGravity = (grid: PopGrid): PopGrid => {
    let nextGrid = applyVerticalGravity(grid);
    nextGrid = applyHorizontalGravity(nextGrid);
    return nextGrid;
};

// Check if top row has blocks
export const checkGameOver = (grid: PopGrid): boolean => {
  return grid[0].some(cell => cell !== null);
};

