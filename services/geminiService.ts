import { GoogleGenAI, Type } from "@google/genai";
import { Move, Piece, Color, Difficulty } from '../types';
import { boardToFen } from '../utils/gameLogic';

export const getBestMove = async (board: (Piece | null)[][], turn: Color, difficulty: Difficulty): Promise<Move | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fen = boardToFen(board, turn);
    
    // Use 'gemini-3-flash-preview' for ALL levels for maximum speed.
    // It is smart enough for Xiangqi and significantly faster than Pro.
    const modelName = 'gemini-3-flash-preview';
    let systemInstruction = '';

    switch (difficulty) {
      case 'easy':
        systemInstruction = `You are a beginner Xiangqi (Chinese Chess) player.
        Play fast and aggressively.
        Focus on simple captures.
        Do not calculate deep variations. 
        It is acceptable to make minor positional mistakes.`;
        break;
      
      case 'medium':
        systemInstruction = `You are an intermediate Xiangqi player (Club level).
        Play solid standard opening moves.
        Control the center and protect your key pieces.
        Avoid obvious blunders like losing a Chariot for free.`;
        break;
      
      case 'hard':
        systemInstruction = `You are a Xiangqi Grandmaster engine.
        Analyze the FEN position accurately.
        Find the optimal move that maximizes winning chances.
        Consider material balance, king safety, and initiative.
        Punish any mistake by the opponent.`;
        break;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Current FEN: ${fen}
      Turn: ${turn}
      
      Task: Generate the best move for ${turn}.
      Return ONLY the move JSON.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            from: {
              type: Type.OBJECT,
              properties: {
                r: { type: Type.INTEGER },
                c: { type: Type.INTEGER }
              }
            },
            to: {
              type: Type.OBJECT,
              properties: {
                r: { type: Type.INTEGER },
                c: { type: Type.INTEGER }
              }
            }
          }
        }
        // Removed thinkingConfig to ensure fast response ( < 2-3 seconds )
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const move = JSON.parse(text) as Move;
    return move;
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};