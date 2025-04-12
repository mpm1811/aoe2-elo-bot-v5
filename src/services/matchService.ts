import { matchesApi } from './apiClient';
import { Player } from './playerService';

export interface Match {
  id?: string;
  matchDate: string;
  team1Players: Player[];
  team2Players: Player[];
  team1Score?: number;
  team2Score?: number;
  status: "scheduled" | "completed" | "cancelled";
  map?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createMatch = async (match: Omit<Match, "id">): Promise<Match> => {
  try {
    return await matchesApi.createMatch(match);
  } catch (error) {
    console.error("Error creating match:", error);
    throw error;
  }
};

export const getMatches = async (): Promise<Match[]> => {
  try {
    return await matchesApi.getMatches();
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  try {
    return await matchesApi.getMatchById(id);
  } catch (error) {
    console.error(`Error fetching match with id ${id}:`, error);
    throw error;
  }
};

export const updateMatchResult = async (
  id: string,
  team1Score: number,
  team2Score: number,
): Promise<Match> => {
  try {
    return await matchesApi.updateMatchResult(id, team1Score, team2Score);
  } catch (error) {
    console.error(`Error updating match result with id ${id}:`, error);
    throw error;
  }
};

export const cancelMatch = async (id: string): Promise<void> => {
  try {
    await matchesApi.cancelMatch(id);
  } catch (error) {
    console.error(`Error cancelling match with id ${id}:`, error);
    throw error;
  }
};
