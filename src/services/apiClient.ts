import { Player } from './playerService';
import { Match } from './matchService';

// Base API URL from environment variables, with fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('API Error:', errorData);
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

// Verify API connectivity
export async function verifyApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}

// Get token from local storage
function getToken(): string | null {
  const session = localStorage.getItem('session');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      return parsedSession.access_token;
    } catch (error) {
      console.error('Error parsing session:', error);
    }
  }
  return null;
}

// Auth API calls
export const authApi = {
  // Sign up a new user
  async signUp(email: string, password: string, firstName = '', lastName = ''): Promise<any> {
    console.log('Signing up with:', { email, firstName, lastName });
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
      }),
    });
    
    const data = await handleResponse<{ session?: { access_token: string } }>(response);
    console.log('Signup response:', data);
    
    // If signup includes a session (auto-login), store it
    if (data.session) {
      localStorage.setItem('session', JSON.stringify(data.session));
    }
    
    return data;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return getToken() !== null;
  },

  // Sign in an existing user
  async signIn(email: string, password: string): Promise<any> {
    console.log('Signing in with email:', email);
    
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const data = await handleResponse<{session?: {access_token: string}}>(response);
    console.log('Sign in response received:', data.session ? 'User authenticated' : 'Authentication failed');
    
    // Store session data in localStorage
    if (data.session) {
      localStorage.setItem('session', JSON.stringify(data.session));
    }
    
    return data;
  },

  // Sign out the current user
  async signOut(): Promise<void> {
    const token = getToken();
    if (!token) {
      console.log('No active session found for sign out');
      localStorage.removeItem('session');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      await handleResponse(response);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // Always clear session data from localStorage
      localStorage.removeItem('session');
    }
  },

  // Get the current user info
  async getUser(): Promise<any> {
    const token = getToken();
    if (!token) {
      throw new Error('No active session found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return handleResponse(response);
  },
};

// Players API calls
export const playersApi = {
  // Get all players
  async getPlayers(): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/players`);
    return handleResponse<Player[]>(response);
  },

  // Get a player by ID
  async getPlayerById(id: string): Promise<Player> {
    const response = await fetch(`${API_BASE_URL}/players/${id}`);
    return handleResponse<Player>(response);
  },

  // Create a new player
  async createPlayer(player: Player): Promise<Player> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers,
      body: JSON.stringify(player),
    });

    return handleResponse<Player>(response);
  },

  // Update an existing player
  async updatePlayer(id: string, player: Partial<Player>): Promise<Player> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/players/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(player),
    });

    return handleResponse<Player>(response);
  },

  // Delete a player
  async deletePlayer(id: string): Promise<void> {
    const token = getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/players/${id}`, {
      method: 'DELETE',
      headers,
    });

    return handleResponse<void>(response);
  },
};

// Matches API calls
export const matchesApi = {
  // Get all matches
  async getMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/matches`);
    return handleResponse<Match[]>(response);
  },

  // Get a match by ID
  async getMatchById(id: string): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/matches/${id}`);
    return handleResponse<Match>(response);
  },

  // Create a new match
  async createMatch(match: Omit<Match, "id">): Promise<Match> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers,
      body: JSON.stringify(match),
    });

    return handleResponse<Match>(response);
  },

  // Update a match result
  async updateMatchResult(id: string, team1Score: number, team2Score: number): Promise<Match> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/matches/${id}/result`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ team1Score, team2Score }),
    });

    return handleResponse<Match>(response);
  },

  // Cancel a match
  async cancelMatch(id: string): Promise<void> {
    const token = getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/matches/${id}/cancel`, {
      method: 'PUT',
      headers,
    });

    return handleResponse<void>(response);
  },
};