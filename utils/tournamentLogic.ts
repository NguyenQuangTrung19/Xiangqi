import { Team, Match, TournamentType, TournamentState } from '../types';

// Constants
export const WIN_POINTS = 3;
export const DRAW_POINTS = 1;
export const LOSS_POINTS = 0;

// Expanded Mock Team Names (Sino-Vietnamese names for theme)
const AI_NAMES = [
  "Ngọa Long", "Mãnh Hổ", "Phượng Hoàng", "Bạch Liên",
  "Ngọc Hoàng", "Thiết Pháo", "Phong Thần", "Giang Thần",
  "Kim Mã", "Ám Tốt", "Hồng Bá", "Thần Tượng",
  "Ngân Xa", "Lôi Thủ", "Vô Danh Tăng", "Thanh Long",
  "Đoản Kiếm", "Túy Quyền", "Bắc Lang", "Nam Hạc",
  "Thiên Vệ", "Cấm Vệ Quân", "Hô Phong", "Hỏa Tâm",
  "Hư Không", "Trúc Tiên", "Huyết Triều", "Đỉnh Sơn",
  "Hàn Băng", "Ám Quyền", "Thần Phong", "Bàn Thạch"
];

export const createTeams = (count: number): Team[] => {
  const teams: Team[] = [];
  // User Team
  teams.push({
    id: 'player',
    name: 'Bạn (Người chơi)',
    isPlayer: true,
    stats: { played: 0, won: 0, drawn: 0, lost: 0, points: 0 },
    strength: 10 // Player logic is handled by user, strength mainly for simulation if needed
  });

  // AI Teams
  for (let i = 0; i < count - 1; i++) {
    // Generate varied strengths (1 to 10) to create Easy/Medium/Hard opponents
    // Distribution: Some weak, mostly average, some strong
    const rand = Math.random();
    let strength = 5;
    if (rand < 0.2) strength = Math.floor(Math.random() * 4) + 1; // 1-4 (Weak/Easy)
    else if (rand < 0.7) strength = Math.floor(Math.random() * 3) + 5; // 5-7 (Avg/Medium)
    else strength = Math.floor(Math.random() * 3) + 8; // 8-10 (Strong/Hard)

    teams.push({
      id: `ai_${i}`,
      name: AI_NAMES[i % AI_NAMES.length],
      isPlayer: false,
      stats: { played: 0, won: 0, drawn: 0, lost: 0, points: 0 },
      strength: strength
    });
  }
  return teams;
};

// --- LEAGUE LOGIC ---

export const generateLeagueSchedule = (teams: Team[]): Match[] => {
  const matches: Match[] = [];
  const n = teams.length;
  // Simple Round Robin algorithm
  const numRounds = n - 1;
  const half = n / 2;
  
  const teamIds = teams.map(t => t.id);

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const t1 = teamIds[i];
      const t2 = teamIds[n - 1 - i];
      
      matches.push({
        id: `rnd${round}_${t1}_vs_${t2}`,
        round: round + 1,
        teamAId: t1,
        teamBId: t2,
        scoreA: null,
        scoreB: null,
        isPlayed: false,
        stageName: `Vòng ${round + 1}`
      });
    }
    // Rotate team array (keep first fixed)
    teamIds.splice(1, 0, teamIds.pop()!);
  }
  
  // Sort matches roughly. For league, we just keep round order.
  return matches.sort((a, b) => a.round - b.round);
};

// --- CUP LOGIC ---

export const generateCupGroups = (teams: Team[]): { groups: Record<string, string[]>, matches: Match[] } => {
  // 32 teams -> 8 groups of 4 (A, B, C, D, E, F, G, H)
  const shuffled = [...teams].sort(() => 0.5 - Math.random());
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const groups: Record<string, string[]> = {};
  const matches: Match[] = [];

  groupNames.forEach((name, idx) => {
    const groupTeams = shuffled.slice(idx * 4, (idx + 1) * 4).map(t => t.id);
    groups[name] = groupTeams;

    // Create Round Robin matches for this group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          id: `grp${name}_${groupTeams[i]}_${groupTeams[j]}`,
          round: 1, // Phase 1
          teamAId: groupTeams[i],
          teamBId: groupTeams[j],
          scoreA: null,
          scoreB: null,
          isPlayed: false,
          stageName: `Bảng ${name}`
        });
      }
    }
  });

  return { groups, matches };
};

