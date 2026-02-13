import React from 'react';
import { BOARD_ROWS, BOARD_COLS } from '../constants';

const Board: React.FC = () => {
  // Coordinate system: each cell is 100x100 units
  const width = (BOARD_COLS - 1) * 100;
  const height = (BOARD_ROWS - 1) * 100;
  
  // Premium Theme Colors
  const gridColor = "#4a3525"; // Dark Brown (burned wood look)
  const glowColor = "#d6b566"; // Gold glow

  return (
    <svg 
      viewBox={`-50 -50 ${width + 100} ${height + 100}`} 
      className="w-full h-full block touch-none select-none"
      preserveAspectRatio="xMidYMid meet"
      style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.5))' }}
    >
      <defs>
        <filter id="wood-glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        <pattern id="wood-pattern" patternUnits="userSpaceOnUse" width="400" height="400">
             <image href="https://www.transparenttextures.com/patterns/wood-pattern.png" x="0" y="0" width="400" height="400" opacity="0.4" />
        </pattern>
        <linearGradient id="board-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eecfa1" />
            <stop offset="100%" stopColor="#d4a373" />
        </linearGradient>
      </defs>

      {/* Board Base */}
      <rect x="-45" y="-45" width={width + 90} height={height + 90} fill="url(#board-gradient)" rx="6" />
      <rect x="-45" y="-45" width={width + 90} height={height + 90} fill="url(#wood-pattern)" rx="6" style={{ mixBlendMode: 'multiply' }} />
      
      {/* Outer Border (Deep Wood) */}
      <rect x="-30" y="-30" width={width + 60} height={height + 60} fill="none" stroke="#3e2723" strokeWidth="12" rx="4" />
      <rect x="-22" y="-22" width={width + 44} height={height + 44} fill="none" stroke="#5d4037" strokeWidth="2" />

      {/* Main Grid Lines */}
      <g stroke={gridColor} strokeWidth="3" strokeLinecap="round">
          {/* Horizontal Lines */}
          {Array.from({ length: BOARD_ROWS }).map((_, i) => (
            <line 
              key={`h-${i}`} 
              x1="0" y1={i * 100} x2={width} y2={i * 100} 
            />
          ))}
          
          {/* Vertical Lines (Split by River) */}
          {Array.from({ length: BOARD_COLS }).map((_, i) => {
            if (i === 0 || i === BOARD_COLS - 1) {
              return <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2={height} strokeWidth="5" />;
            } else {
              return (
                <React.Fragment key={`v-${i}`}>
                  <line x1={i * 100} y1="0" x2={i * 100} y2="400" />
                  <line x1={i * 100} y1="500" x2={i * 100} y2="900" />
                </React.Fragment>
              );
            }
          })}

          {/* Palace Diagonals */}
          <g stroke={gridColor} strokeWidth="2" opacity="0.9" strokeDasharray="10,5">
            <line x1="300" y1="0" x2="500" y2="200" />
            <line x1="500" y1="0" x2="300" y2="200" />
            <line x1="300" y1="700" x2="500" y2="900" />
            <line x1="500" y1="700" x2="300" y2="900" />
          </g>
          
          {/* Markers (Crosshairs) - Refined */}
          {[
            [2, 1], [2, 7], // Cannons Top
            [7, 1], [7, 7], // Cannons Bottom
            [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], // Soldiers Top
            [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]  // Soldiers Bottom
          ].map(([r, c], idx) => {
            const x = c * 100;
            const y = r * 100;
            const d = 12;
            const gap = 5;
            const w = 3;
            return (
              <g key={`mark-${idx}`} stroke={gridColor} strokeWidth={w} opacity="0.8">
                {c > 0 && <path d={`M${x-d-gap},${y-gap} L${x-gap},${y-gap} L${x-gap},${y-d-gap}`} />}
                {c < 8 && <path d={`M${x+gap},${y-d-gap} L${x+gap},${y-gap} L${x+d+gap},${y-gap}`} />}
                {c < 8 && <path d={`M${x+d+gap},${y+gap} L${x+gap},${y+gap} L${x+gap},${y+d+gap}`} />}
                {c > 0 && <path d={`M${x-gap},${y+d+gap} L${x-gap},${y+gap} L${x-d-gap},${y+gap}`} />}
              </g>
            )
          })}
      </g>

      {/* River Text - Premium Calligraphy */}
      <g className="select-none pointer-events-none" transform={`translate(${width/2}, 450)`}>
          {/* River Water Texture hint */}
          <path d={`M${-width/2},0 Q0,20 ${width/2},0`} fill="none" stroke={glowColor} strokeWidth="2" opacity="0.1" />
          <path d={`M${-width/2},0 Q0,-20 ${width/2},0`} fill="none" stroke={glowColor} strokeWidth="2" opacity="0.1" />

          <text 
            x="-180" 
            y="18" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill={gridColor} 
            fontSize="54" 
            fontWeight="bold"
            className="font-serif tracking-widest"
            style={{ 
                fontFamily: '"Noto Serif SC", serif',
                filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.4))'
            }}
          >
            楚 河
          </text>
          <text 
            x="180" 
            y="18" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill={gridColor} 
            fontSize="54" 
            fontWeight="bold"
             className="font-serif tracking-widest"
             style={{ 
                fontFamily: '"Noto Serif SC", serif',
                filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.4))'
            }}
          >
             漢 界
          </text>
      </g>

    </svg>
  );
};

export default Board;