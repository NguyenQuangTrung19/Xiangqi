import { Piece, PieceType, Color, Position } from '../../types';
import { getValidMoves, isInCheck } from '../../utils/gameLogic';

// Piece Values
const VALUES = {
  [PieceType.GENERAL]: 10000,
  [PieceType.CHARIOT]: 500,
  [PieceType.CANNON]: 450,
  [PieceType.HORSE]: 300,
  [PieceType.ADVISOR]: 200,
  [PieceType.ELEPHANT]: 200,
  [PieceType.SOLDIER]: 100,
};

// Piece-Square Tables (PST)
// Values are for RED side (bottom). For BLACK, we mirror the row index.
// Higher value = better position.

// Pawn (Soldier)
const PST_SOLDIER = [
  [0,  0,  0,  0,  0,  0,  0,  0,  0], // 0: Enemy Palace (Target)
  [30, 40, 55, 60, 60, 60, 55, 40, 30], // 1
  [20, 30, 45, 50, 50, 50, 45, 30, 20], // 2
  [10, 20, 30, 35, 35, 35, 30, 20, 10], // 3: Crossed River
  [10, 20, 25, 30, 30, 30, 25, 20, 10], // 4: Crossed River
  [0,  0,  0,  0,  0,  0,  0,  0,  0],  // 5: River Bank (Home)
  [0,  0,  0,  0,  0,  0,  0,  0,  0],  // 6
  [0,  0,  0,  0,  0,  0,  0,  0,  0],  // 7
  [0,  0,  0,  0,  0,  0,  0,  0,  0],  // 8
  [0,  0,  0,  0,  0,  0,  0,  0,  0],  // 9: Home Base
];

// Chariot (Rook) - favors open lines and enemy territory
const PST_CHARIOT = [
  [10, 15, 10, 10, 10, 10, 10, 15, 10],
  [10, 15, 15, 15, 15, 15, 15, 15, 10],
  [10, 15, 20, 20, 20, 20, 20, 15, 10],
  [10, 15, 20, 20, 20, 20, 20, 15, 10],
  [5,  10, 15, 15, 15, 15, 15, 10, 5],
  [5,  12, 12, 12, 12, 12, 12, 12, 5], // River
  [0,  5,  5,  5,  5,  5,  5,  5,  0],
  [0,  5,  5,  5,  5,  5,  5,  5,  0],
  [0,  5,  10, 10, 10, 10, 10, 5,  0],
  [-5, 5,  5,  5,  5,  5,  5,  5,  -5],
];

// Horse (Knight) - favors center, penalized at edges
const PST_HORSE = [
  [0,  5,  10, 10, 10, 10, 10, 5,  0],
  [0,  5,  20, 25, 25, 25, 20, 5,  0],
  [5,  10, 25, 30, 30, 30, 25, 10, 5],
  [5,  10, 20, 25, 25, 25, 20, 10, 5],
  [5,  10, 15, 20, 20, 20, 15, 10, 5],
  [5,  8,  12, 15, 15, 15, 12, 8,  5], // River
  [0,  5,  5,  10, 10, 10, 5,  5,  0],
  [0,  -5, 0,  5,  5,  5,  0,  -5, 0],
  [-5, -10,-5, 0,  0,  0,  -5, -10,-5],
  [-10,-15,-10,-5, -5, -5, -10,-15,-10],
];

// Cannon - favors central files and river bank
const PST_CANNON = [
  [0,  5,  10, 10, 10, 10, 10, 5,  0],
  [0,  5,  10, 10, 10, 10, 10, 5,  0],
  [5,  10, 15, 20, 20, 20, 15, 10, 5],
  [5,  10, 15, 20, 20, 20, 15, 10, 5],
  [5,  10, 15, 20, 20, 20, 15, 10, 5],
  [0,  5,  5,  5,  5,  5,  5,  5,  0], // River
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  5,  0,  5,  10, 5,  0,  5,  0], // Initial rank
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
];

// Advisor - Keep near General
const PST_ADVISOR = [
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  5,  0,  5,  0,  0,  0], // Home palace
  [0,  0,  0,  0,  10, 0,  0,  0,  0], // Center of palace
  [0,  0,  0,  5,  0,  5,  0,  0,  0], // Home palace
];

// Elephant - Defensive, stay home
const PST_ELEPHANT = [
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0], // River
    [0,  0,  5,  0,  0,  0,  5,  0,  0], 
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  10, 0,  0,  0,  0], // High value centrally
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  5,  0,  0,  0,  5,  0,  0],
];

// General - Safety first
const PST_GENERAL = [
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
    [0,  0,  0,  -5, -5, -5, 0,  0,  0], // Top of palace
    [0,  0,  0,  0,  5,  0,  0,  0,  0], // Center safe
    [0,  0,  0,  5,  10, 5,  0,  0,  0], // Bottom safest
];

const PST_MAP: Record<PieceType, number[][]> = {
    [PieceType.SOLDIER]: PST_SOLDIER,
    [PieceType.CHARIOT]: PST_CHARIOT,
    [PieceType.HORSE]: PST_HORSE,
    [PieceType.CANNON]: PST_CANNON,
    [PieceType.ADVISOR]: PST_ADVISOR,
    [PieceType.ELEPHANT]: PST_ELEPHANT,
    [PieceType.GENERAL]: PST_GENERAL,
};

export const evaluateBoard = (board: (Piece | null)[][], turn: Color): number => {
    let score = 0;
    let redDetails = { material: 0, positional: 0 };
    let blackDetails = { material: 0, positional: 0 };
    
    // Iterate board
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c];
            if (!piece) continue;

            const isRed = piece.color === Color.RED;
            const val = VALUES[piece.type];
            
            // PST Lookup
            // If RED, use r, c directly.
            // If BLACK, mirror r (9-r), and c is symmetric effectively or we should treat board from black's perspective.
            // Standard convention: PST is usually defined from one side's perspective (usually bottom, Red).
            // For Black at top (r=0), we need to access PST as if it was at bottom relative to its own side.
            // So for Black at r=0, it corresponds to PST row 9.
            
            let pstVal = 0;
            if (isRed) {
                pstVal = PST_MAP[piece.type][r][c];
            } else {
                pstVal = PST_MAP[piece.type][9 - r][c]; // Mirror rows
            }

            if (isRed) {
                score += val + pstVal;
                redDetails.material += val;
                redDetails.positional += pstVal;
            } else {
                score -= val + pstVal;
                blackDetails.material += val;
                blackDetails.positional += pstVal;
            }
        }
    }

    // Mobility & Threats (Simplified for performance)
    // We can add logic here to count legal moves for key pieces if depth is low
    
    // Return score relative to the side whose turn it is? 
    // Usually Alpha-Beta expects score relative to maximizing player or always absolute.
    // Let's standard: Positive = Advantage for RED, Negative = Advantage for BLACK.
    // The search function will handle the perspective.
    
    // Add small randomness to break ties and avoid repetition (±5 points)
    // Deterministic randomness based on board hash would be better for distinct stability,
    // but for "avoid repetitive play", simple Math.random is acceptable if called per game, 
    // but inside search it makes it non-deterministic which hurts pruning.
    // Ideally, randomness should be in the Engine's root selection, not here.
    // BUT, the requirements said "Evaluation must be... Deterministic".
    // So I should NOT put Math.random() here.
    // I will put it in MoveGenerator sort? No.
    // I will put it in Engine.ts or Search.ts at the ROOT level.
    
    return score;
};
