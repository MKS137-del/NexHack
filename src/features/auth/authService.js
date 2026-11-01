import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const MOCK_SESSION_KEY = 'nexhack_auth_session';
const MOCK_PROFILES_KEY = 'nexhack_profiles';

// Helper for local mock storage
function getMockProfiles() {
  try {
    const raw = localStorage.getItem(MOCK_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read mock profiles:', err);
    return {};
  }
}

function saveMockProfiles(profiles) {
  try {
    localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to write mock profiles:', err);
  }
}

export const authService = {
  /**
   * Register a new user
   */
  async signUp({ email, password, username, displayName }) {
    if (!email || !password || !username) {
      return { data: null, error: new Error('Email, password, and username are required.') };
    }

    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: displayName || username },
          },
        });

        if (authError) return { data: null, error: authError };

        // Profile row is typically created via Supabase trigger on auth.users,
        // but we also ensure profile exists here with genuine 0-stat defaults.
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              username,
              display_name: displayName || username,
              xp: 0,
              level: 1,
              current_streak: 0,
              longest_streak: 0,
              last_active_date: null,
              total_study_time: 0,
            });

          if (profileError) console.warn('Profile initialization notice:', profileError.message);
        }

        return { data: authData, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    // Mock Mode Execution
    const profiles = getMockProfiles();
    // Check if username taken
    const existing = Object.values(profiles).find(
      (p) => p.username?.toLowerCase() === username.toLowerCase() || p.email?.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return { data: null, error: new Error('User with this email or username already exists.') };
    }

    const mockId = 'user-' + Math.random().toString(36).substring(2, 9);
    const newProfile = {
      id: mockId,
      email,
      username,
      display_name: displayName || username,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      xp: 0, // Genuine 0 XP
      level: 1,
      current_streak: 0, // Genuine 0 streak
      longest_streak: 0,
      last_active_date: null,
      total_study_time: 0,
      created_at: new Date().toISOString(),
    };

    profiles[mockId] = newProfile;
    saveMockProfiles(profiles);

    const mockSession = { user: newProfile, access_token: 'mock-jwt-' + mockId };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockSession));

    return { data: mockSession, error: null };
  },

  /**
   * Log in an existing user
   */
  async signIn({ email, password }) {
    if (!email || !password) {
      return { data: null, error: new Error('Email and password are required.') };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    // Mock Mode Execution
    const profiles = getMockProfiles();
    const found = Object.values(profiles).find(
      (p) => p.email?.toLowerCase() === email.toLowerCase() || p.username?.toLowerCase() === email.toLowerCase()
    );

    if (!found) {
      return { data: null, error: new Error('Account not found. Please register a new account.') };
    }

    const mockSession = { user: found, access_token: 'mock-jwt-' + found.id };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockSession));

    return { data: mockSession, error: null };
  },

  /**
   * Log out current user
   */
  async signOut() {
    localStorage.removeItem(MOCK_SESSION_KEY);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signOut();
        return { error };
      } catch (err) {
        return { error: err };
      }
    }

    return { error: null };
  },

  /**
   * Get active session
   */
  async getSession() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.getSession();
        return { data: data?.session, error };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    try {
      const raw = localStorage.getItem(MOCK_SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      return { data: session, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  /**
   * Retrieve full user profile
   */
  async getProfile(userId) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data) return { data, error: null };

        // Fallback default profile if table row pending
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user && authUser.user.id === userId) {
          const defaultProfile = {
            id: authUser.user.id,
            username: authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'learner',
            display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0] || 'Learner',
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.user.id}`,
            xp: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
            total_study_time: 0,
            last_active_date: null,
          };
          return { data: defaultProfile, error: null };
        }

        return { data: null, error };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    const profiles = getMockProfiles();
    return { data: profiles[userId] || null, error: null };
  },
};
