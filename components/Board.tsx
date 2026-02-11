import React from 'react';
import { BOARD_ROWS, BOARD_COLS } from '../constants';

const Board: React.FC = () => {
  // Coordinate system: each cell is 100x100 units
  const width = (BOARD_COLS - 1) * 100;
  const height = (BOARD_ROWS - 1) * 100;
  
  // High Tech Colors
  const gridColor = "#1e293b"; // Dark slate for passive lines
  const glowColor = "#05d9e8"; // Cyan for active areas/borders

  return (
    <svg 
      viewBox={`-50 -50 ${width + 100} ${height + 100}`} 
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#05d9e8" stopOpacity="0" />
          <stop offset="50%" stopColor="#05d9e8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#05d9e8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Board Background Fill */}
      <rect x="-45" y="-45" width={width + 90} height={height + 90} fill="#0f172a" opacity="0.8" rx="15" />

      {/* Outer Border with Glow */}
      <rect x="-20" y="-20" width={width + 40} height={height + 40} fill="none" stroke={glowColor} strokeWidth="2" rx="5" filter="url(#glow)" opacity="0.6" />

      {/* Main Grid Lines */}
      <g stroke={gridColor} strokeWidth="2" strokeLinecap="square">
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
              return <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2={height} />;
            } else {
              return (
                <React.Fragment key={`v-${i}`}>
                  <line x1={i * 100} y1="0" x2={i * 100} y2="400" />
                  <line x1={i * 100} y1="500" x2={i * 100} y2="900" />
                </React.Fragment>
              );
            }
          })}

          {/* Palace Diagonals (Highlighted) */}
          <g stroke={glowColor} strokeWidth="1" opacity="0.4">
            <line x1="300" y1="0" x2="500" y2="200" />
            <line x1="500" y1="0" x2="300" y2="200" />
            <line x1="300" y1="700" x2="500" y2="900" />
            <line x1="500" y1="700" x2="300" y2="900" />
          </g>
          
          {/* Markers (Crosshairs) */}
          {[
            [2, 1], [2, 7], // Cannons Top
            [7, 1], [7, 7], // Cannons Bottom
            [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], // Soldiers Top
            [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]  // Soldiers Bottom
          ].map(([r, c], idx) => {
            const x = c * 100;
            const y = r * 100;
            const d = 10;
            const gap = 5;
            return (
              <g key={`mark-${idx}`} stroke={glowColor} strokeWidth="2" opacity="0.8" filter="url(#glow)">
                 {/* Tech Corners Look */}
                {c > 0 && <path d={`M${x-d-gap},${y-gap} L${x-gap},${y-gap} L${x-gap},${y-d-gap}`} />}
                {c < 8 && <path d={`M${x+gap},${y-d-gap} L${x+gap},${y-gap} L${x+d+gap},${y-gap}`} />}
                {c < 8 && <path d={`M${x+d+gap},${y+gap} L${x+gap},${y+gap} L${x+gap},${y+d+gap}`} />}
                {c > 0 && <path d={`M${x-gap},${y+d+gap} L${x-gap},${y+gap} L${x-d-gap},${y+gap}`} />}
              </g>
            )
          })}
      </g>

      {/* Digital River */}
      <rect x="0" y="402" width={width} height="96" fill="url(#riverGradient)" />
      
      <g className="select-none pointer-events-none">
          <text 
            x={width / 2} 
            y={460} 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill={glowColor} 
            fontSize="24" 
            fontWeight="bold"
            letterSpacing="10"
            className="font-display opacity-80"
            filter="url(#glow)"
          >
            COMBAT ZONE
          </text>
      </g>

    </svg>
  );
};

export default Board;