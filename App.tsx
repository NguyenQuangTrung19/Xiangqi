import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { User, Cpu, Clock, Flag, RefreshCw, AlertTriangle } from 'lucide-react';
import Board from './components/Board';
import PieceComponent from './components/Piece';
import { MainMenu, TournamentDashboard } from './components/TournamentViews';
import ErrorBoundary from './components/ErrorBoundary';
import { createInitialBoard } from './constants';
import { Piece, Position, Color, GameState, Move, PieceType, AppMode, TournamentState, TournamentType, Match, Difficulty } from './types';
import { getValidMoves, isInCheck } from './utils/gameLogic';
import { getBestMove } from './services/geminiService';
import { createTeams, generateLeagueSchedule, generateCupGroups, simulateMatch, updateStandings, generateKnockoutBracket } from './utils/tournamentLogic';

const AppContent: React.FC = () => {
  // Navigation State
  const [appMode, setAppMode] = useState<AppMode>(AppMode.MENU);
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  
  // Settings
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Match Execution State (Bo3)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchInternalScore, setMatchInternalScore] = useState<{ scoreA: number, scoreB: number, gamesPlayed: number }>({ scoreA: 0, scoreB: 0, gamesPlayed: 0 });

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    turn: Color.RED,
    selectedPos: null,
    validMoves: [],
    lastMove: null,
    winner: null,
    isAiThinking: false,
    history: [],
    isDraw: false,
    isCheck: false,
  });
  
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    console.log("Xiangqi System Initialized. Current Mode:", appMode);
  }, [appMode]);

  // Helper to deep copy board
  const cloneBoard = (board: (Piece | null)[][]) => board.map(row => row.map(p => (p ? { ...p } : null)));

  // --- TOURNAMENT HANDLERS (Unchanged Logic) ---
  const handleSelectMode = (mode: 'quick' | 'league' | 'cup') => {
    if (mode === 'quick') {
      resetGame();
      setAppMode(AppMode.GAME);
      setCurrentMatchId(null);
    } else if (mode === 'league') {
      const teams = createTeams(20); 
      const matches = generateLeagueSchedule(teams);
      setTournamentState({
        type: TournamentType.LEAGUE,
        teams, matches, currentRound: 1, isFinished: false, winnerId: null
      });
      setAppMode(AppMode.TOURNAMENT_DASHBOARD);
    } else if (mode === 'cup') {
      const teams = createTeams(32); 
      const { groups, matches } = generateCupGroups(teams);
      setTournamentState({
        type: TournamentType.CUP,
        teams, matches, currentRound: 1, isFinished: false, winnerId: null, groups, phase: 'GROUP'
      });
      setAppMode(AppMode.TOURNAMENT_DASHBOARD);
    }
  };

  const handleStartTournamentMatch = (matchId: string) => {
    setCurrentMatchId(matchId);
    setMatchInternalScore({ scoreA: 0, scoreB: 0, gamesPlayed: 0 });
    resetGame(Color.RED); 
    setAppMode(AppMode.GAME);
  };

  const startNextGameInMatch = () => {
    const nextGameIdx = matchInternalScore.gamesPlayed; 
    const nextColor = nextGameIdx % 2 === 0 ? Color.RED : Color.BLACK;
    resetGame(Color.RED);
  };

  const finalizeTournamentMatch = () => {
    if (!tournamentState || !currentMatchId) return;

    const newMatches = [...tournamentState.matches];
    const matchIndex = newMatches.findIndex(m => m.id === currentMatchId);
    if (matchIndex === -1) return;

    const match = { ...newMatches[matchIndex] };
    match.scoreA = matchInternalScore.scoreA;
    match.scoreB = matchInternalScore.scoreB;
    match.isPlayed = true;
    newMatches[matchIndex] = match;

    const currentRound = match.round;
    const stageName = match.stageName;
    
    // Simulate other matches
    for (let i = 0; i < newMatches.length; i++) {
      const m = newMatches[i];
      if (!m.isPlayed && m.round === currentRound && m.stageName === stageName && m.teamAId !== 'player' && m.teamBId !== 'player') {
          newMatches[i] = simulateMatch(m, tournamentState.teams);
      }
    }

    let newTeams = updateStandings(tournamentState.teams, newMatches);
    let newPhase = tournamentState.phase;
    let winnerId = tournamentState.winnerId;
    let isFinished = tournamentState.isFinished;

    if (tournamentState.type === TournamentType.LEAGUE) {
        const allPlayed = newMatches.every(m => m.isPlayed);
        if (allPlayed) {
            isFinished = true;
            winnerId = newTeams[0].id; 
        }
    }
    else if (tournamentState.type === TournamentType.CUP) {
        const isRoundComplete = (r: number) => newMatches.filter(m => m.round === r).every(m => m.isPlayed);

        if (tournamentState.phase === 'GROUP') {
            const allGroupPlayed = newMatches.filter(m => m.stageName?.includes("Bảng")).every(m => m.isPlayed);
            if (allGroupPlayed) {
               newPhase = 'KNOCKOUT';
               const r16 = generateKnockoutBracket({ ...tournamentState, phase: 'GROUP' }, newMatches, newTeams);
               newMatches.push(...r16);
            }
        } else if (tournamentState.phase === 'KNOCKOUT') {
            const maxRound = Math.max(...newMatches.map(m => m.round));
            if (isRoundComplete(maxRound)) {
                if (maxRound === 5) {
                    const finalMatch = newMatches.find(m => m.round === 5);
                    if (finalMatch) {
                        winnerId = finalMatch.scoreA! > finalMatch.scoreB! ? finalMatch.teamAId : finalMatch.teamBId;
                        isFinished = true;
                    }
                } else {
                    const nextMatches = generateKnockoutBracket({ ...tournamentState, phase: 'KNOCKOUT' }, newMatches, newTeams);
                    newMatches.push(...nextMatches);
                }
            }
        }
    }

    setTournamentState({
      ...tournamentState,
      matches: newMatches,
      teams: newTeams,
      phase: newPhase,
      winnerId,
      isFinished
    });
    setAppMode(AppMode.TOURNAMENT_DASHBOARD);
  };

  const handleGameEnd = (winnerColor: Color | 'draw') => {
    if (appMode !== AppMode.GAME) return;
    
    // Confetti Effect
    if (winnerColor === Color.RED) {
        const end = Date.now() + 1000;
        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff2a6d', '#ffffff']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff2a6d', '#ffffff']
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    }

    if (!tournamentState || !currentMatchId) return; 

    let gameWinA = 0;
    let gameWinB = 0;
    if (winnerColor === Color.RED) gameWinA = 1;
    else if (winnerColor === Color.BLACK) gameWinB = 1;

    setMatchInternalScore({
        scoreA: matchInternalScore.scoreA + gameWinA,
        scoreB: matchInternalScore.scoreB + gameWinB,
        gamesPlayed: matchInternalScore.gamesPlayed + 1
    });
  };

  // --- GAME LOGIC ---

  const handleSquareClick = async (r: number, c: number) => {
    if (gameState.winner || gameState.isDraw || (gameState.isAiThinking && aiEnabled && gameState.turn === Color.BLACK)) return;

    const clickedPiece = gameState.board[r][c];
    const isSameColor = clickedPiece?.color === gameState.turn;

    // Selection
    if (isSameColor) {
      if (clickedPiece) {
        const moves = getValidMoves(gameState.board, clickedPiece);
        setGameState(prev => ({
          ...prev,
          selectedPos: { r, c },
          validMoves: moves
        }));
      }
      return;
    }

    // Move
    if (gameState.selectedPos) {
      const isMoveValid = gameState.validMoves.some(m => m.r === r && m.c === c);
      if (isMoveValid) {
        await executeMove({ from: gameState.selectedPos, to: { r, c } });
      } else {
        setGameState(prev => ({ ...prev, selectedPos: null, validMoves: [] }));
      }
    }
  };

  const executeMove = useCallback(async (move: Move) => {
    setGameState(prev => {
      const newBoard = cloneBoard(prev.board);
      const piece = newBoard[move.from.r][move.from.c];
      const target = newBoard[move.to.r][move.to.c];
      let winner = prev.winner;

      if (piece) {
        if (target && target.type === PieceType.GENERAL) winner = piece.color;
        piece.position = { r: move.to.r, c: move.to.c };
        newBoard[move.to.r][move.to.c] = piece;
        newBoard[move.from.r][move.from.c] = null;
      }
      
      const nextTurn = prev.turn === Color.RED ? Color.BLACK : Color.RED;
      const nextPlayerInCheck = isInCheck(newBoard, nextTurn);

      return {
        ...prev,
        board: newBoard,
        turn: nextTurn,
        selectedPos: null,
        validMoves: [],
        lastMove: move,
        winner: winner,
        isAiThinking: false,
        isCheck: nextPlayerInCheck && !winner, 
      };
    });
  }, []);

  useEffect(() => {
    if (gameState.winner) {
       setTimeout(() => handleGameEnd(gameState.winner!), 300);
    }
  }, [gameState.winner]);

  // AI Implementation (kept same logic, wrapped in useEffect)
  useEffect(() => {
    if (appMode === AppMode.GAME && aiEnabled && gameState.turn === Color.BLACK && !gameState.winner && !gameState.isDraw) {
      const makeAiMove = async () => {
        setGameState(prev => ({ ...prev, isAiThinking: true }));
        
        let aiDifficulty = difficulty;
        if (tournamentState && currentMatchId) {
            const match = tournamentState.matches.find(m => m.id === currentMatchId);
            if (match) {
                const opponentId = match.teamAId === 'player' ? match.teamBId : match.teamAId;
                const opponent = tournamentState.teams.find(t => t.id === opponentId);
                if (opponent) {
                    if (opponent.strength <= 4) aiDifficulty = 'easy';
                    else if (opponent.strength <= 7) aiDifficulty = 'medium';
                    else aiDifficulty = 'hard';
                }
            }
        }

        const move = await getBestMove(gameState.board, Color.BLACK, aiDifficulty);
        
        if (move) {
            const piece = gameState.board[move.from.r][move.from.c];
            if (piece && piece.color === Color.BLACK) {
                const validMoves = getValidMoves(gameState.board, piece);
                const isValid = validMoves.some(vm => vm.r === move.to.r && vm.c === move.to.c);
                if (isValid) {
                    await executeMove(move);
                    return;
                }
            }
        }
        
        // Fallback Random
        const pieces: Piece[] = [];
        gameState.board.forEach(row => row.forEach(p => {
            if (p && p.color === Color.BLACK) pieces.push(p);
        }));
        const shuffled = pieces.sort(() => 0.5 - Math.random());
        for (const p of shuffled) {
            const moves = getValidMoves(gameState.board, p);
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                await executeMove({ from: p.position, to: randomMove });
                break;
            }
        }
      };
      
      makeAiMove();
    }
  }, [gameState.turn, gameState.winner, gameState.isDraw, aiEnabled, gameState.board, executeMove, appMode, difficulty, tournamentState, currentMatchId]);

  const resetGame = (startTurn: Color = Color.RED) => {
    setGameState({
      board: createInitialBoard(),
      turn: startTurn, selectedPos: null, validMoves: [], lastMove: null, winner: null, isAiThinking: false, history: [], isDraw: false, isCheck: false
    });
  };

  // Determine opponent info
  let opponentName = "Gemini AI";
  let opponentStrength = difficulty;
  if (tournamentState && currentMatchId) {
     const match = tournamentState.matches.find(m => m.id === currentMatchId);
     if (match) {
         const opponentId = match.teamAId === 'player' ? match.teamBId : match.teamAId;
         const opponent = tournamentState.teams.find(t => t.id === opponentId);
         if (opponent) {
            opponentName = opponent.name;
            if (opponent.strength <= 4) opponentStrength = 'easy';
            else if (opponent.strength <= 7) opponentStrength = 'medium';
            else opponentStrength = 'hard';
         }
     }
  }

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-tech-grid text-slate-200 font-sans selection:bg-cyber-neonBlue selection:text-black flex flex-col items-center justify-center p-0 md:p-6 overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-neonBlue/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-neonRed/5 blur-[120px] rounded-full pointer-events-none" />

      {/* MENU MODE */}
      {appMode === AppMode.MENU && (
         <MainMenu 
           onSelectMode={handleSelectMode} 
           currentDifficulty={difficulty}
           onSetDifficulty={setDifficulty}
         />
      )}

      {/* DASHBOARD MODE */}
      {appMode === AppMode.TOURNAMENT_DASHBOARD && tournamentState && (
         <TournamentDashboard 
            state={tournamentState} 
            onPlayNext={handleStartTournamentMatch}
            onBack={() => setAppMode(AppMode.MENU)}
         />
      )}

      {/* GAME MODE LAYOUT */}
      {appMode === AppMode.GAME && (
        <div className="w-full max-w-6xl h-full md:h-auto flex flex-col md:flex-row gap-6 items-center md:items-start z-10">
          
          {/* LEFT: Game Board Area */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 w-full max-w-[600px] flex flex-col items-center"
          >
             {/* CHECK OVERLAY PULSE */}
             <AnimatePresence>
                {gameState.isCheck && !gameState.winner && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
                    >
                         <div className="w-[80%] h-[80%] bg-red-600/10 blur-3xl rounded-full animate-pulse-fast"></div>
                    </motion.div>
                )}
             </AnimatePresence>

             {/* The Board */}
             <div className="relative w-full aspect-[9/10] backdrop-blur-sm rounded-lg shadow-2xl border-4 border-cyber-800 touch-manipulation z-10">
                 <Board />
                 
                 {/* Click Grid */}
                 <div className="absolute inset-0 grid grid-rows-10 grid-cols-9 z-10">
                    {gameState.board.map((row, r) => (
                        row.map((_, c) => (
                            <div 
                                key={`cell-${r}-${c}`}
                                className="w-full h-full relative"
                                onClick={() => handleSquareClick(r, c)}
                            >
                                {/* Valid Move Dot */}
                                {gameState.validMoves.some(m => m.r === r && m.c === c) && (
                                    <div className="absolute inset-0 m-auto w-3 h-3 md:w-4 md:h-4 rounded-full bg-cyber-neonBlue/50 shadow-[0_0_10px_#05d9e8] animate-pulse pointer-events-none" />
                                )}
                                {/* Last Move Highlight */}
                                {gameState.lastMove && ((gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) || (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c)) && (
                                    <div className="absolute inset-0 m-auto w-full h-full bg-cyber-neonGold/20 mix-blend-overlay pointer-events-none border border-cyber-neonGold/30" />
                                )}
                            </div>
                        ))
                    ))}
                 </div>

                 {/* Pieces */}
                 {gameState.board.flat().map((piece) => {
                    if (!piece) return null;
                    const left = ((piece.position.c + 0.5) / 9) * 100 + '%';
                    const top = ((piece.position.r + 0.5) / 10) * 100 + '%';
                    const isSelected = gameState.selectedPos?.r === piece.position.r && gameState.selectedPos?.c === piece.position.c;
                    const isKingUnderCheck = piece.type === PieceType.GENERAL && piece.color === gameState.turn && gameState.isCheck;
                    return (
                        <PieceComponent 
                            key={piece.id}
                            piece={piece}
                            isSelected={isSelected}
                            isInCheck={isKingUnderCheck}
                            onClick={() => handleSquareClick(piece.position.r, piece.position.c)}
                            style={{ left, top, width: '11.11%', height: '10%' }}
                        />
                    );
                })}
                
                {/* VICTORY MODAL OVERLAY */}
                <AnimatePresence>
                {(gameState.winner || gameState.isDraw) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                         <div className="bg-cyber-950 border-2 border-cyber-neonGold p-8 rounded-2xl shadow-[0_0_50px_rgba(255,204,0,0.2)] text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-tr from-cyber-neonGold/10 to-transparent animate-pulse-fast"></div>
                              <h2 className="text-5xl font-display font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-2 relative z-10">
                                  {gameState.isDraw ? "DRAW" : "VICTORY"}
                              </h2>
                              <p className="text-slate-400 font-mono mb-6 relative z-10">
                                  {gameState.isDraw ? "Game ended in a draw" : `${gameState.winner === Color.RED ? "RED" : "BLACK"} WINS THE MATCH`}
                              </p>
                              <div className="flex flex-col gap-3 relative z-10">
                                  {tournamentState ? (
                                      <>
                                        <button onClick={startNextGameInMatch} className="bg-cyber-neonBlue text-cyber-950 font-bold py-3 px-6 rounded-lg hover:scale-105 transition-transform">
                                            Next Game
                                        </button>
                                        <button onClick={finalizeTournamentMatch} className="border border-slate-600 hover:bg-slate-800 text-slate-300 py-3 px-6 rounded-lg transition-colors">
                                            Finish Match
                                        </button>
                                      </>
                                  ) : (
                                      <button onClick={() => resetGame()} className="bg-cyber-neonBlue text-cyber-950 font-bold py-3 px-8 rounded-lg hover:scale-105 transition-transform shadow-neon-blue">
                                          Play Again
                                      </button>
                                  )}
                              </div>
                         </div>
                    </motion.div>
                )}
                </AnimatePresence>
             </div>
          </motion.div>

          {/* RIGHT: Stats Panel (Side Panel) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-80 flex flex-col gap-4 mt-6 md:mt-0"
          >
             {/* Player Card */}
             <div className="bg-cyber-900/80 backdrop-blur border border-cyber-700 p-4 rounded-xl shadow-lg flex items-center gap-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-cyber-neonRed/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-neonRed to-purple-600 flex items-center justify-center text-white shadow-neon-red">
                     <User size={24} />
                 </div>
                 <div className="flex-1">
                     <div className="text-xs text-cyber-neonRed font-bold uppercase tracking-wider">Player (Red)</div>
                     <div className="font-display text-lg font-bold">You</div>
                 </div>
                 {gameState.turn === Color.RED && !gameState.winner && (
                     <div className="w-3 h-3 bg-cyber-neonRed rounded-full animate-pulse shadow-neon-red"></div>
                 )}
             </div>

             {/* VS Connector */}
             <div className="flex justify-center -my-2 z-10">
                 <div className="bg-cyber-950 border border-cyber-700 px-3 py-1 rounded-full text-xs font-mono text-slate-500">VS</div>
             </div>

             {/* Opponent Card */}
             <div className="bg-cyber-900/80 backdrop-blur border border-cyber-700 p-4 rounded-xl shadow-lg flex items-center gap-4 relative overflow-hidden">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-neonBlue to-cyan-600 flex items-center justify-center text-cyber-950 shadow-neon-blue">
                     <Cpu size={24} />
                 </div>
                 <div className="flex-1">
                     <div className="text-xs text-cyber-neonBlue font-bold uppercase tracking-wider">Opponent (Black)</div>
                     <div className="font-display text-lg font-bold">{opponentName}</div>
                     <div className="text-[10px] text-slate-400 font-mono uppercase">{opponentStrength} Bot</div>
                 </div>
                 {gameState.turn === Color.BLACK && !gameState.winner && !gameState.isAiThinking && (
                     <div className="w-3 h-3 bg-cyber-neonBlue rounded-full animate-pulse shadow-neon-blue"></div>
                 )}
                 {gameState.isAiThinking && (
                     <RefreshCw size={16} className="text-cyber-neonBlue animate-spin" />
                 )}
             </div>

             {/* Match Info / Scoreboard */}
             <div className="bg-cyber-950/50 border border-cyber-800 rounded-xl p-4 mt-2">
                 {tournamentState ? (
                     <div className="text-center">
                         <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Match Score</div>
                         <div className="flex justify-center items-center gap-4 font-mono text-3xl font-bold">
                             <span className="text-cyber-neonRed">{matchInternalScore.scoreA}</span>
                             <span className="text-slate-600">-</span>
                             <span className="text-cyber-neonBlue">{matchInternalScore.scoreB}</span>
                         </div>
                         <div className="text-xs text-slate-600 mt-2">Best of 3 • Game {matchInternalScore.gamesPlayed + (gameState.winner || gameState.isDraw ? 0 : 1)}</div>
                     </div>
                 ) : (
                     <div className="flex flex-col gap-2">
                         <div className="flex justify-between text-sm">
                             <span className="text-slate-500">Mode</span>
                             <span className="text-slate-200 font-bold">Quick Match</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-slate-500">Status</span>
                             <span className="text-cyber-neonGold">
                                 {gameState.isCheck ? "CHECK!" : "In Progress"}
                             </span>
                         </div>
                     </div>
                 )}
             </div>

             {/* Actions */}
             <div className="grid grid-cols-2 gap-3 mt-auto">
                 <button onClick={() => setGameState(prev => ({...prev, isDraw: true}))} className="flex items-center justify-center gap-2 bg-cyber-800 hover:bg-cyber-700 text-slate-300 py-3 rounded-lg text-sm font-bold transition-colors">
                     <Flag size={16} /> Draw
                 </button>
                 <button 
                    onClick={() => tournamentState ? setAppMode(AppMode.TOURNAMENT_DASHBOARD) : setAppMode(AppMode.MENU)} 
                    className="flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 py-3 rounded-lg text-sm font-bold transition-colors"
                 >
                     <AlertTriangle size={16} /> Quit
                 </button>
             </div>
             
             {/* Check Alert Sidebar Visual */}
             {gameState.isCheck && !gameState.winner && (
                 <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-3 animate-pulse">
                     <AlertTriangle className="text-red-500" />
                     <div className="text-red-200 font-bold font-display">KING UNDER ATTACK</div>
                 </div>
             )}

          </motion.div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;