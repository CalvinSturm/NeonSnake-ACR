import React from 'react';
import { SnakeGame } from './components/SnakeGame';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex items-center justify-center">
      <SnakeGame />
    </div>
  );
};

export default App;