export const generateKnockoutBracket = (state: TournamentState, matches: Match[], teams: Team[]): Match[] => {
  const lastRoundMatches = matches.filter(m => m.isPlayed).sort((a, b) => b.round - a.round);
  const maxRound = lastRoundMatches.length > 0 ? lastRoundMatches[0].round : 1;

  // Helper to find winner of a match
  const getWinner = (m: Match) => (m.scoreA! > m.scoreB! ? m.teamAId : m.teamBId);

  // 1. If currently finishing Group Stage (Round 1) -> Generate Round of 16 (Round 2)
  if (state.phase === 'GROUP') {
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const qualified: Record<string, {first: string, second: string}> = {};

    // Determine qualifiers
    groupNames.forEach(grp => {
      const grpTeams = state.groups![grp].map(id => teams.find(t => t.id === id)!);
      const sorted = grpTeams.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.won - b.stats.lost) - (a.stats.won - a.stats.lost);
      });
      qualified[grp] = { first: sorted[0].id, second: sorted[1].id };
    });

    // World Cup style pairings
    const newMatches: Match[] = [
      { id: 'r16_1', round: 2, teamAId: qualified['A'].first, teamBId: qualified['B'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_2', round: 2, teamAId: qualified['C'].first, teamBId: qualified['D'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_3', round: 2, teamAId: qualified['E'].first, teamBId: qualified['F'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_4', round: 2, teamAId: qualified['G'].first, teamBId: qualified['H'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_5', round: 2, teamAId: qualified['B'].first, teamBId: qualified['A'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_6', round: 2, teamAId: qualified['D'].first, teamBId: qualified['C'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_7', round: 2, teamAId: qualified['F'].first, teamBId: qualified['E'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
      { id: 'r16_8', round: 2, teamAId: qualified['H'].first, teamBId: qualified['G'].second, scoreA: null, scoreB: null, isPlayed: false, stageName: 'Vòng 1/8' },
    ];
    return newMatches;
  }

  // 2. If finishing R16 (Round 2) -> Generate Quarter Finals (Round 3)
  if (state.phase === 'KNOCKOUT' && maxRound === 2) {
    const r16Matches = matches.filter(m => m.round === 2); // Should be 8 matches
    // Pairing for QF
    const qfMatches: Match[] = [];
    for (let i = 0; i < 8; i += 2) {
      qfMatches.push({
        id: `qf_${i/2 + 1}`,
        round: 3,
        teamAId: getWinner(r16Matches[i]),
        teamBId: getWinner(r16Matches[i+1]),
        scoreA: null, scoreB: null, isPlayed: false, stageName: 'Tứ Kết'
      });
    }
    return qfMatches;
  }

  // 3. If finishing QF (Round 3) -> Generate Semi Finals (Round 4)
  if (state.phase === 'KNOCKOUT' && maxRound === 3) {
    const qfMatches = matches.filter(m => m.round === 3); // Should be 4 matches
    const sfMatches: Match[] = [];
    for (let i = 0; i < 4; i += 2) {
      sfMatches.push({
        id: `sf_${i/2 + 1}`,
        round: 4,
        teamAId: getWinner(qfMatches[i]),
        teamBId: getWinner(qfMatches[i+1]),
        scoreA: null, scoreB: null, isPlayed: false, stageName: 'Bán Kết'
      });
    }
    return sfMatches;
  }

  // 4. If finishing SF (Round 4) -> Generate Final (Round 5)
  if (state.phase === 'KNOCKOUT' && maxRound === 4) {
    const sfMatches = matches.filter(m => m.round === 4); // Should be 2 matches
    return [{
      id: 'final',
      round: 5,
      teamAId: getWinner(sfMatches[0]),
      teamBId: getWinner(sfMatches[1]),
      scoreA: null, scoreB: null, isPlayed: false, stageName: 'Chung Kết'
    }];
  }

  return [];
};

// --- SIMULATION ---

export const simulateMatch = (match: Match, teams: Team[]): Match => {
  const teamA = teams.find(t => t.id === match.teamAId)!;
  const teamB = teams.find(t => t.id === match.teamBId)!;

  const diff = teamA.strength - teamB.strength;
  
  let winsA = 0;
  let winsB = 0;
  
  // Simulate Best of 3 Games
  for (let game = 0; game < 3; game++) {
    if (winsA === 2 || winsB === 2) break;
    const roll = Math.random() * 100 + (diff * 5); 
    if (roll > 60) winsA++;
    else if (roll < 40) winsB++;
  }

  // Force winner in Knockout
  if (match.round >= 2 && winsA === winsB) {
      if (Math.random() > 0.5) winsA++; else winsB++;
  }

  return {
    ...match,
    scoreA: winsA,
    scoreB: winsB,
    isPlayed: true
  };
};

export const updateStandings = (teams: Team[], matches: Match[]): Team[] => {
  // Reset stats
  const newTeams = teams.map(t => ({
    ...t,
    stats: { played: 0, won: 0, drawn: 0, lost: 0, points: 0 }
  }));

  matches.forEach(m => {
    if (m.isPlayed && m.scoreA !== null && m.scoreB !== null) {
      const tA = newTeams.find(t => t.id === m.teamAId);
      const tB = newTeams.find(t => t.id === m.teamBId);
      
      if (tA && tB) {
        // Only count Group stage matches for standing points
        if (m.stageName?.includes("Bảng")) {
            tA.stats.played++;
            tB.stats.played++;

            const winsA = m.scoreA;
            const winsB = m.scoreB;

            if (winsA >= 2) {
              tA.stats.won++;
              tA.stats.points += WIN_POINTS;
              tB.stats.lost++;
            } else if (winsB >= 2) {
              tB.stats.won++;
              tB.stats.points += WIN_POINTS;
              tA.stats.lost++;
            } else {
              tA.stats.drawn++;
              tA.stats.points += DRAW_POINTS;
              tB.stats.drawn++;
              tB.stats.points += DRAW_POINTS;
            }
        }
      }
    }
  });

  return newTeams.sort((a, b) => b.stats.points - a.stats.points);
};