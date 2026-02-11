export enum Color {
  RED = 'red',
  BLACK = 'black',
}

export enum PieceType {
  GENERAL = 'general', // King
  ADVISOR = 'advisor',
  ELEPHANT = 'elephant',
  HORSE = 'horse',
  CHARIOT = 'chariot', // Rook
  CANNON = 'cannon',
  SOLDIER = 'soldier',
}

export interface Position {
  r: number; // 0-9
  c: number; // 0-8
}

export interface Piece {
  id: string;
  type: PieceType;
  color: Color;
  position: Position;
}

export interface Move {
  from: Position;
  to: Position;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  board: (Piece | null)[][]; // 10 rows, 9 cols
  turn: Color;
  selectedPos: Position | null;
  validMoves: Position[];
  lastMove: Move | null;
  winner: Color | null;
  isAiThinking: boolean;
  history: string[]; // Algebraic notation or similar
  isDraw?: boolean;
  isCheck?: boolean; // New: Is the current turn player under check?
}

// --- TOURNAMENT TYPES ---

export enum AppMode {
  MENU = 'menu',
  GAME = 'game',
  TOURNAMENT_DASHBOARD = 'tournament_dashboard'
}

export enum TournamentType {
  LEAGUE = 'league', // Round Robin (Ngoại hạng)
  CUP = 'cup',       // Group -> Knockout (World Cup)
}

export interface Team {
  id: string;
  name: string;
  isPlayer: boolean; // True if it's the human user
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
  };
  strength: number; // 1-10, for AI simulation
}

export interface Match {
  id: string;
  round: number; // Round number or Stage (e.g. 100 = Quarter Final)
  teamAId: string;
  teamBId: string;
  scoreA: number | null; // Null if not played
  scoreB: number | null;
  isPlayed: boolean;
  stageName?: string; // "Group A", "Final", etc.
}

export interface TournamentState {
  type: TournamentType;
  teams: Team[];
  matches: Match[];
  currentRound: number;
  isFinished: boolean;
  winnerId: string | null;
  groups?: Record<string, string[]>; // For Cup: { 'A': [teamId1, ...], 'B': [...] }
  phase?: 'GROUP' | 'KNOCKOUT'; // For Cup
}