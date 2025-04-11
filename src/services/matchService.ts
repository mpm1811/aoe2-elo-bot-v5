import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client only if credentials are available
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface Player {
  id: string;
  handle: string;
  firstName: string;
  lastName: string;
  elo: number;
  avatarUrl?: string;
}

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
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("matches")
    .insert([{ ...match, createdAt: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.error("Error creating match:", error);
    throw error;
  }

  return data;
};

export const getMatches = async (): Promise<Match[]> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("matchDate", { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }

  // For demo purposes, return mock data if no data is returned
  if (!data || data.length === 0) {
    return [
      {
        id: "1",
        matchDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        team1Players: [
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
        ],
        team2Players: [
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
        ],
        team1Score: 3,
        team2Score: 2,
        status: "completed",
        map: "Arabia",
        notes: "Great match with lots of action",
      },
      {
        id: "2",
        matchDate: new Date().toISOString(), // Today
        team1Players: [
          {
            id: "1",
            handle: "TheViper",
            firstName: "Ørjan",
            lastName: "Larsen",
            elo: 2400,
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=viper",
          },
          {
            id: "5",
            handle: "Liereyy",
            firstName: "Kai",
            lastName: "Kallinger",
            elo: 2380,
            avatarUrl:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=liereyy",
          },
        ],
        team2Players: [
          {
            id: "3",
            handle: "Hera",
            firstName: "Hamzah",
            lastName: "El-Baher",
            elo: 2350,
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=hera",
          },
          {
            id: "2",
            handle: "DauT",
            firstName: "Darko",
            lastName: "Dautovic",
            elo: 2300,
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=daut",
          },
        ],
        status: "scheduled",
        map: "Black Forest",
      },
      {
        id: "3",
        matchDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        team1Players: [
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
            avatarUrl:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=liereyy",
          },
        ],
        team2Players: [
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
        ],
        status: "cancelled",
        map: "Arena",
        notes: "Cancelled due to scheduling conflict",
      },
    ];
  }

  return data;
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching match with id ${id}:`, error);
    throw error;
  }

  return data;
};

export const updateMatchResult = async (
  id: string,
  team1Score: number,
  team2Score: number,
): Promise<Match> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { data, error } = await supabase
    .from("matches")
    .update({
      team1Score,
      team2Score,
      status: "completed",
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating match result with id ${id}:`, error);
    throw error;
  }

  return data;
};

export const cancelMatch = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Please check your environment variables.",
    );
  }

  const { error } = await supabase
    .from("matches")
    .update({
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(`Error cancelling match with id ${id}:`, error);
    throw error;
  }
};
