
export enum GameType {
  HOME = 'HOME',
  BOMB = 'BOMB',
  CHICKS = 'CHICKS',
  BEANS = 'BEANS',
  CATCH = 'CATCH',
  FIND_AVATAR = 'FIND_AVATAR',
  MAP_PUZZLE = 'MAP_PUZZLE',
  PARKING = 'PARKING',
  DRINK_SHOP = 'DRINK_SHOP',
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export interface LevelConfig {
  rows: number;
  cols: number;
  timeLimit?: number; // Seconds
  targetCount: number; // How many targets to find
}

export interface GameResult {
  success: boolean;
  score?: number;
  message?: string;
}
