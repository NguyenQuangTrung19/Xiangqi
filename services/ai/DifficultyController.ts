import { Color, Difficulty, GameState, Match, Team, TournamentState } from '../../types';
import { evaluateBoard } from './Evaluation';

interface AiParams {
    difficulty: Difficulty;
    depthAdjustment: number; // 0, -1, +1
    randomness: number; // 0.0 to 1.0 (prob of suboptimal move)
    errorProb: number; // 0.0 to 0.2 (prob of making a mistake)
}

export class DifficultyController {
    
    static getAiParams(
        gameState: GameState, 
        baseDifficulty: Difficulty, 
        matchContext?: { 
            match: Match, 
            playerTeam: Team, 
            aiTeam: Team,
            tournamentType: 'league' | 'cup' 
        }
    ): AiParams {
        
        let params: AiParams = {
            difficulty: baseDifficulty,
            depthAdjustment: 0,
            randomness: 0,
            errorProb: 0
        };

        // 1. Base Configuration based on Difficulty / Context
        if (matchContext) {
            // League Mode: Use hidden strength
            if (matchContext.tournamentType === 'league') {
                const strength = matchContext.aiTeam.strength; // 1-10
                if (strength >= 8) {
                    params.difficulty = 'hard';
                    params.errorProb = 0.01;
                } else if (strength >= 5) {
                    params.difficulty = 'medium';
                    params.errorProb = 0.05;
                } else {
                    params.difficulty = 'easy';
                    params.errorProb = 0.20;
                }
            }
            // Cup Mode: Standard logic (Med for Groups, Hard for Knockout is handled by App)
        }

        // 2. Dynamic Balancing (Fairness Rule)
        // If Player is losing badly, soften the AI.
        // If Player is winning too easily, sharpen the AI.
        
        const score = evaluateBoard(gameState.board, gameState.turn);
        // Score is relative to current turn. 
        // We need score relative to AI.
        // If turn is AI (Black), score is (Red - Black). So negative score is good for AI.
        // Let's get absolute material difference.
        
        // Simple heuristic: Count pieces or use eval
        // evaluateBoard returns: (RedVal + RedPST) - (BlackVal + BlackPST)
        // If AI is Black:
        // Score > 500 (Red/Player up by a Rook) -> AI is losing badly -> Play sharper (increase depth?) or accept fate?
        // Actually, "Fairness" usually means:
        // - If Player is losing (Score < -500), AI should be "nicer" (increase randomness/error).
        // - If Player is winning (Score > 500), AI should try harder (max depth).
        
        // Let's assume AI is ALWAYS Black for now in single player/tournament vs Player.
        
        if (score < -800) { 
            // AI (Black) is winning by > 800 (almost 2 pieces)
            // Mercy mode: Reduce depth or increase randomness
            params.randomness = Math.max(params.randomness, 0.2); // 20% chance to pick 2nd best move
            // params.depthAdjustment = -1; // Maybe?
        } 
        else if (score > 800) {
            // AI is losing by > 800
            // Try hard mode
            params.depthAdjustment = 1; 
            params.randomness = 0;
            params.errorProb = 0;
        }

        return params;
    }

    // Modify the engine request based on params
    static adjustEngineRequest(baseDifficulty: Difficulty, params: AiParams): { depth: number, timeLimit: number } {
        let depth = 4;
        let timeLimit = 1500;

        // Base
        switch (params.difficulty) {
            case 'easy': depth = 2; timeLimit = 500; break;
            case 'medium': depth = 4; timeLimit = 1500; break;
            case 'hard': depth = 6; timeLimit = 3000; break;
        }

        // Adjust
        depth += params.depthAdjustment;
        
        // Clamp
        depth = Math.max(2, Math.min(8, depth));

        return { depth, timeLimit };
    }
}
