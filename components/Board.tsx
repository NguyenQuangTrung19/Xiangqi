import React from 'react';
import { BOARD_ROWS, BOARD_COLS } from '../constants';

const Board: React.FC = () => {
  // Coordinate system: each cell is 100x100 units
  const width = (BOARD_COLS - 1) * 100;
  const height = (BOARD_ROWS - 1) * 100;
  
  // Traditional Colors
  const gridColor = "#111827"; // Ink Black
  const paperColor = "#fdf5e6"; // Paper background

  return (
    <svg 
      viewBox={`-50 -50 ${width + 100} ${height + 100}`} 
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
    >
      <defs>
        {/* Paper Texture Filter could go here, but using CSS background is better for perf */}
      </defs>

      {/* Board Background Fill (Paper on Wood) */}
      <rect x="-40" y="-40" width={width + 80} height={height + 80} fill={paperColor} rx="4" />
      
      {/* Inner Border */}
      <rect x="-20" y="-20" width={width + 40} height={height + 40} fill="none" stroke={gridColor} strokeWidth="4" />

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
              return <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2={height} strokeWidth="4" />;
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
          <g stroke={gridColor} strokeWidth="2" opacity="0.8">
            <line x1="300" y1="0" x2="500" y2="200" />
            <line x1="500" y1="0" x2="300" y2="200" />
            <line x1="300" y1="700" x2="500" y2="900" />
            <line x1="500" y1="700" x2="300" y2="900" />
          </g>
          
          {/* Markers (Crosshairs) - Traditional Style */}
          {[
            [2, 1], [2, 7], // Cannons Top
            [7, 1], [7, 7], // Cannons Bottom
            [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], // Soldiers Top
            [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]  // Soldiers Bottom
          ].map(([r, c], idx) => {
            const x = c * 100;
            const y = r * 100;
            const d = 15;
            const gap = 4;
            return (
              <g key={`mark-${idx}`} stroke={gridColor} strokeWidth="2">
                {c > 0 && <path d={`M${x-d-gap},${y-gap} L${x-gap},${y-gap} L${x-gap},${y-d-gap}`} />}
                {c < 8 && <path d={`M${x+gap},${y-d-gap} L${x+gap},${y-gap} L${x+d+gap},${y-gap}`} />}
                {c < 8 && <path d={`M${x+d+gap},${y+gap} L${x+gap},${y+gap} L${x+gap},${y+d+gap}`} />}
                {c > 0 && <path d={`M${x-gap},${y+d+gap} L${x-gap},${y+gap} L${x-d-gap},${y+gap}`} />}
              </g>
            )
          })}
      </g>

      {/* River Text */}
      <g className="select-none pointer-events-none" transform={`translate(${width/2}, 450)`}>
          <text 
            x="-180" 
            y="15" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill={gridColor} 
            fontSize="50" 
            fontWeight="normal"
            className="font-serif opacity-90"
            style={{ writingMode: 'horizontal-tb' }}
          >
            楚 河
          </text>
          <text 
            x="180" 
            y="15" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill={gridColor} 
            fontSize="50" 
            fontWeight="normal"
            className="font-serif opacity-90"
            style={{ writingMode: 'horizontal-tb' }}
          >
             漢 界
          </text>
      </g>

    </svg>
  );
};

export default Board;