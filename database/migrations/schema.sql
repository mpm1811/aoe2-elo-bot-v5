-- AOE2 Elo bot v6 Database Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set up auth schema (this would normally be managed by Supabase)
-- Only needed if we're creating the schema from scratch
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth;
    END IF;
END
$$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1000,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    active BOOLEAN DEFAULT TRUE
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    map TEXT,
    notes TEXT,
    team1_score INTEGER,
    team2_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create match_players table to associate players with matches and teams
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    team INTEGER NOT NULL CHECK (team IN (1, 2)),
    elo_before INTEGER,
    elo_after INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Create maps table for storing map information
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_players_handle ON players(handle);
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);

-- Add Row-Level Security (RLS) policies

-- Enable RLS on tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Create policies for players table
CREATE POLICY players_select_policy ON players
    FOR SELECT USING (true);  -- Anyone can view players

CREATE POLICY players_insert_policy ON players
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );  -- Only authenticated users can insert

CREATE POLICY players_update_policy ON players
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );  -- Only creator or admin can update

CREATE POLICY players_delete_policy ON players
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );  -- Only admin can delete

-- Similar policies for matches table
CREATE POLICY matches_select_policy ON matches
    FOR SELECT USING (true);

CREATE POLICY matches_insert_policy ON matches
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY matches_update_policy ON matches
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY matches_delete_policy ON matches
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Create functions for match creation and ELO updates
CREATE OR REPLACE FUNCTION update_elo_after_match() 
RETURNS TRIGGER AS $$
DECLARE
    team1_avg_elo FLOAT;
    team2_avg_elo FLOAT;
    team1_players UUID[];
    team2_players UUID[];
    player_id UUID;
    player_elo INTEGER;
    elo_change INTEGER;
    k_factor INTEGER := 32;  -- Standard K-factor for ELO calculations
    expected_score FLOAT;
    actual_score FLOAT;
BEGIN
    -- Only run when a match is completed
    IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD IS NULL) THEN
        -- Get team average ELOs
        SELECT COALESCE(AVG(p.elo), 1000), ARRAY_AGG(p.id)
        INTO team1_avg_elo, team1_players
        FROM match_players mp
        JOIN players p ON mp.player_id = p.id
        WHERE mp.match_id = NEW.id AND mp.team = 1;
        
        SELECT COALESCE(AVG(p.elo), 1000), ARRAY_AGG(p.id)
        INTO team2_avg_elo, team2_players
        FROM match_players mp
        JOIN players p ON mp.player_id = p.id
        WHERE mp.match_id = NEW.id AND mp.team = 2;
        
        -- Calculate actual scores (0 for loss, 0.5 for draw, 1 for win)
        IF NEW.team1_score > NEW.team2_score THEN
            actual_score := 1.0;
        ELSIF NEW.team1_score < NEW.team2_score THEN
            actual_score := 0.0;
        ELSE
            actual_score := 0.5;
        END IF;
        
        -- Update ELO for team 1 players
        FOREACH player_id IN ARRAY team1_players
        LOOP
            -- Get player's current ELO
            SELECT elo INTO player_elo FROM players WHERE id = player_id;
            
            -- Store ELO before match
            UPDATE match_players SET elo_before = player_elo
            WHERE match_id = NEW.id AND player_id = player_id;
            
            -- Calculate expected score using ELO formula
            expected_score := 1 / (1 + 10^((team2_avg_elo - player_elo) / 400.0));
            
            -- Calculate ELO change
            elo_change := ROUND(k_factor * (actual_score - expected_score));
            
            -- Update player's ELO
            UPDATE players SET 
                elo = player_elo + elo_change,
                updated_at = NOW()
            WHERE id = player_id;
            
            -- Store ELO after match
            UPDATE match_players SET elo_after = player_elo + elo_change
            WHERE match_id = NEW.id AND player_id = player_id;
        END LOOP;
        
        -- Update ELO for team 2 players
        FOREACH player_id IN ARRAY team2_players
        LOOP
            -- Get player's current ELO
            SELECT elo INTO player_elo FROM players WHERE id = player_id;
            
            -- Store ELO before match
            UPDATE match_players SET elo_before = player_elo
            WHERE match_id = NEW.id AND player_id = player_id;
            
            -- Calculate expected score using ELO formula
            expected_score := 1 / (1 + 10^((team1_avg_elo - player_elo) / 400.0));
            
            -- Calculate ELO change (inverted actual_score for team 2)
            elo_change := ROUND(k_factor * ((1 - actual_score) - expected_score));
            
            -- Update player's ELO
            UPDATE players SET 
                elo = player_elo + elo_change,
                updated_at = NOW()
            WHERE id = player_id;
            
            -- Store ELO after match
            UPDATE match_players SET elo_after = player_elo + elo_change
            WHERE match_id = NEW.id AND player_id = player_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ELO updates
CREATE TRIGGER trigger_update_elo_after_match
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_elo_after_match();
