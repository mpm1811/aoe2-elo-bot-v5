-- AOE2 Elo bot v6 Seed Data

-- Insert admin user
INSERT INTO users (id, email, first_name, last_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert regular user
INSERT INTO users (id, email, first_name, last_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'user@example.com', 'Regular', 'User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert players
INSERT INTO players (id, handle, first_name, last_name, elo, avatar_url, created_by)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'TheViper', 'Ørjan', 'Larsen', 2400, 'https://api.dicebear.com/7.x/avataaars/svg?seed=viper', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002', 'DauT', 'Darko', 'Dautovic', 2300, 'https://api.dicebear.com/7.x/avataaars/svg?seed=daut', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000003', 'Hera', 'Hamzah', 'El-Baher', 2350, 'https://api.dicebear.com/7.x/avataaars/svg?seed=hera', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000004', 'TaToH', 'Iago', 'González', 2250, 'https://api.dicebear.com/7.x/avataaars/svg?seed=tatoh', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000005', 'Liereyy', 'Kai', 'Kallinger', 2380, 'https://api.dicebear.com/7.x/avataaars/svg?seed=liereyy', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000006', 'MbL', 'Mikołaj', 'Borczyk', 2200, 'https://api.dicebear.com/7.x/avataaars/svg?seed=mbl', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000007', 'Villese', 'Ville', 'Jämsä', 2150, 'https://api.dicebear.com/7.x/avataaars/svg?seed=villese', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000008', 'TheMax', 'Max', 'Schnabel', 2100, 'https://api.dicebear.com/7.x/avataaars/svg?seed=themax', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000009', 'Nicov', 'Nicolás', 'Correa', 2050, 'https://api.dicebear.com/7.x/avataaars/svg?seed=nicov', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000010', 'Vivi', 'Zhi Hao', 'Luu', 2000, 'https://api.dicebear.com/7.x/avataaars/svg?seed=vivi', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (handle) DO NOTHING;

-- Insert maps
INSERT INTO maps (id, name, description, image_url)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Arabia', 'Open map with few forests', 'https://aoe2.net/assets/maps/arabia.png'),
    ('20000000-0000-0000-0000-000000000002', 'Arena', 'Map with walls around players', 'https://aoe2.net/assets/maps/arena.png'),
    ('20000000-0000-0000-0000-000000000003', 'Black Forest', 'Map with dense forests', 'https://aoe2.net/assets/maps/black_forest.png'),
    ('20000000-0000-0000-0000-000000000004', 'Gold Rush', 'Map with gold in the center', 'https://aoe2.net/assets/maps/gold_rush.png'),
    ('20000000-0000-0000-0000-000000000005', 'Islands', 'Players start on separate islands', 'https://aoe2.net/assets/maps/islands.png'),
    ('20000000-0000-0000-0000-000000000006', 'Mediterranean', 'Map with a sea in the middle', 'https://aoe2.net/assets/maps/mediterranean.png'),
    ('20000000-0000-0000-0000-000000000007', 'Nomad', 'Players start with no town center', 'https://aoe2.net/assets/maps/nomad.png'),
    ('20000000-0000-0000-0000-000000000008', 'Scandinavia', 'Map with forests and rivers', 'https://aoe2.net/assets/maps/scandinavia.png')
ON CONFLICT (name) DO NOTHING;

-- Insert a completed match
INSERT INTO matches (id, match_date, status, map, notes, team1_score, team2_score, created_by)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - interval '1 day',
    'completed',
    'Arabia',
    'Great match with lots of action',
    3,
    2,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Insert match players
INSERT INTO match_players (match_id, player_id, team)
VALUES 
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1),
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1),
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 2),
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 2)
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Insert a scheduled match
INSERT INTO matches (id, match_date, status, map, created_by)
VALUES (
    '30000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + interval '1 day',
    'scheduled',
    'Black Forest',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Insert match players for scheduled match
INSERT INTO match_players (match_id, player_id, team)
VALUES 
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 1),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 2),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 2)
ON CONFLICT (match_id, player_id) DO NOTHING;
