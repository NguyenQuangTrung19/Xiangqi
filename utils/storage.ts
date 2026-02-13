import { TournamentState } from '../types';

const STORAGE_KEY = 'xiangqi_tournament_data';

export const saveTournament = (state: TournamentState) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error("Failed to save tournament:", error);
  }
};

export const loadTournament = (): TournamentState | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as TournamentState;
  } catch (error) {
    console.error("Failed to load tournament:", error);
    return null;
  }
};

export const clearTournament = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear tournament:", error);
    }
};

export const hasSavedTournament = (): boolean => {
    return !!localStorage.getItem(STORAGE_KEY);
};
