import { Piece, Color, Move, Difficulty } from '../types';

let worker: Worker | null = null;

export const getBestMove = (board: (Piece | null)[][], turn: Color, difficulty: Difficulty): Promise<Move | null> => {
    return new Promise((resolve, reject) => {
        if (!worker) {
            // Initialize worker
            worker = new Worker(new URL('./ai/ai.worker.ts', import.meta.url), { type: 'module' });
            
            worker.onmessage = (e: MessageEvent) => {
                 // We only expect one message per move request for now
                 // In a more complex setup, we'd need IDs to match requests
            };
            
            worker.onerror = (error) => {
                console.error("Worker Error:", error);
                reject(error);
            };
        }

        // Set specific handler for this request
        // Note: This simple implementation assumes sequential requests (one at a time)
        // Which is true for a chess game (AI moves, then waits).
        worker.onmessage = (e: MessageEvent) => {
            const move = e.data as Move | null;
            resolve(move);
        };

        worker.postMessage({ board, turn, difficulty });
    });
};

export const terminateAi = () => {
    if (worker) {
        worker.terminate();
        worker = null;
    }
};
