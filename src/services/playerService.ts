import { playersApi } from './apiClient';

export interface Player {
  id?: string;
  handle: string;
  firstName: string;
  lastName: string;
  elo: number;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getPlayers = async (): Promise<Player[]> => {
  try {
    return await playersApi.getPlayers();
  } catch (error) {
    console.error("Error fetching players:", error);
    throw error;
  }
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    return await playersApi.getPlayerById(id);
  } catch (error) {
    console.error(`Error fetching player with id ${id}:`, error);
    throw error;
  }
};

export const createPlayer = async (player: Player): Promise<Player> => {
  try {
    return await playersApi.createPlayer(player);
  } catch (error) {
    console.error("Error creating player:", error);
    throw error;
  }
};

export const updatePlayer = async (
  id: string,
  player: Partial<Player>,
): Promise<Player> => {
  try {
    return await playersApi.updatePlayer(id, player);
  } catch (error) {
    console.error(`Error updating player with id ${id}:`, error);
    throw error;
  }
};

export const deletePlayer = async (id: string): Promise<void> => {
  try {
    await playersApi.deletePlayer(id);
  } catch (error) {
    console.error(`Error deleting player with id ${id}:`, error);
    throw error;
  }
};
