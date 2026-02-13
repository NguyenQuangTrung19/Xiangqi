import { Piece, PieceType, Color, Position, Move } from '../../types';
import { getValidMoves as getRulesMoves, isInCheck } from '../../utils/gameLogic';

export class MoveGenerator {
    // Wrapper to get moves, can be optimized later
    static generateMoves(board: (Piece | null)[][], turn: Color): Move[] {
        const moves: Move[] = [];
        
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.color === turn) {
                    const validPos = getRulesMoves(board, piece);
                    validPos.forEach(to => {
                        moves.push({
                            from: { r, c },
                            to: to
                        });
                    });
                }
            }
        }
        return moves;
    }

    // Sort moves for Alpha-Beta pruning efficiency
    // Captures > Checks > Quiet
    static sortMoves(board: (Piece | null)[][], moves: Move[]): Move[] {
        return moves.sort((a, b) => {
            const scoreA = this.getMoveScore(board, a);
            const scoreB = this.getMoveScore(board, b);
            return scoreB - scoreA; // Descending
        });
    }

    private static getMoveScore(board: (Piece | null)[][], move: Move): number {
        let score = 0;
        const target = board[move.to.r][move.to.c];
        
        // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
        if (target) {
            // Rough values for sorting
            const values: Record<string, number> = {
                [PieceType.GENERAL]: 10000,
                [PieceType.CHARIOT]: 500,
                [PieceType.CANNON]: 450,
                [PieceType.HORSE]: 300,
                [PieceType.ADVISOR]: 200,
                [PieceType.ELEPHANT]: 200,
                [PieceType.SOLDIER]: 100
            };
            score += values[target.type] * 10;
        }

        // TODO: Add history heuristic or kill moves here
        return score;
    }

    // Apply move to board in-place
    static makeMove(board: (Piece | null)[][], move: Move): Piece | null {
        const piece = board[move.from.r][move.from.c];
        const captured = board[move.to.r][move.to.c];

        if (!piece) return null; // Should not happen

        // Update Position
        piece.position = { r: move.to.r, c: move.to.c };
        
        // Move
        board[move.to.r][move.to.c] = piece;
        board[move.from.r][move.from.c] = null;

        return captured;
    }

    // Undo move in-place
    static unmakeMove(board: (Piece | null)[][], move: Move, captured: Piece | null): void {
        const piece = board[move.to.r][move.to.c];
        
        if (!piece) return;

        // Restore Position
        piece.position = { r: move.from.r, c: move.from.c };

        // Restore Grid
        board[move.from.r][move.from.c] = piece;
        board[move.to.r][move.to.c] = captured;
    }
}
