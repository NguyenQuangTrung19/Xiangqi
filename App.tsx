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
      // CLEAR TOURNAMENT STATE FOR QUICK MATCH
      setTournamentState(null);
      setCurrentMatchId(null);
      resetGame();
      setAppMode(AppMode.GAME);
    } else if (mode === 'resume') {
        const saved = loadTournament();
        if (saved) {
            setTournamentState(saved);
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

  const handleEndTournament = () => {
      if (window.confirm(t('game.finish_war') + "? " + t('game.confirm_exit'))) {
          clearTournament();
          setTournamentState(null);
          setCurrentMatchId(null);
          setAppMode(AppMode.MENU);
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
           hasSavedGame={!!loadTournament()} // Check storage directly for button state
         />
      )}

      {/* DASHBOARD MODE */}
      {appMode === AppMode.TOURNAMENT_DASHBOARD && tournamentState && (
         <TournamentDashboard 
            state={tournamentState} 
            onPlayNext={handleStartTournamentMatch}
            onBack={() => { playSound('click'); setAppMode(AppMode.MENU); }}
            onEndTournament={handleEndTournament} // Pass the new handler
         />
      )}

      {/* GAME UI */}
      {appMode === AppMode.GAME && (
        <div className="relative z-10 w-full h-[100dvh] flex flex-col lg:flex-row lg:h-auto lg:max-w-7xl lg:mx-auto items-center lg:items-start justify-center gap-0 lg:gap-6 p-0 lg:p-4 overflow-hidden">
            
            {/* MOBILE HEADER (Minimal) */}
            <div className="lg:hidden w-full flex justify-between items-center px-4 py-2 bg-[#1e1410]/90 backdrop-blur border-b border-[#3e2723] z-20 shrink-0">
                 <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${gameState.turn === Color.RED ? 'border-china-red text-china-red' : 'border-black text-white bg-black'}`}>
                        {gameState.turn === Color.RED ? '帥' : '將'}
                    </div>
                    <span className="text-xs font-bold text-[#8c7a6b] uppercase">{gameState.turn === Color.RED ? 'Lượt Bạn' : 'Lượt AI'}</span>
                 </div>
                 <div className="text-xs font-mono text-china-gold opacity-70">
                    {aiEnabled ? `AI: ${difficulty.toUpperCase()}` : 'PvP'}
                 </div>
            </div>

            {/* LEFT PANEL (Desktop Only) */}
            <div className="hidden lg:flex w-80 flex-col gap-4 order-2 lg:order-1">
                {/* Current Turn Card */}
                <div className="bg-[#1e1410]/90 backdrop-blur-md border border-[#3e2723] p-5 rounded-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d6b566] to-transparent opacity-50"></div>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[#8c7a6b] text-xs font-bold uppercase tracking-widest">{t('game.turn')}</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${gameState.turn === Color.RED ? 'bg-china-red text-white' : 'bg-black text-white'}`}>
                            {gameState.turn === Color.RED ? t('color.red') : t('color.black')}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-serif font-bold shadow-inner ${gameState.turn === Color.RED ? 'border-china-red text-china-red bg-china-red/10' : 'border-black text-black bg-black/10'}`}>
                            {gameState.turn === Color.RED ? '帥' : '將'}
                        </div>
                        <div>
                            <div className={`text-xl font-serif font-bold ${gameState.turn === Color.RED ? 'text-china-red' : 'text-china-paper'}`}>
                                {gameState.turn === Color.RED ? 'BẠN' : (opponentName || 'ĐỐI THỦ')}
                            </div>
                            <div className="text-xs text-[#8c7a6b]">
                                {gameState.turn === Color.RED ? 'Đang suy nghĩ...' : 'Đang tính toán...'}
                            </div>
                        </div>
                    </div>
                </div>
                 {/* Match Score (Desktop) */}
                {tournamentState && (
                    <div className="bg-[#1e1410]/80 border border-[#3e2723]/50 p-4 rounded-xl shadow-inner flex flex-col items-center">
                        <div className="text-[#8c7a6b] text-[10px] uppercase tracking-widest mb-1">{t('match.war_score')}</div>
                        <div className="flex items-center gap-6 text-3xl font-serif font-bold text-china-gold">
                            <span className={matchInternalScore.scoreA > matchInternalScore.scoreB ? 'text-china-red drop-shadow-md' : 'opacity-70'}>{matchInternalScore.scoreA}</span>
                            <span className="text-[#5d4037] text-xl">-</span>
                            <span className={matchInternalScore.scoreB > matchInternalScore.scoreA ? 'text-china-paper drop-shadow-md' : 'opacity-70'}>{matchInternalScore.scoreB}</span>
                        </div>
                         <div className="text-[10px] text-[#5d4037] mt-1 italic">Ván {matchInternalScore.gamesPlayed + 1} / 3</div>
                    </div>
                )}
            </div>

            {/* CENTER PANEL: BOARD */}
            {/* Mobile: Flex-1 to fill space, minimal padding */}
            <div className="order-1 lg:order-2 flex-1 w-full flex items-center justify-center relative bg-[#2c241b] lg:bg-transparent lg:max-w-[700px]">
                 <div className="relative w-full aspect-[9/10] max-h-[85vh] lg:max-h-[85vh] shadow-2xl rounded bg-[#dda15e] overflow-hidden border-[2px] lg:border-[8px] border-[#3e2723]">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay"></div>
                    <Board />
                    
                    {/* Pieces Layer */}
                    <div className="absolute inset-0 z-10">
                        <AnimatePresence>
                        {gameState.board.map((row, r) => 
                            row.map((piece, c) => {
                                if (!piece) return null;
                                const left = ((c + 0.5) / 9) * 100 + '%';
                                const top = ((r + 0.5) / 10) * 100 + '%';
                                return (
                                    <PieceComponent 
                                        key={`${piece.id}-${piece.position.r}-${piece.position.c}`} 
                                        piece={piece} 
                                        isSelected={gameState.selectedPos?.r === r && gameState.selectedPos?.c === c}
                                        isInCheck={piece.type === PieceType.GENERAL && piece.color === gameState.turn && gameState.isCheck}
                                        onClick={() => handleSquareClick(r, c)}
                                        style={{ left, top, width: '11.11%', height: '10%' }}
                                    />
                                );
                            })
                        )}
                        </AnimatePresence>
                        {/* Highlights & Move Dots */}
                        {gameState.validMoves.map((pos) => (
                             <div 
                                key={`valid-${pos.r}-${pos.c}`}
                                className="absolute w-[22%] h-[22%] max-w-[24px] max-h-[24px] bg-[#10b981] rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-50 hover:scale-125 transition-transform shadow-[0_0_15px_#10b981] opacity-60 pointer-events-auto"
                                style={{ left: `${((pos.c + 0.5) / 9) * 100}%`, top: `${((pos.r + 0.5) / 10) * 100}%` }}
                                onClick={() => handleSquareClick(pos.r, pos.c)}
                             />
                        ))}
                         {gameState.selectedPos && (
                            <div 
                                className="absolute w-[11.11%] h-[10%] border-[3px] border-[#10b981] rounded-full z-40 pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                style={{ left: `${((gameState.selectedPos.c + 0.5) / 9) * 100}%`, top: `${((gameState.selectedPos.r + 0.5) / 10) * 100}%`, transform: 'translate(-50%, -50%)' }}
                            />
                        )}
                    </div>
                 </div>

                 {/* Check Warning Overlay (Subtle) */}
                 <AnimatePresence>
                    {gameState.isCheck && !gameState.winner && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-china-red text-white px-6 py-2 rounded-full font-bold shadow-lg border border-china-gold animate-pulse whitespace-nowrap z-50"
                        >
                            ⚠️ CHIẾU TƯỚNG!
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>

            {/* MOBILE CONTROLS (Sticky Bottom) */}
            <div className="lg:hidden w-full h-16 bg-[#1e1410] border-t border-[#3e2723] flex items-center justify-around px-4 z-30 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                 <button 
                    onClick={() => {
                         if (tournamentState) setAppMode(AppMode.TOURNAMENT_DASHBOARD);
                         else setAppMode(AppMode.MENU);
                    }}
                    className="flex flex-col items-center justify-center text-[#8c7a6b] active:text-china-gold"
                 >
                    <User size={24} />
                    <span className="text-[10px] uppercase font-bold mt-1">Exit</span>
                 </button>

                 <button 
                    onClick={() => {
                        if (window.confirm("Chơi lại?")) resetGame();
                    }}
                    className="flex flex-col items-center justify-center text-[#8c7a6b] active:text-china-gold"
                 >
                    <RefreshCw size={24} />
                    <span className="text-[10px] uppercase font-bold mt-1">Restart</span>
                 </button>

                 <button 
                    onClick={() => {
                        if (window.confirm("Bỏ cuộc?")) {
                            setGameState(prev => ({ ...prev, winner: Color.BLACK }));
                            playSound('lose');
                        }
                    }}
                    className="flex flex-col items-center justify-center text-[#8c7a6b] active:text-china-red"
                 >
                    <Flag size={24} />
                    <span className="text-[10px] uppercase font-bold mt-1">Resign</span>
                 </button>
            </div>

            {/* RIGHT PANEL (Desktop Controls) */}
            <div className="hidden lg:flex w-72 flex-col gap-4 order-3 overflow-y-auto max-h-[30vh] lg:max-h-none">
                 <div className="bg-[#1e1410]/90 backdrop-blur-md border border-[#3e2723] p-5 rounded-xl shadow-2xl">
                    <div className="text-[#8c7a6b] text-xs font-bold uppercase tracking-widest mb-4 border-b border-[#3e2723] pb-2">Điều Khiển</div>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => {
                                if (window.confirm("Bạn có chắc chắn muốn bỏ cuộc?")) {
                                    setGameState(prev => ({ ...prev, winner: Color.BLACK })); // Opponent wins
                                    playSound('lose');
                                }
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#2c1e18] hover:bg-[#3e2723] text-china-red/90 border border-china-red/20 transition-all active:scale-95 group"
                        >
                            <span className="font-bold text-sm">Bỏ Cuộc</span>
                            <Flag size={18} className="opacity-50 group-hover:opacity-100" />
                        </button>
                         <button 
                            onClick={() => {
                                if (window.confirm("Chơi lại ván mới?")) resetGame();
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#2c1e18] hover:bg-[#3e2723] text-china-gold border border-china-gold/20 transition-all active:scale-95 group"
                        >
                            <span className="font-bold text-sm">Chơi Lại</span>
                            <RefreshCw size={18} className="opacity-50 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                        <button 
                             onClick={() => {
                                 if (tournamentState) setAppMode(AppMode.TOURNAMENT_DASHBOARD);
                                 else setAppMode(AppMode.MENU);
                             }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#2c1e18] hover:bg-[#3e2723] text-[#8c7a6b] hover:text-china-paper border border-[#3e2723] transition-all active:scale-95 group"
                        >
                            <span className="font-bold text-sm">{tournamentState ? 'Về Giải Đấu' : 'Thoát Menu'}</span>
                            <User size={18} className="opacity-50 group-hover:opacity-100" />
                        </button>
                    </div>
                 </div>

                 {/* Settings / Sound (Mini) */}
                 <div className="flex gap-2">
                    <button className="flex-1 bg-[#1e1410] hover:bg-[#2c1e18] p-3 rounded-lg border border-[#3e2723] text-[#8c7a6b] flex justify-center"><Settings size={20} /></button>
                    <button className="flex-1 bg-[#1e1410] hover:bg-[#2c1e18] p-3 rounded-lg border border-[#3e2723] text-[#8c7a6b] flex justify-center"><Volume2 size={20} /></button>
                 </div>
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