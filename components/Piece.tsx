import React from 'react';
import { motion } from 'framer-motion';
import { Piece as PieceType, Color, PieceType as PType } from '../types';
import { PIECE_CHARS } from '../constants';

interface PieceProps {
  piece: PieceType;
  isSelected: boolean;
  isInCheck?: boolean;
  onClick: () => void;
  style?: React.CSSProperties; // We will use style only for width/height now, pos handled by motion
}

const PieceComponent: React.FC<PieceProps> = ({ piece, isSelected, isInCheck, onClick, style }) => {
  const isRed = piece.color === Color.RED;
  const isGeneral = piece.type === PType.GENERAL;
  
  // Colors for Neon Effect
  const colorClass = isRed ? 'text-cyber-neonRed border-cyber-neonRed' : 'text-cyber-neonBlue border-cyber-neonBlue';
  const glowClass = isRed ? 'shadow-neon-red' : 'shadow-neon-blue';
  const bgClass = isRed ? 'bg-red-950/40' : 'bg-sky-950/40';

  // Position calculation logic moved here for Frame Motion `layout`
  // Actually, standardizing `top`/`left` via style prop passed from parent + `layout` prop works best.
  
  return (
    <motion.div
      layout
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 1
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={style}
      className={`
        absolute flex items-center justify-center
        transform -translate-x-1/2 -translate-y-1/2
        cursor-pointer z-20 select-none
        ${isSelected ? 'z-30' : ''}
      `}
    >
      <motion.div 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
            scale: isSelected ? 1.15 : 1,
            boxShadow: isSelected 
                ? (isRed ? '0 0 25px #ff2a6d' : '0 0 25px #05d9e8') 
                : (isRed ? '0 0 5px rgba(255,42,109,0.2)' : '0 0 5px rgba(5,217,232,0.2)')
        }}
        className={`
          w-[85%] h-[85%] rounded-full backdrop-blur-md
          relative flex items-center justify-center
          border-[2px] ${colorClass} ${bgClass}
          ${isInCheck && isGeneral ? 'animate-pulse-fast ring-4 ring-red-600' : ''}
        `}
      >
        {/* Tech Ring (Rotating slowly) */}
        <div className={`absolute inset-0 rounded-full border border-white/10 ${isSelected ? 'animate-spin-slow' : ''}`} 
             style={{ borderTopColor: isRed ? '#ff2a6d' : '#05d9e8', borderStyle: 'dashed' }}>
        </div>

        {/* Character */}
        <span 
            className={`
            text-xl sm:text-2xl md:text-3xl font-black
            ${colorClass} drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]
            `}
            style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
            {PIECE_CHARS[piece.color][piece.type]}
        </span>
        
        {/* Gloss Reflection */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2/3 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

export default PieceComponent;