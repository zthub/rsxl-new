
import React from 'react';
import { GameComponentProps } from '../types';
// VisualStimulation removed
import { WatermelonGame } from './stimulation/WatermelonGame';
import { FindFruitGame } from './stimulation/FindFruitGame';
import { SpinShooter } from './stimulation/SpinShooter';
import { OddOneOutGame } from './stimulation/OddOneOutGame';
import { ThunderFighter } from './stimulation/ThunderFighter';
import { WhosHidingGame } from './stimulation/WhosHidingGame';
import { WhackARabbit } from './stimulation/WhackARabbit';
import { AnimalPuzzleGame } from './stimulation/AnimalPuzzleGame';
import { GoldMinerGame } from './stimulation/GoldMinerGame';
import { FineMotorGame } from './fine-motor/FineMotorGame';
import { TraceContourGame } from './fine-motor/TraceContourGame';
import { MazeGame } from './fine-motor/MazeGame';
import { HexagonGame } from './fine-motor/HexagonGame';
import { TetrisGame } from './fine-motor/TetrisGame';
import { SimultaneousGame } from './simultaneous/SimultaneousGame';
import { FusionGame } from './fusion/FusionGame';
import { StereoscopicGame } from './stereoscopic/StereoscopicGame';
import { OnlineVideoPlayer } from './grating/OnlineVideoPlayer';
import { LocalVideoPlayer } from './grating/LocalVideoPlayer';

// Registry mapping game IDs to their implementation components
export const GameRegistry: Record<string, React.FC<GameComponentProps>> = {
    // Stimulation
    // 'g1-4': VisualStimulation, // Removed
    'g1-8': OddOneOutGame,
    'g1-5': WatermelonGame,
    'g1-6': FindFruitGame,
    'g1-7': SpinShooter,
    'g1-9': ThunderFighter,
    'g1-10': WhosHidingGame,
    'g1-11': WhackARabbit,
    'g1-12': AnimalPuzzleGame,
    'g1-13': GoldMinerGame,

    // Fine Motor
    'g2-1': TraceContourGame, // 连点成画
    'g2-2': FineMotorGame, 
    'g2-3': MazeGame,         // 迷宫探险
    'g2-4': HexagonGame,
    'g2-5': TetrisGame,

    // Simultaneous
    'g3-1': SimultaneousGame,
    'g3-2': SimultaneousGame,
    'g3-3': SimultaneousGame,

    // Fusion
    'g4-1': FusionGame,
    'g4-2': FusionGame,

    // Stereoscopic
    'g5-1': StereoscopicGame,
    'g5-2': StereoscopicGame,
    'g5-3': StereoscopicGame,

    // Grating Player
    'g6-1': OnlineVideoPlayer,
    'g6-2': LocalVideoPlayer,
};
