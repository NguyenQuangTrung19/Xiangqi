import { Piece, Color, Move, PieceType } from '../../types';
import { MoveGenerator } from './MoveGenerator';
import { evaluateBoard } from './Evaluation';
import { isInCheck } from '../../utils/gameLogic';

const INFINITY = 1000000;
const MATE_SCORE = 100000;

export class Search {
    private startTime: number = 0;
    private timeLimit: number = 0;
    private nodesVisited: number = 0;
    private stopSearch: boolean = false;

    // Iterative Deepening
    search(board: (Piece | null)[][], turn: Color, maxDepth: number, timeLimitMs: number): Move | null {
        this.startTime = Date.now();
        this.timeLimit = timeLimitMs;
        this.nodesVisited = 0;
        this.stopSearch = false;

        let bestMove: Move | null = null;

        // Iterative Deepening loop
        for (let depth = 1; depth <= maxDepth; depth++) {
            if (this.shouldStop()) break;

            const { move, score } = this.alphaBetaRoot(board, depth, -INFINITY, INFINITY, turn);
            
            if (this.stopSearch) break; // Don't use incomplete search results

            bestMove = move;
            console.log(`Depth ${depth}: Score ${score}, Nodes ${this.nodesVisited}, Best Move:`, move);

            // Optimization: If found mate, stop
            if (Math.abs(score) > MATE_SCORE - 100) break;
        }

        return bestMove;
    }

