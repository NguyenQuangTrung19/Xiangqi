import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { User, Cpu, Clock, Flag, RefreshCw, AlertTriangle, Settings, Volume2 } from 'lucide-react';
import Board from './components/Board';
import PieceComponent from './components/Piece';
import { MainMenu, TournamentDashboard } from './components/TournamentViews';
import ErrorBoundary from './components/ErrorBoundary';
import { createInitialBoard } from './constants';
import { Piece, Position, Color, GameState, Move, PieceType, AppMode, TournamentState, TournamentType, Match, Difficulty } from './types';
import { getValidMoves, isInCheck } from './utils/gameLogic';
import { getBestMove } from './services/aiService';
import { createTeams, generateLeagueSchedule, generateCupGroups, simulateMatch, updateStandings, generateKnockoutBracket } from './utils/tournamentLogic';
import { t } from './utils/i18n';
import { playSound } from './utils/sound';
import { saveTournament, loadTournament, clearTournament } from './utils/storage';
import { DifficultyController } from './services/ai/DifficultyController';

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

  // Load Tournament on Mount
  useEffect(() => {
    const saved = loadTournament();
    if (saved) {
        setTournamentState(saved);
        // Does not auto-switch mode, manual resume via menu
    }
  }, []);

  // Save Tournament on Change
  useEffect(() => {
    if (tournamentState) {
        saveTournament(tournamentState);
    }
  }, [tournamentState]);

  // Helper to deep copy board
  const cloneBoard = (board: (Piece | null)[][]) => board.map(row => row.map(p => (p ? { ...p } : null)));

  // --- TOURNAMENT HANDLERS ---
  const handleSelectMode = (mode: 'quick' | 'league' | 'cup' | 'resume') => {
    playSound('click');
    if (mode === 'quick') {
      resetGame();
      setAppMode(AppMode.GAME);
      setCurrentMatchId(null);
    } else if (mode === 'resume') {
        if (tournamentState) {
            setAppMode(AppMode.TOURNAMENT_DASHBOARD);
        }
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
    playSound('click');
    setCurrentMatchId(matchId);
    setMatchInternalScore({ scoreA: 0, scoreB: 0, gamesPlayed: 0 });
    resetGame(Color.RED); 
    setAppMode(AppMode.GAME);
  };

  const startNextGameInMatch = () => {
    playSound('click');
    const nextGameIdx = matchInternalScore.gamesPlayed; 
    const nextColor = nextGameIdx % 2 === 0 ? Color.RED : Color.BLACK;
    resetGame(Color.RED);
  };

  const finalizeTournamentMatch = () => {
    playSound('click');
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
            winnerId = newTeams[0].id; // Winner is top of table
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
                if (maxRound === 5) { // Final
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
    
    if (isFinished) {
        clearTournament();
        setTournamentState({ ...tournamentState, matches: newMatches, teams: newTeams, phase: newPhase, winnerId, isFinished });
    } else {
        setTournamentState({
          ...tournamentState,
          matches: newMatches,
          teams: newTeams,
          phase: newPhase,
          winnerId,
          isFinished
        });
    }
    
    setAppMode(AppMode.TOURNAMENT_DASHBOARD);
  };

  const handleGameEnd = (winnerColor: Color | 'draw') => {
    if (appMode !== AppMode.GAME) return;
    
    if (winnerColor === Color.RED) {
        playSound('win');
        const end = Date.now() + 2000;
        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff2a6d', '#ffd700', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff2a6d', '#ffd700', '#ffffff']
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    } else if (winnerColor === Color.BLACK) {
        playSound('lose');
    } else {
        playSound('lose');
    }

    if (!tournamentState || !currentMatchId) return; 

    let gameWinA = 0; // A is usually Player (Red)
    let gameWinB = 0; // B is Opponent
    
    // Check who is who in the match
    const match = tournamentState.matches.find(m => m.id === currentMatchId);
    if (match) {
        // Assuming Player is always Team A (or we check IDs)
        // Logic: ResetGame(RED) -> Player starts Red.
        if (winnerColor === Color.RED) gameWinA = 1;
        else if (winnerColor === Color.BLACK) gameWinB = 1;
        // Draw: 0.5? Logic uses integer wins currently for Bo3.
    }

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
        playSound('click');
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
      
      if (target) playSound('capture');
      else playSound('move');

      if (piece) {
        if (target && target.type === PieceType.GENERAL) winner = piece.color;
        piece.position = { r: move.to.r, c: move.to.c };
        newBoard[move.to.r][move.to.c] = piece;
        newBoard[move.from.r][move.from.c] = null;
      }
      
      const nextTurn = prev.turn === Color.RED ? Color.BLACK : Color.RED;
      const nextPlayerInCheck = isInCheck(newBoard, nextTurn);
      
      if (nextPlayerInCheck && !winner) {
          playSound('check');
      }

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

  // AI Implementation (Dynamic Difficulty)
  useEffect(() => {
    if (appMode === AppMode.GAME && aiEnabled && gameState.turn === Color.BLACK && !gameState.winner && !gameState.isDraw) {
      const makeAiMove = async () => {
        setGameState(prev => ({ ...prev, isAiThinking: true }));
        
        // 1. Determine Context
        let matchContext = undefined;
        let baseDiff = difficulty;
        
        if (tournamentState && currentMatchId) {
            const match = tournamentState.matches.find(m => m.id === currentMatchId);
            if (match) {
                const opponentId = match.teamAId === 'player' ? match.teamBId : match.teamAId;
                const opponent = tournamentState.teams.find(t => t.id === opponentId);
                const playerTeam = tournamentState.teams.find(t => t.id === 'player');
                
                if (opponent && playerTeam) {
                    matchContext = {
                        match,
                        playerTeam,
                        aiTeam: opponent,
                        tournamentType: tournamentState.type === TournamentType.LEAGUE ? 'league' : 'cup' as any
                    };
                }
            }
        }

        // 2. Get Dynamic Params
        const params = DifficultyController.getAiParams(gameState, baseDiff, matchContext);
        
        // 3. Adjust Engine Request
        // We'll pass Difficulty string to engine, but we might want more granular control.
        // Current Engine.ts only accepts 'easy'|'medium'|'hard'. 
        // We can map params.difficulty to that, or modify Engine to take depth/randomness.
        // For now, let's map the Adjusted Difficulty from Controller.
        
        // Simulating robust request by just passing the difficulty determined by controller
        // Note: Controller returns params.difficulty (enum) AND randomness/error.
        // We need to pass these to the service/engine.
        // Currently getBestMove only takes (board, turn, difficulty).
        // To support advanced params, we'd need to update the AI pipeline.
        // For MVP, we'll trust the difficulty mapping from Controller and rely on base engine behavior,
        // OR we quickly update getBestMove to accept options?
        // Let's rely on the mapped difficulty for now (Controller maps 1-10 strength -> Easy/Med/Hard).
        
        // Add artificial waiting time
        await new Promise(r => setTimeout(r, 600)); 

        const move = await getBestMove(gameState.board, Color.BLACK, params.difficulty);
        
        if (move) {
            const piece = gameState.board[move.from.r][move.from.c];
            if (piece && piece.color === Color.BLACK) {
                 await executeMove(move);
                 return;
            }
        }
        
        // Fallback Random
        console.warn("AI returned null move, falling back to random.");
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
    playSound('click');
    setGameState({
      board: createInitialBoard(),
      turn: startTurn, selectedPos: null, validMoves: [], lastMove: null, winner: null, isAiThinking: false, history: [], isDraw: false, isCheck: false
    });
  };

  // Determine opponent info for UI
  let opponentName = "Vua Quang Trung";
  let opponentStrength = difficulty;
  if (tournamentState && currentMatchId) {
     const match = tournamentState.matches.find(m => m.id === currentMatchId);
     if (match) {
         const opponentId = match.teamAId === 'player' ? match.teamBId : match.teamAId;
         const opponent = tournamentState.teams.find(t => t.id === opponentId);
         if (opponent) {
            opponentName = opponent.name;
            // Hide exact difficulty in League mode, show "Rank" or "Strength"
             if (opponent.strength <= 4) opponentStrength = 'easy';
             else if (opponent.strength <= 7) opponentStrength = 'medium';
             else opponentStrength = 'hard';
         }
     }
  }

  // --- RENDER ---

  // Screen Shake Animation Controls
  const shakeVariants = {
      idle: { x: 0 },
      shake: { 
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
      }
  };

  return (
    <motion.div 
        animate={gameState.isCheck ? "shake" : "idle"}
        variants={shakeVariants}
        className="min-h-screen bg-[#2c241b] text-china-wood-light font-serif selection:bg-china-red selection:text-white flex flex-col items-center justify-center p-0 md:p-6 overflow-hidden relative"
    >
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-china-red/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-china-gold/5 blur-[150px] rounded-full pointer-events-none" />

      {/* CHECK OVERLAY ANIMATION */}
      <AnimatePresence>
        {gameState.isCheck && !gameState.winner && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: -100 }}
                animate={{ opacity: 1, scale: 1.2, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            >
                <div className="relative">
                    <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] stroke-text-white" style={{ WebkitTextStroke: '2px white' }}>
                        {t('game.check')}
                    </h1>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MENU MODE */}
      {appMode === AppMode.MENU && (
         <MainMenu 
           onSelectMode={handleSelectMode} 
           currentDifficulty={difficulty}
           onSetDifficulty={(d) => { playSound('click'); setDifficulty(d); }}
           hasSavedGame={!!tournamentState}
         />
      )}

      {/* DASHBOARD MODE */}
      {appMode === AppMode.TOURNAMENT_DASHBOARD && tournamentState && (
         <TournamentDashboard 
            state={tournamentState} 
            onPlayNext={handleStartTournamentMatch}
            onBack={() => { playSound('click'); setAppMode(AppMode.MENU); }}
         />
      )}

      {/* GAME UI */}
      {appMode === AppMode.GAME && (
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-4 h-[100dvh] p-4">
            
            {/* Header: Turn Info & Controls */}
            <div className="w-full flex justify-between items-center bg-china-paper/10 backdrop-blur-md p-3 rounded-xl border border-china-wood-light/20 shadow-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => setAppMode(AppMode.MENU)} className="p-2 bg-china-wood-dark rounded-lg text-china-paper hover:bg-china-red transition-colors">
                        <User size={20} />
                    </button>
                    <div className="flex flex-col">
                        <div className="text-xs text-china-wood-light uppercase tracking-wider font-bold">Lượt đi</div>
                        <div className={`text-xl font-bold ${gameState.turn === Color.RED ? 'text-china-red' : 'text-china-ink'}`}>
                            {gameState.turn === Color.RED ? 'BẠN (ĐỎ)' : 'AI (ĐEN)'}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Add Settings/Sound toggles here if needed */}
                    <div className="px-3 py-1 bg-china-wood-dark/50 rounded text-xs font-mono text-china-gold border border-china-wood-light/30">
                        {aiEnabled ? `AI: ${difficulty.toUpperCase()}` : 'PvP'}
                    </div>
                </div>
            </div>

            {/* Main Game Area: Board */}
            <div className="flex-1 w-full flex items-center justify-center relative my-2">
                 <div className="relative w-full aspect-[9/10] max-h-[85vh] shadow-2xl rounded bg-[#dda15e]">
                    <Board />
                    
                    {/* Pieces Layer */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <AnimatePresence>
                        {gameState.board.map((row, r) => 
                            row.map((piece, c) => 
                                piece ? (
                                    <PieceComponent 
                                        key={`${piece.id}-${piece.position.r}-${piece.position.c}`} 
                                        piece={piece} 
                                        position={{ r, c }} 
                                        isSelected={gameState.selectedPos?.r === r && gameState.selectedPos?.c === c}
                                        isValidMove={false} // Handled by dots
                                        onClick={() => handleSquareClick(r, c)}
                                        lastMove={gameState.lastMove}
                                    />
                                ) : null
                            )
                        )}
                        </AnimatePresence>

                        {/* Valid Move Indicators */}
                        {gameState.validMoves.map((pos) => (
                             <div 
                                key={`valid-${pos.r}-${pos.c}`}
                                className="absolute w-[3%] h-[3%] bg-green-500/50 rounded-full cursor-pointer z-50 animate-pulse pointer-events-auto"
                                style={{ 
                                    left: `${(pos.c / 8) * 100}%`, 
                                    top: `${(pos.r / 9) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    touchAction: 'none'
                                }}
                                onClick={() => handleSquareClick(pos.r, pos.c)}
                             />
                        ))}
                        
                         {/* Selection Highlight (Extra) */}
                         {gameState.selectedPos && (
                            <div 
                                className="absolute w-[11%] h-[11%] border-2 border-green-500 rounded-full z-40 pointer-events-none"
                                style={{ 
                                    left: `${(gameState.selectedPos.c / 8) * 100}%`, 
                                    top: `${(gameState.selectedPos.r / 9) * 100}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        )}
                    </div>
                 </div>
            </div>

            {/* Footer: Status / Captured? */}
            <div className="w-full bg-china-paper/90 text-china-ink p-3 rounded-t-xl shadow-[0_-4px_6px_rgba(0,0,0,0.1)] border-t-2 border-china-wood-dark flex justify-between items-center z-20">
                 <div className="flex flex-col">
                    <div className="text-xs font-bold text-china-wood-dark uppercase">Trạng thái</div>
                    <div className="text-sm font-serif font-bold">
                        {gameState.isCheck ? "⚠️ Đang bị chiếu!" : "Bình thường"}
                    </div>
                 </div>
                 <button 
                    onClick={finalizeTournamentMatch} // If in match
                    className="px-4 py-2 bg-china-red text-white font-bold rounded shadow active:scale-95 transition-transform"
                 >
                    {tournamentState ? "Kết Thúc" : "Thoát"}
                 </button>
            </div>
        </div>
      )}
      
      {/* VICTORY MODAL */}
      <AnimatePresence>
        {(gameState.winner || gameState.isDraw) && (
             <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
             >
                  <motion.div 
                    initial={{ scale: 0.8, y: 50, rotateX: 20 }}
                    animate={{ scale: 1, y: 0, rotateX: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-china-paper border-4 border-china-wood-dark p-6 md:p-8 rounded shadow-2xl text-center relative overflow-hidden w-full max-w-sm"
                >
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
                      
                      <h2 
                        className={`text-4xl md:text-5xl font-serif font-black mb-4 relative z-10 drop-shadow-md ${gameState.winner === Color.RED ? 'text-china-red' : 'text-china-ink'}`}
                      >
                          {gameState.isDraw ? t('game.draw') : (gameState.winner === Color.RED ? t('game.victory') : t('game.defeat'))}
                      </h2>
                      
                      <div className="flex flex-col gap-3 relative z-10 mt-6">
                          {tournamentState ? (
                              <>
                                <button onClick={startNextGameInMatch} className="bg-china-red text-china-paper font-bold py-3 px-6 rounded shadow hover:bg-red-800 transition-colors border border-china-wood-dark uppercase">
                                    {t('game.next_battle')}
                                </button>
                                <button onClick={finalizeTournamentMatch} className="bg-china-wood-light text-china-wood-dark font-bold py-3 px-6 rounded shadow hover:bg-china-wood transition-colors border border-china-wood-dark uppercase">
                                    {t('game.finish_war')}
                                </button>
                              </>
                          ) : (
                              <button onClick={() => resetGame()} className="bg-china-red text-white font-bold py-3 px-8 rounded shadow-lg hover:bg-red-800 transition-transform hover:scale-105 border-2 border-china-wood-dark uppercase">
                                  {t('game.rematch')}
                              </button>
                          )}
                      </div>
                  </motion.div>
             </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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