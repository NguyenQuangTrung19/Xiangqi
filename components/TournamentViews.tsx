import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Shield, Users, Globe, ChevronRight, BarChart3, X } from 'lucide-react';
import { TournamentState, Team, Match, TournamentType, Difficulty } from '../types';

interface MenuProps {
  onSelectMode: (mode: 'quick' | 'league' | 'cup') => void;
  currentDifficulty: Difficulty;
  onSetDifficulty: (d: Difficulty) => void;
}

const getDifficultyLabel = (d: Difficulty) => {
  switch(d) {
    case 'easy': return 'Tập Sự';
    case 'medium': return 'Cao Thủ';
    case 'hard': return 'Đại Kiện Tướng';
  }
};

export const MainMenu: React.FC<MenuProps> = ({ onSelectMode, currentDifficulty, onSetDifficulty }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-8 items-center w-full max-w-md z-20"
    >
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-neonBlue to-cyber-neonRed drop-shadow-lg tracking-tighter">
          XIANGQI
        </h1>
        <h2 className="text-xl font-mono text-cyber-neonBlue tracking-[0.4em] uppercase opacity-80 mt-2">
          CYBER MASTER
        </h2>
      </div>
      
      {/* Quick Match Card */}
      <div className="w-full bg-cyber-800/40 backdrop-blur-xl border border-cyber-700/50 rounded-2xl overflow-hidden hover:border-cyber-neonRed/50 transition-colors group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-neonRed/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <button 
            onClick={() => onSelectMode('quick')} 
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
                <div className="flex items-center gap-2 text-cyber-neonRed mb-1">
                    <Swords size={20} />
                    <span className="font-display font-bold text-lg">QUICK MATCH</span>
                </div>
                <div className="text-sm text-slate-400 font-mono">Vs Gemini AI Engine</div>
            </div>
            <ChevronRight className="text-cyber-neonRed opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
          </button>
          
          <div className="bg-cyber-950/50 p-4 flex items-center justify-between gap-4 border-t border-cyber-700/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DIFFICULTY</span>
            <div className="flex gap-2 bg-cyber-900 rounded-lg p-1">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => onSetDifficulty(level)}
                  className={`
                    px-3 py-1 rounded-md font-bold text-[10px] uppercase transition-all
                    ${currentDifficulty === level 
                      ? 'bg-cyber-700 text-cyber-neonBlue shadow-neon-blue' 
                      : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  {getDifficultyLabel(level)}
                </button>
              ))}
            </div>
          </div>
      </div>

      <div className="w-full flex items-center gap-4">
        <div className="h-px bg-cyber-700 flex-1"></div>
        <div className="text-slate-500 text-[10px] uppercase tracking-widest font-mono">Tournament Modes</div>
        <div className="h-px bg-cyber-700 flex-1"></div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4">
        <button onClick={() => onSelectMode('league')} className="group relative bg-cyber-800/40 border border-cyber-700/50 hover:border-cyber-neonGold/50 p-5 rounded-2xl transition-all hover:-translate-y-1">
            <Trophy className="mb-3 text-cyber-neonGold group-hover:scale-110 transition-transform" size={32} />
            <div className="font-display font-bold text-slate-100">League</div>
            <div className="text-xs text-slate-500 font-mono mt-1">Round Robin</div>
        </button>

        <button onClick={() => onSelectMode('cup')} className="group relative bg-cyber-800/40 border border-cyber-700/50 hover:border-cyber-neonBlue/50 p-5 rounded-2xl transition-all hover:-translate-y-1">
            <Globe className="mb-3 text-cyber-neonBlue group-hover:scale-110 transition-transform" size={32} />
            <div className="font-display font-bold text-slate-100">World Cup</div>
            <div className="text-xs text-slate-500 font-mono mt-1">Knockout</div>
        </button>
      </div>
    </motion.div>
  );
};

interface CelebrationProps {
  rank: number;
  onClose: () => void;
}

const CelebrationModal: React.FC<CelebrationProps> = ({ rank, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cyber-950/90 backdrop-blur-xl p-4">
       <motion.div 
         initial={{ scale: 0.5, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="relative bg-cyber-900 border border-cyber-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full overflow-hidden"
       >
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-neonBlue/10 to-cyber-neonRed/10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-4 text-7xl animate-bounce">
                {rank === 1 ? "🏆" : rank <= 3 ? "🏅" : "🎖️"}
            </div>
            
            <h2 className="text-4xl font-display font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyber-neonBlue to-cyber-neonRed uppercase italic">
                {rank === 1 ? "VICTORY" : "COMPLETE"}
            </h2>
            
            <p className="text-slate-400 font-mono mb-8">
                {rank === 1 ? "CHAMPION OF THE ARENA" : `RANKING: #${rank}`}
            </p>
            
            <button onClick={onClose} className="w-full bg-slate-100 text-cyber-950 font-bold py-3 px-6 rounded-xl hover:bg-white transition-colors font-display tracking-widest">
                CONTINUE
            </button>
          </div>
       </motion.div>
    </div>
  );
};

