import { Color, Piece, PieceType, Position } from '../types';
import { BOARD_ROWS as ROWS, BOARD_COLS as COLS } from '../constants';

const isValidPos = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

const isSameColor = (board: (Piece | null)[][], r: number, c: number, color: Color) => {
  const piece = board[r][c];
  return piece !== null && piece.color === color;
};

export const getValidMoves = (board: (Piece | null)[][], piece: Piece): Position[] => {
  const moves: Position[] = [];
  const { type, color, position } = piece;
  const { r, c } = position;

  const addMove = (nr: number, nc: number) => {
    if (isValidPos(nr, nc) && !isSameColor(board, nr, nc, color)) {
      moves.push({ r: nr, c: nc });
    }
  };

  switch (type) {
    case PieceType.GENERAL:
      // Orthogonal 1 step, confined to palace
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
        if (nc >= 3 && nc <= 5) {
          if ((color === Color.RED && nr >= 7 && nr <= 9) || (color === Color.BLACK && nr >= 0 && nr <= 2)) {
            addMove(nr, nc);
          }
        }
      });
      break;

    case PieceType.ADVISOR:
      // Diagonal 1 step, confined to palace
      [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]].forEach(([nr, nc]) => {
        if (nc >= 3 && nc <= 5) {
          if ((color === Color.RED && nr >= 7 && nr <= 9) || (color === Color.BLACK && nr >= 0 && nr <= 2)) {
            addMove(nr, nc);
          }
        }
      });
      break;

    case PieceType.ELEPHANT:
      // Diagonal 2 steps, cannot cross river, blocked by eye
      const elephantMoves = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
      elephantMoves.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        // Check river boundary
        if (color === Color.RED && nr < 5) return;
        if (color === Color.BLACK && nr > 4) return;
        
        // Check eye (block)
        const eyeR = r + dr / 2;
        const eyeC = c + dc / 2;
        if (isValidPos(nr, nc) && isValidPos(eyeR, eyeC) && board[eyeR][eyeC] === null) {
          addMove(nr, nc);
        }
      });
      break;

    case PieceType.HORSE:
      // L shape, blocked by leg
      const horseMoves = [
        { dr: -2, dc: -1, leg: { r: -1, c: 0 } },
        { dr: -2, dc: 1, leg: { r: -1, c: 0 } },
        { dr: 2, dc: -1, leg: { r: 1, c: 0 } },
        { dr: 2, dc: 1, leg: { r: 1, c: 0 } },
        { dr: -1, dc: -2, leg: { r: 0, c: -1 } },
        { dr: -1, dc: 2, leg: { r: 0, c: 1 } },
        { dr: 1, dc: -2, leg: { r: 0, c: -1 } },
        { dr: 1, dc: 2, leg: { r: 0, c: 1 } },
      ];
      horseMoves.forEach(({ dr, dc, leg }) => {
        const nr = r + dr;
        const nc = c + dc;
        const legR = r + leg.r;
        const legC = c + leg.c;
        if (isValidPos(nr, nc) && isValidPos(legR, legC) && board[legR][legC] === null) {
          addMove(nr, nc);
        }
      });
      break;

    case PieceType.CHARIOT:
      // Orthogonal infinite
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
        let i = 1;
        while (true) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (!isValidPos(nr, nc)) break;
          const target = board[nr][nc];
          if (target === null) {
            addMove(nr, nc);
          } else {
            if (target.color !== color) addMove(nr, nc);
            break;
          }
          i++;
        }
      });
      break;

    case PieceType.CANNON:
      // Move like chariot, capture by jumping
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
        let i = 1;
        let jumped = false;
        while (true) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (!isValidPos(nr, nc)) break;
          const target = board[nr][nc];
          
          if (!jumped) {
            if (target === null) {
              addMove(nr, nc);
            } else {
              jumped = true; // Found the screen/mount
            }
          } else {
            if (target !== null) {
              if (target.color !== color) addMove(nr, nc);
              break; // Can only jump one
            }
          }
          i++;
        }
      });
      break;

    case PieceType.SOLDIER:
      // Forward 1. Cross river -> Forward or Side 1
      const forward = color === Color.RED ? -1 : 1;
      const crossedRiver = color === Color.RED ? r <= 4 : r >= 5;

      // Forward
      addMove(r + forward, c);
      
      // Side (if crossed river)
      if (crossedRiver) {
        addMove(r, c - 1);
        addMove(r, c + 1);
      }
      break;
  }

  return moves;
};

// Check if the General of specific color is under attack
export const isInCheck = (board: (Piece | null)[][], color: Color): boolean => {
  // 1. Find General Position
  let generalPos: Position | null = null;
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.type === PieceType.GENERAL && p.color === color) {
        generalPos = { r, c };
        break;
      }
    }
    if (generalPos) break;
  }

  if (!generalPos) return false; // Should not happen in valid game

  // 2. Iterate all enemy pieces and see if they can attack General
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.color !== color) {
        const moves = getValidMoves(board, p);
        if (moves.some(m => m.r === generalPos!.r && m.c === generalPos!.c)) {
          return true;
        }
      }
    }
  }

  return false;
};

// Generates Standard Xiangqi FEN string
// rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1
export const boardToFen = (board: (Piece | null)[][], turn: Color): string => {
  let fen = "";
  for (let r = 0; r < 10; r++) {
    let emptyCount = 0;
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        let char = '';
        switch (p.type) {
          case PieceType.GENERAL: char = 'k'; break;
          case PieceType.ADVISOR: char = 'a'; break;
          case PieceType.ELEPHANT: char = 'b'; break; // 'b' is standard for Elephant in FEN (Bishop equivalent)
          case PieceType.HORSE: char = 'n'; break;    // 'n' is standard for Horse in FEN (Knight equivalent)
          case PieceType.CHARIOT: char = 'r'; break;
          case PieceType.CANNON: char = 'c'; break;
          case PieceType.SOLDIER: char = 'p'; break;
        }
        // Red is Uppercase, Black is Lowercase
        fen += p.color === Color.RED ? char.toUpperCase() : char.toLowerCase();
      }
    }
    if (emptyCount > 0) fen += emptyCount;
    if (r < 9) fen += "/";
  }
  
  // Turn indicator (w = red, b = black in standard chess, but typically w/b is used)
  // Let's use 'w' for Red (first player) and 'b' for Black to align with general FEN parsers
  fen += ` ${turn === Color.RED ? 'w' : 'b'} - - 0 1`;
  return fen;
};