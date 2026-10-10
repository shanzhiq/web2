import { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

export default function App() {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const directionRef = useRef<Direction>(direction);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameStarted(true);
    setSpeed(INITIAL_SPEED);
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const dir = directionRef.current;

      switch (dir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setGameStarted(false);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        setGameStarted(false);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        setHighScore(prev => Math.max(prev, newScore));
        setFood(getRandomPosition(newSnake));
        // Speed up slightly
        setSpeed(prev => Math.max(60, prev - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, score]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, isPaused, gameOver, moveSnake, speed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) {
          resetGame();
        } else if (gameStarted) {
          setIsPaused(prev => !prev);
        } else {
          resetGame();
        }
        return;
      }

      if (!gameStarted || isPaused || gameOver) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isPaused, gameOver, resetGame]);

  // Touch controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    const currentDir = directionRef.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && currentDir !== 'LEFT') setDirection('RIGHT');
      else if (dx < 0 && currentDir !== 'RIGHT') setDirection('LEFT');
    } else {
      if (dy > 0 && currentDir !== 'UP') setDirection('DOWN');
      else if (dy < 0 && currentDir !== 'DOWN') setDirection('UP');
    }
    touchStartRef.current = null;
  };

  const handleDirectionButton = (dir: Direction) => {
    if (!gameStarted || isPaused || gameOver) return;
    const currentDir = directionRef.current;
    if (dir === 'UP' && currentDir !== 'DOWN') setDirection('UP');
    if (dir === 'DOWN' && currentDir !== 'UP') setDirection('DOWN');
    if (dir === 'LEFT' && currentDir !== 'RIGHT') setDirection('LEFT');
    if (dir === 'RIGHT' && currentDir !== 'LEFT') setDirection('RIGHT');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Title */}
      <h1 className="text-4xl font-bold text-green-400 mb-4 tracking-wider drop-shadow-lg">
        🐍 贪吃蛇
      </h1>

      {/* Score Board */}
      <div className="flex gap-8 mb-4">
        <div className="bg-gray-800/80 px-6 py-2 rounded-xl border border-green-500/30">
          <span className="text-gray-400 text-sm">分数</span>
          <p className="text-2xl font-bold text-green-400">{score}</p>
        </div>
        <div className="bg-gray-800/80 px-6 py-2 rounded-xl border border-yellow-500/30">
          <span className="text-gray-400 text-sm">最高分</span>
          <p className="text-2xl font-bold text-yellow-400">{highScore}</p>
        </div>
      </div>

      {/* Game Board */}
      <div
        className="relative border-2 border-green-500/50 rounded-lg overflow-hidden shadow-2xl shadow-green-500/20"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: '#1a1a2e',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: GRID_SIZE }).map((_, row) =>
            Array.from({ length: GRID_SIZE }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-gray-600/30"
                style={{
                  left: col * CELL_SIZE,
                  top: row * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              />
            ))
          )}
        </div>

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0
                ? 'bg-green-400 shadow-lg shadow-green-400/50 z-10'
                : 'bg-green-500/80'
            }`}
            style={{
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          >
            {index === 0 && (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {direction === 'RIGHT' && '▶'}
                {direction === 'LEFT' && '◀'}
                {direction === 'UP' && '▲'}
                {direction === 'DOWN' && '▼'}
              </div>
            )}
          </div>
        ))}

        {/* Food */}
        <div
          className="absolute animate-pulse"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-lg">
            🍎
          </div>
        </div>

        {/* Overlay messages */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
            <p className="text-white text-xl mb-4">准备好了吗？</p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-colors shadow-lg"
            >
              开始游戏
            </button>
            <p className="text-gray-400 text-sm mt-3">按空格键或点击开始</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
            <p className="text-red-400 text-3xl font-bold mb-2">游戏结束!</p>
            <p className="text-white text-xl mb-4">得分: {score}</p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-colors shadow-lg"
            >
              再来一局
            </button>
            <p className="text-gray-400 text-sm mt-3">按空格键重新开始</p>
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
            <p className="text-yellow-400 text-3xl font-bold">暂停中</p>
            <p className="text-gray-300 text-sm mt-2">按空格键继续</p>
          </div>
        )}
      </div>

      {/* Controls info */}
      <div className="mt-4 text-gray-400 text-sm text-center">
        <p>方向键 / WASD 控制方向 | 空格键 暂停/继续</p>
      </div>

      {/* Mobile direction buttons */}
      <div className="mt-4 md:hidden">
        <div className="flex flex-col items-center gap-1">
          <button
            onTouchStart={() => handleDirectionButton('UP')}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg text-white text-2xl flex items-center justify-center shadow-lg"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onTouchStart={() => handleDirectionButton('LEFT')}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg text-white text-2xl flex items-center justify-center shadow-lg"
            >
              ◀
            </button>
            <button
              onTouchStart={() => {
                if (gameOver) resetGame();
                else if (gameStarted) setIsPaused(prev => !prev);
                else resetGame();
              }}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 active:bg-yellow-600 rounded-lg text-white text-xs flex items-center justify-center shadow-lg"
            >
              {gameOver ? '重开' : isPaused ? '继续' : '暂停'}
            </button>
            <button
              onTouchStart={() => handleDirectionButton('RIGHT')}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg text-white text-2xl flex items-center justify-center shadow-lg"
            >
              ▶
            </button>
          </div>
          <button
            onTouchStart={() => handleDirectionButton('DOWN')}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg text-white text-2xl flex items-center justify-center shadow-lg"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