// --- BRACKET & DASHBOARD --- 

const MatchBox: React.FC<{ m: Match; getTeamName: (id: string) => string }> = ({ m, getTeamName }) => (
  <div className={`mb-2 p-2 text-xs border rounded-lg w-full flex justify-between items-center transition-all ${m.isPlayed ? 'bg-cyber-800 border-cyber-600' : 'bg-cyber-900/50 border-cyber-800'} shadow-lg`}>
      <div className={`flex-1 truncate px-1 font-mono ${m.scoreA! > m.scoreB! ? 'text-cyber-neonBlue font-bold' : 'text-slate-500'}`}>{getTeamName(m.teamAId)}</div>
      <div className="flex bg-cyber-950 rounded px-2 py-1 mx-2 font-mono text-slate-300 border border-cyber-800">
         <span>{m.scoreA ?? '-'}</span>
         <span className="mx-1 text-slate-600">:</span>
         <span>{m.scoreB ?? '-'}</span>
      </div>
      <div className={`flex-1 truncate px-1 text-right font-mono ${m.scoreB! > m.scoreA! ? 'text-cyber-neonBlue font-bold' : 'text-slate-500'}`}>{getTeamName(m.teamBId)}</div>
  </div>
);

const BracketView: React.FC<{ matches: Match[], teams: Team[] }> = ({ matches, teams }) => {
    const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "TBD";
    const r16 = matches.filter(m => m.round === 2);
    const qf = matches.filter(m => m.round === 3);
    const sf = matches.filter(m => m.round === 4);
    const final = matches.filter(m => m.round === 5);

    const ColumnHeader = ({ title }: {title: string}) => (
        <h4 className="text-center font-display font-bold mb-4 text-[10px] uppercase tracking-widest text-cyber-neonBlue bg-cyber-900/80 py-2 rounded border border-cyber-800">{title}</h4>
    );

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-[800px] p-2">
                <div className="flex-1 flex flex-col justify-around gap-2">
                    <ColumnHeader title="Round of 16" />
                    {r16.map(m => <MatchBox key={m.id} m={m} getTeamName={getTeamName} />)}
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                    <ColumnHeader title="Quarter Finals" />
                    {qf.map(m => <MatchBox key={m.id} m={m} getTeamName={getTeamName} />)}
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                    <ColumnHeader title="Semi Finals" />
                    {sf.map(m => <MatchBox key={m.id} m={m} getTeamName={getTeamName} />)}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-center font-display font-bold mb-4 text-xs uppercase bg-cyber-neonRed text-cyber-950 py-2 rounded shadow-neon-red">Finals</h4>
                    {final.map(m => (
                        <div key={m.id} className="p-6 border border-cyber-neonRed bg-cyber-900/80 rounded-xl text-center shadow-neon-red relative overflow-hidden group">
                            <div className="font-display font-bold text-sm mb-3 text-slate-300">{getTeamName(m.teamAId)}</div>
                            <div className="text-4xl font-black mb-3 text-white font-mono tracking-tighter">{m.scoreA ?? 0} - {m.scoreB ?? 0}</div>
                            <div className="font-display font-bold text-sm text-slate-300">{getTeamName(m.teamBId)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StandingsTable: React.FC<{ teams: Team[], compact?: boolean }> = ({ teams, compact }) => (
  <table className="w-full text-sm text-left text-slate-300">
    <thead>
      <tr className="border-b border-cyber-700 text-xs uppercase text-slate-500 tracking-wider">
        <th className="px-4 py-3 font-mono">Rank</th>
        <th className="px-4 py-3 w-full">Player</th>
        {!compact && <th className="px-4 py-3 text-center">Matches</th>}
        <th className="px-4 py-3 text-right">PTS</th>
      </tr>
    </thead>
    <tbody>
      {teams.map((t, idx) => (
        <tr key={t.id} className={`border-b border-cyber-800 last:border-0 hover:bg-cyber-800/30 transition-colors ${t.isPlayer ? 'bg-cyber-neonBlue/5' : ''}`}>
          <td className="px-4 py-3 font-mono text-slate-500">#{idx + 1}</td>
          <td className={`px-4 py-3 font-medium ${t.isPlayer ? 'text-cyber-neonBlue' : 'text-slate-200'}`}>{t.name}</td>
          {!compact && <td className="px-4 py-3 text-center font-mono text-slate-500">{t.stats.played}</td>}
          <td className="px-4 py-3 text-right font-mono font-bold text-white">{t.stats.points}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

interface DashboardProps {
  state: TournamentState;
  onPlayNext: (matchId: string) => void;
  onBack: () => void;
}

export const TournamentDashboard: React.FC<DashboardProps> = ({ state, onPlayNext, onBack }) => {
  const getTeamName = (id: string) => state.teams.find(t => t.id === id)?.name || id;
  const [showCelebration, setShowCelebration] = useState(true);
  
  const nextMatch = state.matches.find(m => !m.isPlayed && (m.teamAId === 'player' || m.teamBId === 'player'));
  const isCup = state.type === TournamentType.CUP;
  
  // Rank logic
  const playerRank = state.teams.findIndex(t => t.id === 'player') + 1;
  let displayRank = playerRank;
  if (state.type === TournamentType.CUP && state.phase === 'KNOCKOUT') {
     const playerMatches = state.matches.filter(m => (m.teamAId === 'player' || m.teamBId === 'player') && m.isPlayed);
     const lastMatch = playerMatches[playerMatches.length -1];
     if (lastMatch) {
         const playerWon = (lastMatch.teamAId === 'player' && lastMatch.scoreA! > lastMatch.scoreB!) || 
                           (lastMatch.teamBId === 'player' && lastMatch.scoreB! > lastMatch.scoreA!);
         if (!playerWon) {
             if (lastMatch.round === 2) displayRank = 9;
             if (lastMatch.round === 3) displayRank = 5;
             if (lastMatch.round === 4) displayRank = 3;
             if (lastMatch.round === 5) displayRank = 2;
         } else if (lastMatch.round === 5 && playerWon) {
             displayRank = 1;
         }
     }
  }

  return (
    <>
      {state.isFinished && showCelebration && (
        <CelebrationModal rank={displayRank} onClose={() => setShowCelebration(false)} />
      )}

      <div className="w-full h-[90vh] bg-cyber-900/90 backdrop-blur-xl border border-cyber-700 rounded-3xl overflow-hidden flex flex-col shadow-2xl z-20">
        {/* Header */}
        <div className="bg-cyber-950 p-6 flex justify-between items-center border-b border-cyber-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyber-800 rounded-lg">
                {isCup ? <Globe className="text-cyber-neonBlue" /> : <Shield className="text-cyber-neonGold" />}
             </div>
             <div>
                <h2 className="text-xl font-display font-bold text-white uppercase">{isCup ? "World Cup" : "Pro League"}</h2>
                <div className="text-xs text-slate-500 font-mono">Season 2024</div>
             </div>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-cyber-800 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-tech-grid">
            {/* Action Banner */}
            <div className="bg-gradient-to-r from-cyber-800 to-cyber-900 rounded-2xl p-1 mb-8 shadow-lg border border-cyber-700/50">
                <div className="bg-cyber-950/80 backdrop-blur rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xs font-bold text-cyber-neonBlue uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span className="w-2 h-2 bg-cyber-neonBlue rounded-full animate-pulse"></span>
                             Next Match
                        </h3>
                        {nextMatch ? (
                            <div className="font-display text-2xl font-bold text-white">
                                {getTeamName(nextMatch.teamAId)} <span className="text-slate-600 mx-2">VS</span> {getTeamName(nextMatch.teamBId)}
                            </div>
                        ) : (
                            <div className="font-display text-xl text-slate-400">Tournament Completed</div>
                        )}
                    </div>
                    
                    {nextMatch && (
                        <button 
                            onClick={() => onPlayNext(nextMatch.id)}
                            className="bg-cyber-neonBlue text-cyber-950 font-bold py-3 px-8 rounded-xl shadow-neon-blue hover:scale-105 transition-transform font-display tracking-wider"
                        >
                            START GAME
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isCup && state.phase === 'KNOCKOUT' ? (
                <BracketView matches={state.matches} teams={state.teams} />
            ) : (
                <div className="bg-cyber-950/50 border border-cyber-800 rounded-2xl overflow-hidden p-4">
                    <StandingsTable teams={[...state.teams].sort((a,b) => b.stats.points - a.stats.points)} />
                </div>
            )}
        </div>
      </div>
    </>
  );
};