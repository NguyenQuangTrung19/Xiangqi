import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Shield, Users, Globe, ChevronRight, BarChart3, X, Scroll } from 'lucide-react';
import { TournamentState, Team, Match, TournamentType, Difficulty } from '../types';
import { t } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface MenuProps {
  onSelectMode: (mode: 'quick' | 'league' | 'cup' | 'resume') => void;
  currentDifficulty: Difficulty;
  onSetDifficulty: (d: Difficulty) => void;
  hasSavedGame?: boolean;
}

export const MainMenu: React.FC<MenuProps> = ({ onSelectMode, currentDifficulty, onSetDifficulty, hasSavedGame }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-6 items-center w-full max-w-lg z-20 relative"
    >
      <div className="text-center relative mb-4">
        <h1 className="text-5xl md:text-7xl font-serif font-black text-china-red tracking-widest drop-shadow-md whitespace-nowrap" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
          {t('app.title')}
        </h1>
        <div className="absolute -bottom-2 w-full h-1 bg-china-gold mx-auto rounded-full"></div>
        <h2 className="text-2xl font-serif text-china-wood-light tracking-[0.5em] uppercase font-bold mt-4">
          {t('menu.subtitle')}
        </h2>
      </div>
      
      {hasSavedGame && (
          <button 
            onClick={() => onSelectMode('resume')} 
            className="w-full relative bg-china-red text-china-paper font-bold py-6 px-4 rounded shadow-lg overflow-hidden group hover:-translate-y-1 transition-all border border-china-wood-dark"
          >
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
             <div className="absolute top-0 left-0 w-full h-1 bg-china-gold opacity-50"></div>
             <div className="flex items-center justify-between px-6 relative z-10">
                 <div className="flex items-center gap-3">
                     <Scroll size={32} className="text-china-gold" />
                     <div className="text-left">
                        <div className="text-xl font-serif tracking-widest uppercase">Tiếp Tục</div>
                        <div className="text-xs text-china-paper/80 font-serif italic">Giải đấu đang diễn ra</div>
                     </div>
                 </div>
                 <ChevronRight className="text-china-gold opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" size={28} />
             </div>
          </button>
      )}

      {/* Quick Match Scroll */}
      <div className="w-full bg-china-paper border-[3px] border-china-wood-dark rounded shadow-2xl overflow-hidden hover:shadow-ink transition-all group relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-china-wood-light opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-china-wood-light opacity-50"></div>
          
          <button 
            onClick={() => onSelectMode('quick')} 
            className="w-full p-8 text-left flex items-center justify-between relative z-10"
          >
            <div>
                <div className="flex items-center gap-3 text-china-red mb-2">
                    <Swords size={28} strokeWidth={2.5} />
                    <span className="font-serif font-bold text-2xl tracking-wide uppercase">{t('menu.play_quick')}</span>
                </div>
                <div className="text-sm text-china-ink font-serif italic">{t('menu.quick_desc')}</div>
            </div>
            <ChevronRight className="text-china-gold opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" size={32} />
          </button>
          
          <div className="bg-[#e6c9a8]/30 p-4 flex items-center justify-between gap-4 border-t border-china-wood-dark/20 relative z-10">
            <span className="text-[10px] font-bold text-china-wood-dark uppercase tracking-widest">{t('menu.difficulty')}</span>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => onSetDifficulty(level)}
                  className={`
                    px-3 py-1 rounded font-bold text-xs uppercase transition-all border
                    ${currentDifficulty === level 
                      ? 'bg-china-red text-china-paper border-china-red shadow-sm' 
                      : 'bg-china-paper text-china-wood-dark border-china-wood-dark/30 hover:bg-white'}
                  `}
                >
                  {t(`menu.difficulty.${level}` as any)}
                </button>
              ))}
            </div>
          </div>
      </div>

      <div className="w-full flex items-center gap-4">
        <div className="h-px bg-china-wood-light/50 flex-1"></div>
        <div className="text-china-wood-light text-xs uppercase tracking-widest font-serif">{t('menu.play_league')} / {t('menu.play_cup')}</div>
        <div className="h-px bg-china-wood-light/50 flex-1"></div>
      </div>

      <div className="w-full grid grid-cols-2 gap-6">
        <button onClick={() => onSelectMode('league')} className="group relative bg-china-paper border-2 border-china-wood-dark hover:border-china-gold p-6 rounded shadow-paper transition-all hover:-translate-y-1">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
            <Trophy className="mb-4 text-china-gold group-hover:scale-110 transition-transform relative z-10" size={40} />
            <div className="font-serif font-bold text-lg text-china-ink relative z-10 uppercase">{t('menu.play_league')}</div>
            <div className="text-xs text-china-wood-dark font-serif mt-1 relative z-10">{t('menu.league_desc')}</div>
        </button>

        <button onClick={() => onSelectMode('cup')} className="group relative bg-china-paper border-2 border-china-wood-dark hover:border-china-red p-6 rounded shadow-paper transition-all hover:-translate-y-1">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
            <Globe className="mb-4 text-china-red group-hover:scale-110 transition-transform relative z-10" size={40} />
            <div className="font-serif font-bold text-lg text-china-ink relative z-10 uppercase">{t('menu.play_cup')}</div>
            <div className="text-xs text-china-wood-dark font-serif mt-1 relative z-10">{t('menu.cup_desc')}</div>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
       <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="relative bg-china-paper border-4 border-china-wood-dark p-10 rounded shadow-2xl text-center max-w-sm w-full overflow-hidden"
       >
          <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
          <div className="absolute top-0 left-0 w-full h-4 bg-[#8b4513]"></div>
          <div className="absolute bottom-0 left-0 w-full h-4 bg-[#8b4513]"></div>
          
          <div className="relative z-10">
            <div className="mb-6 text-7xl animate-bounce drop-shadow-md">
                {rank === 1 ? "🏆" : rank <= 3 ? "🏅" : "🎖️"}
            </div>
            
            <h2 className="text-4xl font-serif font-black mb-2 text-china-red uppercase tracking-wide">
                {rank === 1 ? t('modal.victory') : t('modal.complete')}
            </h2>
            
            <p className="text-china-ink font-serif mb-8 text-lg">
                {rank === 1 ? t('modal.champion') : `${t('modal.rank')} ${rank}`}
            </p>
            
            <button onClick={onClose} className="w-full bg-china-wood-dark text-china-paper font-bold py-3 px-6 rounded hover:bg-[#5d4037] transition-colors font-serif tracking-widest shadow-lg">
                {t('modal.continue')}
            </button>
          </div>
       </motion.div>
    </div>
  );
};

