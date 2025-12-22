
export interface Game {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  colorFrom: string;
  colorTo: string;
  iconName: string;
  games: Game[];
}

export enum ViewState {
  HOME = 'HOME',
  MODULE_DETAIL = 'MODULE_DETAIL',
  GAME_PLAY = 'GAME_PLAY',
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

// Standard interface for all game components
export interface GameComponentProps {
  width: number;
  height: number;
  isPlaying: boolean;
  onScore: (points: number) => void;
  onGameOver: () => void;
  onUpdateAmmo?: (ammo: number) => void; // Optional for shooter games
  difficulty?: string;
  gameId: string; // Needed for sub-variants (like g1-1 vs g1-2)
}