    private alphaBetaRoot(board: (Piece | null)[][], depth: number, alpha: number, beta: number, turn: Color): { move: Move | null, score: number } {
        const moves = MoveGenerator.generateMoves(board, turn);
        // Sort: Captures > Checks
        // TODO: Use better ordering from MoveGenerator
        moves.sort((a, b) => {
            const targetA = board[a.to.r][a.to.c];
            const targetB = board[b.to.r][b.to.c];
            const valA = targetA ? 10 : 0;
            const valB = targetB ? 10 : 0;
            return valB - valA;
        });

        let bestMove: Move | null = null;
        let bestScore = -INFINITY;

        for (const move of moves) {
            if (this.shouldStop()) break;

            const captured = MoveGenerator.makeMove(board, move);
            // Self-check check: illegal move?
            // In Xiangqi, you cannot move into check.
            // MoveGenerator relies on `getValidMoves` from gameLogic, which usually checks this.
            // But let's verify if `getValidMoves` guarantees legal moves (no pseudo-legal).
            // Current `utils/gameLogic` doesn't strictly check "moving into check" for all pieces, mostly relies on rules.
            // It puts responsibility on `isInCheck` at higher level?
            // Actually `getValidMoves` in `utils/gameLogic` simply returns geometric moves + blocks.
            // We must verify legality here (King Safety).
            
            const isSelfCheck = isInCheck(board, turn);

            const nextTurn = turn === Color.RED ? Color.BLACK : Color.RED;
            let score = 0;

            if (isSelfCheck) {
                // Illegal move, undo and skip
                MoveGenerator.unmakeMove(board, move, captured);
                continue;
            } else {
                score = -this.alphaBeta(board, depth - 1, -beta, -alpha, nextTurn);
                MoveGenerator.unmakeMove(board, move, captured);
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            if (score > alpha) {
                alpha = score;
            }
            if (alpha >= beta) {
                break;
            }
        }

        return { move: bestMove, score: bestScore };
    }

    private alphaBeta(board: (Piece | null)[][], depth: number, alpha: number, beta: number, turn: Color): number {
        this.nodesVisited++;
        if ((this.nodesVisited & 2047) === 0) {
            if (this.shouldStop()) return 0;
        }

        const isCheck = isInCheck(board, turn);

        // Checkmate detection (if no moves and in check) handled by loop below
        // If depth 0, Quiescence Search
        if (depth <= 0) {
            return this.quiescence(board, alpha, beta, turn);
        }

        const moves = MoveGenerator.generateMoves(board, turn);
        
        // Move Ordering
        // Simple capture sort
        moves.sort((a, b) => {
             const targetA = board[a.to.r][a.to.c];
             const targetB = board[b.to.r][b.to.c];
             return (targetB ? 1 : 0) - (targetA ? 1 : 0);
        });

        let legalMovesCount = 0;
        // let hasLegalMove = false; // logic covered by legalMovesCount

        for (const move of moves) {
            const captured = MoveGenerator.makeMove(board, move);
            
            // Check legality
            if (isInCheck(board, turn)) {
                MoveGenerator.unmakeMove(board, move, captured);
                continue;
            }
            legalMovesCount++;

            const nextTurn = turn === Color.RED ? Color.BLACK : Color.RED;
            const score = -this.alphaBeta(board, depth - 1, -beta, -alpha, nextTurn);
            
            MoveGenerator.unmakeMove(board, move, captured);

            if (this.stopSearch) return 0;

            if (score >= beta) {
                return beta; // Fail hard beta-cutoff
            }
            if (score > alpha) {
                alpha = score;
            }
        }

        if (legalMovesCount === 0) {
            if (isCheck) {
                return -MATE_SCORE + (100 - depth); // Prefer faster mate
            } else {
                return 0; // Stalemate
            }
        }

        return alpha;
    }

    private quiescence(board: (Piece | null)[][], alpha: number, beta: number, turn: Color): number {
        this.nodesVisited++;
        if ((this.nodesVisited & 2047) === 0) {
             if (this.shouldStop()) return 0;
        }

        // Stand pat (static evaluation)
        const standPat = evaluateBoard(board, turn);
        // Note: evaluateBoard returns relative score (Positive for Red, Negative for Black usually)
        // But alphaBeta expects score relative to current player.
        // My evaluateBoard returns: (RedScore - BlackScore).
        // If turn is RED, returns (Red - Black). Positive is good.
        // If turn is BLACK, returns (Red - Black). Negative is good for Black.
        // So we need to flip it if turn is BLACK.
        
        let score = (turn === Color.RED) ? standPat : -standPat;

        if (score >= beta) {
            return beta;
        }
        if (score > alpha) {
            alpha = score;
        }

        // Generate only captures
        const moves = MoveGenerator.generateMoves(board, turn); 
        // Filter captures
        const captures = moves.filter(m => board[m.to.r][m.to.c] !== null);
        
        // Sort captures MVV-LVA
        captures.sort((a, b) => {
             // Simple version: just look at victim value
             // (Evaluating attacker value requires more lookups)
             const targetA = board[a.to.r][a.to.c];
             const targetB = board[b.to.r][b.to.c];
             // We know they are not null due to filter
             // We'll trust Type here or cast, but for safety in strict null checks:
             const valA = targetA ? (targetA.type === PieceType.GENERAL ? 10000 : 10) : 0; 
             // Refine values if needed, but simple is fast for now
             const valB = targetB ? (targetB.type === PieceType.GENERAL ? 10000 : 10) : 0;
             return valB - valA;
        });

        for (const move of captures) {
            const captured = MoveGenerator.makeMove(board, move);
            
            if (isInCheck(board, turn)) {
                MoveGenerator.unmakeMove(board, move, captured);
                continue;
            }

            const nextTurn = turn === Color.RED ? Color.BLACK : Color.RED;
            const val = -this.quiescence(board, -beta, -alpha, nextTurn);
            
            MoveGenerator.unmakeMove(board, move, captured);

            if (this.stopSearch) return 0;

            if (val >= beta) {
                return beta;
            }
            if (val > alpha) {
                alpha = val;
            }
        }

        return alpha;
    }

    private shouldStop(): boolean {
        if (this.stopSearch) return true;
        if (Date.now() - this.startTime > this.timeLimit) {
            this.stopSearch = true;
            return true;
        }
        return false;
    }
}
