import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client only if credentials are available
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("elo", { ascending: false });

  if (error) {
    console.error("Error fetching players:", error);
    throw error;
  }

  // For demo purposes, return mock data if no data is returned
  if (!data || data.length === 0) {
    return [
      {
        id: "1",
        handle: "TheViper",
        firstName: "Ørjan",
        lastName: "Larsen",
        elo: 2400,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=viper",
      },
      {
        id: "2",
        handle: "DauT",
        firstName: "Darko",
        lastName: "Dautovic",
        elo: 2300,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=daut",
      },
      {
        id: "3",
        handle: "Hera",
        firstName: "Hamzah",
        lastName: "El-Baher",
        elo: 2350,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=hera",
      },
      {
        id: "4",
        handle: "TaToH",
        firstName: "Iago",
        lastName: "González",
        elo: 2250,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tatoh",
      },
      {
        id: "5",
        handle: "Liereyy",
        firstName: "Kai",
        lastName: "Kallinger",
        elo: 2380,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=liereyy",
      },
    ];
  }

  return data;
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching player with id ${id}:`, error);
    throw error;
  }

  return data;
};

export const createPlayer = async (player: Player): Promise<Player> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  // Generate avatar URL if not provided
  if (!player.avatarUrl) {
    player.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.handle.toLowerCase()}`;
  }

  const { data, error } = await supabase
    .from("players")
    .insert([{ ...player, createdAt: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.error("Error creating player:", error);
    throw error;
  }

  return data;
};

export const updatePlayer = async (
  id: string,
  player: Partial<Player>,
): Promise<Player> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("players")
    .update({ ...player, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating player with id ${id}:`, error);
    throw error;
  }

  return data;
};

export const deletePlayer = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting player with id ${id}:`, error);
    throw error;
  }
};
