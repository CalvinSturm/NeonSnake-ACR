import { jsx as _jsx } from "react/jsx-runtime";
import SnakeGame from './components/SnakeGame';
const App = () => {
    return (_jsx("div", { className: "h-screen w-screen bg-black overflow-hidden flex items-center justify-center", children: _jsx(SnakeGame, {}) }));
};
export default App;
