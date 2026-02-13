import React from 'react';
import { motion } from 'framer-motion';
import { Piece as PieceType, Color, PieceType as PType } from '../types';
import { PIECE_CHARS } from '../constants';

interface PieceProps {
  piece: PieceType;
  isSelected: boolean;
  isInCheck?: boolean;
  onClick: () => void;
  style?: React.CSSProperties; 
}

const PieceComponent: React.FC<PieceProps> = ({ piece, isSelected, isInCheck, onClick, style }) => {
  const isRed = piece.color === Color.RED;
  const isGeneral = piece.type === PType.GENERAL;
  
  // Traditional Colors
  const textColorClass = isRed ? 'text-china-red' : 'text-china-ink';
  const borderColorClass = isRed ? 'border-china-red/30' : 'border-china-ink/30';
  
  // 3D Wooden Disc Look
  // We use a combination of gradients and shadows to create depth
  
  return (
    <motion.div
      initial={{ x: "-50%", y: "-50%" }}
      animate={{ 
        x: "-50%", 
        y: "-50%",
        zIndex: isSelected ? 30 : 20 
      }}
      transition={{
        type: "spring", stiffness: 300, damping: 25, mass: 1
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={style} // left and top are passed here
      className={`
        absolute flex items-center justify-center
        cursor-pointer select-none
      `}
    >
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
            scale: isSelected ? 1.15 : 1,
            rotate: isGeneral && isInCheck ? [0, -5, 5, -5, 5, 0] : 0, // Shake if check
        }}
        className={`
          w-[90%] h-[90%] rounded-full 
          relative flex items-center justify-center
          bg-[#e6c9a8] /* Ivory/Light Wood Base */
          shadow-[2px_4px_6px_rgba(0,0,0,0.4),inset_0_-4px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)]
          border-[6px] border-[#d4a373] /* Outer Wood Ring */
          ${isSelected ? 'ring-4 ring-china-gold ring-offset-2 ring-offset-[#5d4037]' : ''}
          ${isInCheck && isGeneral ? 'ring-4 ring-china-red animate-pulse' : ''}
        `}
      >
        {/* Inner Groove */}
        <div className={`absolute inset-1 rounded-full border border-black/10`} />

        {/* Character - Engraved Look */}
        <span 
            className={`
            text-2xl sm:text-3xl md:text-4xl font-bold
            ${textColorClass}
            `}
            style={{ 
                fontFamily: '"Noto Serif SC", serif',
                textShadow: '0px 1px 0px rgba(255,255,255,0.5), 0px -1px 0px rgba(0,0,0,0.1)' // Engraved effect
            }}
        >
            {PIECE_CHARS[piece.color][piece.type]}
        </span>
        
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 rounded-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-multiply pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

export default PieceComponent;