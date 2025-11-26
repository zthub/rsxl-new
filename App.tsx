import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ModuleDetail } from './pages/ModuleDetail';
import { GamePlayer } from './pages/GamePlayer';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/module/:moduleId" element={<ModuleDetail />} />
          <Route path="/module/:moduleId/game/:gameId" element={<GamePlayer />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;