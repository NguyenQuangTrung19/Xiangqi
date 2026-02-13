import { XiangqiEngine } from './Engine';
import { Color, Difficulty, Piece } from '../../types';

const engine = new XiangqiEngine();

self.onmessage = (e: MessageEvent) => {
    const { board, turn, difficulty } = e.data as { 
        board: (Piece | null)[][], 
        turn: Color, 
        difficulty: Difficulty 
    };
    
    try {
        const move = engine.getBestMove(board, turn, difficulty);
        self.postMessage(move);
    } catch (error) {
        console.error("AI Worker Error:", error);
        self.postMessage(null);
    }
};
