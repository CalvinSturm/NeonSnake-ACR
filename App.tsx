import React from 'react';
import SnakeGame from './components/SnakeGame';

function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden select-none selection:bg-cyan-500 selection:text-black">
      <SnakeGame />
    </div>
  );
}

export default App;