// --- BRACKET & DASHBOARD --- 

const MatchBox: React.FC<{ m: Match; getTeamName: (id: string) => string }> = ({ m, getTeamName }) => (
  <div className={`mb-2 p-3 text-xs border rounded w-full flex justify-between items-center transition-all ${m.isPlayed ? 'bg-[#e6c9a8]/50 border-china-wood-dark/30' : 'bg-china-paper/50 border-china-wood-light/20'} shadow-sm`}>
      <div className={`flex-1 truncate px-1 font-serif ${m.scoreA! > m.scoreB! ? 'text-china-red font-bold' : 'text-china-ink'}`}>{getTeamName(m.teamAId)}</div>
      <div className="flex bg-china-paper rounded px-2 py-1 mx-2 font-mono text-china-wood-dark border border-china-wood-light/30 shadow-inner">
         <span>{m.scoreA ?? '-'}</span>
         <span className="mx-1 text-slate-400">:</span>
         <span>{m.scoreB ?? '-'}</span>
      </div>
      <div className={`flex-1 truncate px-1 text-right font-serif ${m.scoreB! > m.scoreA! ? 'text-china-red font-bold' : 'text-china-ink'}`}>{getTeamName(m.teamBId)}</div>
  </div>
);

const BracketView: React.FC<{ matches: Match[], teams: Team[] }> = ({ matches, teams }) => {
    const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "TBD";
    const r16 = matches.filter(m => m.round === 2);
    const qf = matches.filter(m => m.round === 3);
    const sf = matches.filter(m => m.round === 4);
    const final = matches.filter(m => m.round === 5);

    const ColumnHeader = ({ title }: {title: string}) => (
        <h4 className="text-center font-serif font-bold mb-4 text-[10px] uppercase tracking-widest text-[#5d4037] bg-[#e6c9a8] py-2 rounded border border-[#d4a373] shadow-sm">{title}</h4>
    );

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-[800px] p-2">
                <div className="flex-1 flex flex-col justify-around gap-2">
                    <ColumnHeader title={t('match.round_16')} />
                    {r16.map(m => <MatchBox key={m.id} m={m} getTeamName={getTeamName} />)}
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                    <ColumnHeader title={t('match.quarter_finals')} />
                    {qf.map(m => <MatchBox key={m.id} m={m} getTeamName={getTeamName} />)}
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                    <ColumnHeader title={t('match.semi_finals')} />
                    {sf.map(m => <MatchBox key={m.id} m={m} getTeamName={getTeamName} />)}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-center font-serif font-bold mb-4 text-xs uppercase bg-china-red text-china-paper py-2 rounded shadow">{t('match.finals')}</h4>
                    {final.map(m => (
                        <div key={m.id} className="p-6 border-4 border-china-gold bg-china-red rounded-lg text-center shadow-lg relative overflow-hidden group">
                            <div className="font-serif font-bold text-sm mb-3 text-china-paper/80">{getTeamName(m.teamAId)}</div>
                            <div className="text-4xl font-black mb-3 text-white font-serif tracking-tight drop-shadow-md">{m.scoreA ?? 0} - {m.scoreB ?? 0}</div>
                            <div className="font-serif font-bold text-sm text-china-paper/80">{getTeamName(m.teamBId)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StandingsTable: React.FC<{ teams: Team[], compact?: boolean }> = ({ teams, compact }) => (
  <table className="w-full text-sm text-left text-china-ink">
    <thead>
      <tr className="border-b-2 border-china-wood-light text-xs uppercase text-china-wood-dark tracking-wider">
        <th className="px-4 py-3 font-serif">{t('table.rank')}</th>
        <th className="px-4 py-3 w-full font-serif">{t('table.player')}</th>
        {!compact && <th className="px-4 py-3 text-center font-serif">{t('table.matches')}</th>}
        <th className="px-4 py-3 text-right font-serif">{t('table.pts')}</th>
      </tr>
    </thead>
    <tbody>
      {teams.map((t, idx) => (
        <tr key={t.id} className={`border-b border-china-wood-light/30 last:border-0 hover:bg-[#e6c9a8]/30 transition-colors ${t.isPlayer ? 'bg-china-gold/10' : ''}`}>
          <td className="px-4 py-3 font-mono text-china-wood-dark font-bold">#{idx + 1}</td>
          <td className={`px-4 py-3 font-bold font-serif ${t.isPlayer ? 'text-china-red' : 'text-china-ink'}`}>{t.name}</td>
          {!compact && <td className="px-4 py-3 text-center font-mono text-china-wood-dark">{t.stats.played}</td>}
          <td className="px-4 py-3 text-right font-mono font-bold text-china-wood-dark">{t.stats.points}</td>
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
  
  // Rank logic (Unchanged)
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

      <div className="w-full h-[90vh] bg-[#fdf5e6] border-[4px] border-[#8b4513] rounded shadow-2xl overflow-hidden flex flex-col z-20 relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>

        {/* Header */}
        <div className="bg-[#3e2723] p-6 flex justify-between items-center border-b-4 border-[#d4a373] relative z-10 shadow-lg">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-[#5d4037] rounded border border-[#d4a373]">
                {isCup ? <Globe className="text-china-red" /> : <Shield className="text-china-gold" />}
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold text-china-paper uppercase tracking-wide">{isCup ? t('menu.play_cup') : t('menu.play_league')}</h2>
                <div className="text-xs text-china-wood-light font-serif">{t('dash.season')}</div>
             </div>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-[#5d4037] rounded-full transition-colors">
            <X size={24} className="text-china-paper" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative z-10">
            {/* Action Banner */}
            <div className="bg-china-paper border-2 border-china-wood-dark p-6 rounded shadow-paper mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
                <div className="relative z-10">
                    <h3 className="text-xs font-bold text-china-red uppercase tracking-widest mb-2 flex items-center gap-2">
                         <span className="w-2 h-2 bg-china-red rounded-full animate-pulse"></span>
                         {t('dash.next_battle')}
                    </h3>
                    {nextMatch ? (
                        <div className="font-serif text-3xl font-bold text-china-ink">
                            {getTeamName(nextMatch.teamAId)} <span className="text-china-wood-light mx-3 italic text-lg">{t('match.vs')}</span> {getTeamName(nextMatch.teamBId)}
                        </div>
                    ) : (
                        <div className="font-serif text-xl text-china-wood-dark italic">{t('dash.tournament_complete')}</div>
                    )}
                </div>
                
                {nextMatch && (
                    <button 
                        onClick={() => onPlayNext(nextMatch.id)}
                        className="bg-china-red text-china-paper font-bold py-3 px-8 rounded shadow hover:bg-[#991b1b] transition-transform hover:scale-105 font-serif tracking-wider border border-china-wood-dark relative z-10"
                    >
                        {t('dash.start_match')}
                    </button>
                )}
            </div>

            {/* Content Area */}
            {isCup && state.phase === 'KNOCKOUT' ? (
                <div className="bg-china-paper/80 p-4 rounded border border-china-wood-dark/30 shadow-inner">
                    <BracketView matches={state.matches} teams={state.teams} />
                </div>
            ) : (
                <div className="bg-china-paper border-2 border-china-wood-dark rounded overflow-hidden p-0 shadow-paper">
                    <StandingsTable teams={[...state.teams].sort((a,b) => b.stats.points - a.stats.points)} />
                </div>
            )}
        </div>
      </div>
    </>
  );
};