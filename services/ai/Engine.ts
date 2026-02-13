import { Piece, Color, Move, Difficulty } from '../../types';
import { Search } from './Search';

export class XiangqiEngine {
    private searcher: Search;

    constructor() {
        this.searcher = new Search();
    }

    getBestMove(board: (Piece | null)[][], turn: Color, difficulty: Difficulty): Move | null {
        let depth = 4; // Default Medium
        let timeLimit = 1500; // 1.5s default

        switch (difficulty) {
            case 'easy':
                depth = 2;
                timeLimit = 500;
                break;
            case 'medium':
                depth = 4;
                timeLimit = 1500;
                break;
            case 'hard':
                depth = 6;
                timeLimit = 3000;
                break;
        }

        console.log(`Starting AI Search: ${difficulty} (Depth ${depth}, Time ${timeLimit}ms)`);
        
        // Clone board to prevent mutation during search (Search uses makeMove/unmakeMove but to be safe)
        // Actually Search uses make/unmake so it restores state. But if it crashes or bugs out, we don't want to corrupt UI state.
        // Cloning 10x9 array is cheap enough to do ONCE per move.
        const boardClone = board.map(row => row.map(p => (p ? { ...p } : null)));

        return this.searcher.search(boardClone, turn, depth, timeLimit);
    }
}
