export type LocaleKey = 
  | 'app.title'
  | 'menu.play_quick'
  | 'menu.play_league'
  | 'menu.play_cup'
  | 'menu.difficulty'
  | 'menu.difficulty.easy'
  | 'menu.difficulty.medium'
  | 'menu.difficulty.hard'
  | 'game.turn'
  | 'game.check'
  | 'game.checkmate'
  | 'game.victory'
  | 'game.defeat'
  | 'game.draw'
  | 'game.active'
  | 'game.ai_thinking'
  | 'game.offer_peace'
  | 'game.resign'
  | 'game.rematch'
  | 'game.next_battle'
  | 'game.finish_war'
  | 'game.general_danger'
  | 'role.general'
  | 'role.advisor'
  | 'role.elephant'
  | 'role.horse'
  | 'role.chariot'
  | 'role.cannon'
  | 'role.soldier'
  | 'color.red'
  | 'color.black'
  | 'match.vs'
  | 'match.war_score'
  | 'match.battle_count'
  | 'menu.subtitle'
  | 'menu.quick_desc'
  | 'menu.league_desc'
  | 'menu.cup_desc'
  | 'match.round_16'
  | 'match.quarter_finals'
  | 'match.semi_finals'
  | 'match.finals'
  | 'table.rank'
  | 'table.player'
  | 'table.matches'
  | 'table.pts'
  | 'modal.victory'
  | 'modal.complete'
  | 'modal.champion'
  | 'modal.rank'
  | 'modal.continue'
  | 'dash.season'
  | 'dash.start_match'
  | 'dash.tournament_complete'
  | 'dash.next_battle';

const VI_LOCALE: Record<LocaleKey, string> = {
  'app.title': 'CỜ TƯỚNG ĐẠI CHIẾN',
  'menu.play_quick': 'Đấu Nhanh',
  'menu.play_league': 'Giải Vô Địch (League)',
  'menu.play_cup': 'Cúp Thế Giới (Cup)',
  'menu.difficulty': 'Độ Khó',
  'menu.difficulty.easy': 'Dễ',
  'menu.difficulty.medium': 'Trung Bình',
  'menu.difficulty.hard': 'Khó',
  
  'game.turn': 'Lượt đi',
  'game.check': 'CHIẾU TƯỚNG!',
  'game.checkmate': 'CHIẾU BÍ!',
  'game.victory': 'CHIẾN THẮNG',
  'game.defeat': 'THẤT BẠI',
  'game.draw': 'HÒA CỜ',
  'game.active': 'Đang Diễn Ra',
  'game.ai_thinking': 'AI Đang Tính...',
  'game.offer_peace': 'Xin Hòa',
  'game.resign': 'Đầu Hàng',
  'game.rematch': 'Chơi Lại',
  'game.next_battle': 'Trận Tiếp Theo',
  'game.finish_war': 'Kết Thúc Giải',
  'game.general_danger': 'TƯỚNG GẶP NGUY!',

  'role.general': 'Tướng',
  'role.advisor': 'Sĩ',
  'role.elephant': 'Tượng',
  'role.horse': 'Mã',
  'role.chariot': 'Xe',
  'role.cannon': 'Pháo',
  'role.soldier': 'Tốt',

  'color.red': 'Đỏ',
  'color.black': 'Đen',

  'match.vs': 'Đấu',
  'match.war_score': 'Tỷ Số',
  'match.battle_count': 'Ván',
  
  // Extra keys for TournamentViews
  'menu.subtitle': 'KỲ VƯƠNG',
  'menu.quick_desc': 'Thách đấu Quang Trung Đại Kiện Tướng',
  'menu.league_desc': 'Vòng Tròn Tính Điểm',
  'menu.cup_desc': 'Đấu Loại Trực Tiếp',
  'match.round_16': 'Vòng 1/8',
  'match.quarter_finals': 'Tứ Kết',
  'match.semi_finals': 'Bán Kết',
  'match.finals': 'Chung Kết',
  'table.rank': 'Hạng',
  'table.player': 'Kỳ Thủ',
  'table.matches': 'Trận',
  'table.pts': 'Điểm',
  'modal.victory': 'CHIẾN THẮNG',
  'modal.complete': 'HOÀN THÀNH',
  'modal.champion': 'THIÊN HẠ ĐỆ NHẤT',
  'modal.rank': 'HẠNG: #',
  'modal.continue': 'TIẾP TỤC',
  'dash.season': 'Mùa Giải 2026',
  'dash.start_match': 'VÀO TRẬN',
  'dash.tournament_complete': 'Giải Đấu Đã Kết Thúc',
  'dash.next_battle': 'Trận Sắp Tới',
};

export const t = (key: string): string => {
  return (VI_LOCALE as any)[key] || key;
};
