import { Piece, PieceType, Color, Position } from './types';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

// Character mapping for UI
export const PIECE_CHARS: Record<Color, Record<PieceType, string>> = {
  [Color.RED]: {
    [PieceType.GENERAL]: '帥',
    [PieceType.ADVISOR]: '仕',
    [PieceType.ELEPHANT]: '相',
    [PieceType.HORSE]: '傌',
    [PieceType.CHARIOT]: '俥',
    [PieceType.CANNON]: '炮',
    [PieceType.SOLDIER]: '兵',
  },
  [Color.BLACK]: {
    [PieceType.GENERAL]: '將',
    [PieceType.ADVISOR]: '士',
    [PieceType.ELEPHANT]: '象',
    [PieceType.HORSE]: '馬',
    [PieceType.CHARIOT]: '車',
    [PieceType.CANNON]: '砲',
    [PieceType.SOLDIER]: '卒',
  },
};

export const INITIAL_BOARD_SETUP: { type: PieceType; color: Color; pos: Position }[] = [
  // RED (Bottom)
  { type: PieceType.CHARIOT, color: Color.RED, pos: { r: 9, c: 0 } },
  { type: PieceType.HORSE, color: Color.RED, pos: { r: 9, c: 1 } },
  { type: PieceType.ELEPHANT, color: Color.RED, pos: { r: 9, c: 2 } },
  { type: PieceType.ADVISOR, color: Color.RED, pos: { r: 9, c: 3 } },
  { type: PieceType.GENERAL, color: Color.RED, pos: { r: 9, c: 4 } },
  { type: PieceType.ADVISOR, color: Color.RED, pos: { r: 9, c: 5 } },
  { type: PieceType.ELEPHANT, color: Color.RED, pos: { r: 9, c: 6 } },
  { type: PieceType.HORSE, color: Color.RED, pos: { r: 9, c: 7 } },
  { type: PieceType.CHARIOT, color: Color.RED, pos: { r: 9, c: 8 } },
  { type: PieceType.CANNON, color: Color.RED, pos: { r: 7, c: 1 } },
  { type: PieceType.CANNON, color: Color.RED, pos: { r: 7, c: 7 } },
  { type: PieceType.SOLDIER, color: Color.RED, pos: { r: 6, c: 0 } },
  { type: PieceType.SOLDIER, color: Color.RED, pos: { r: 6, c: 2 } },
  { type: PieceType.SOLDIER, color: Color.RED, pos: { r: 6, c: 4 } },
  { type: PieceType.SOLDIER, color: Color.RED, pos: { r: 6, c: 6 } },
  { type: PieceType.SOLDIER, color: Color.RED, pos: { r: 6, c: 8 } },

  // BLACK (Top)
  { type: PieceType.CHARIOT, color: Color.BLACK, pos: { r: 0, c: 0 } },
  { type: PieceType.HORSE, color: Color.BLACK, pos: { r: 0, c: 1 } },
  { type: PieceType.ELEPHANT, color: Color.BLACK, pos: { r: 0, c: 2 } },
  { type: PieceType.ADVISOR, color: Color.BLACK, pos: { r: 0, c: 3 } },
  { type: PieceType.GENERAL, color: Color.BLACK, pos: { r: 0, c: 4 } },
  { type: PieceType.ADVISOR, color: Color.BLACK, pos: { r: 0, c: 5 } },
  { type: PieceType.ELEPHANT, color: Color.BLACK, pos: { r: 0, c: 6 } },
  { type: PieceType.HORSE, color: Color.BLACK, pos: { r: 0, c: 7 } },
  { type: PieceType.CHARIOT, color: Color.BLACK, pos: { r: 0, c: 8 } },
  { type: PieceType.CANNON, color: Color.BLACK, pos: { r: 2, c: 1 } },
  { type: PieceType.CANNON, color: Color.BLACK, pos: { r: 2, c: 7 } },
  { type: PieceType.SOLDIER, color: Color.BLACK, pos: { r: 3, c: 0 } },
  { type: PieceType.SOLDIER, color: Color.BLACK, pos: { r: 3, c: 2 } },
  { type: PieceType.SOLDIER, color: Color.BLACK, pos: { r: 3, c: 4 } },
  { type: PieceType.SOLDIER, color: Color.BLACK, pos: { r: 3, c: 6 } },
  { type: PieceType.SOLDIER, color: Color.BLACK, pos: { r: 3, c: 8 } },
];

export const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));
  
  INITIAL_BOARD_SETUP.forEach((p, index) => {
    board[p.pos.r][p.pos.c] = {
      id: `${p.color}-${p.type}-${index}`,
      type: p.type,
      color: p.color,
      position: { ...p.pos },
    };
  });
  
  return board;
};