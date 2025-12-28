
import React, { useState } from 'react';
import { GameType } from './types';
import Home from './views/Home';
import BombGame from './views/BombGame';
import ChicksGame from './views/ChicksGame';
import BeansGame from './views/BeansGame';
import CatchApplesGame from './views/CatchApplesGame';
import FindAvatarGame from './views/FindAvatarGame';
import MapPuzzleGame from './views/MapPuzzleGame';
import ParkingGame from './views/ParkingGame';
import DrinkShopGame from './views/DrinkShopGame';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<GameType>(GameType.HOME);

  const renderView = () => {
    switch (currentView) {
      case GameType.BOMB:
        return <BombGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.CHICKS:
        return <ChicksGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.BEANS:
        return <BeansGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.CATCH:
        return <CatchApplesGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.FIND_AVATAR:
        return <FindAvatarGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.MAP_PUZZLE:
        return <MapPuzzleGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.PARKING:
        return <ParkingGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.DRINK_SHOP:
        return <DrinkShopGame onBack={() => setCurrentView(GameType.HOME)} />;
      case GameType.HOME:
      default:
        return <Home onSelectGame={setCurrentView} />;
    }
  };

  return (
    <div className="antialiased text-gray-900">
      {renderView()}
    </div>
  );
};

export default App;
