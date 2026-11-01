/**
 * Study Group Service
 * Manages study group creation, privacy codes, discovery, and membership.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { INITIAL_GROUPS } from '../../lib/mockData.js';
import { getLocalProfile } from '../gamification/gamificationService.js';

const GROUPS_STORAGE_KEY = 'nexhack_groups';
const USER_GROUPS_STORAGE_KEY = 'nexhack_user_group_memberships';

const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
      }
      memoryStore.set(key, String(val));
    } catch {
      memoryStore.set(key, String(val));
    }
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

/**
 * Generates an alphanumeric invite code: e.g. "NEX-8X2"
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NEX-${code}`;
}

/**
 * Retrieves all groups enriched with current user's membership status
 */
export async function getGroups() {
  let groups = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        groups = data;
      }
    } catch {
      // fallback
    }
  }

  if (groups.length === 0) {
    const raw = safeStorage.getItem(GROUPS_STORAGE_KEY);
    if (raw) {
      try {
        groups = JSON.parse(raw);
      } catch {
        groups = INITIAL_GROUPS;
      }
    } else {
      groups = INITIAL_GROUPS;
    }
  }

  // Get current user memberships
  let memberships = ['grp-1']; // user is in first group by default
  const memRaw = safeStorage.getItem(USER_GROUPS_STORAGE_KEY);
  if (memRaw) {
    try {
      memberships = JSON.parse(memRaw);
    } catch {
      memberships = ['grp-1'];
    }
  }

  return groups.map((g) => ({
    ...g,
    is_member: memberships.includes(g.id),
  }));
}

/**
 * Creates a new study group
 */
export async function createGroup({
  name,
  description,
  is_private = false,
  category = 'General',
  weekly_target_hours = 10,
}) {
  const newId = `grp-${Date.now()}`;
  const inviteCode = is_private ? generateInviteCode() : null;

  const newGroup = {
    id: newId,
    name: name.trim(),
    description: description.trim(),
    avatar_url: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&q=80`,
    is_private: Boolean(is_private),
    invite_code: inviteCode,
    category,
    weekly_target_hours: Number(weekly_target_hours) || 10,
    member_count: 1,
    created_at: new Date().toISOString(),
    is_member: true,
  };

  // Save to local groups
  const currentGroups = await getGroups();
  const updated = [newGroup, ...currentGroups];
  safeStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updated));

  // Add user to membership list
  let memberships = ['grp-1'];
  const memRaw = safeStorage.getItem(USER_GROUPS_STORAGE_KEY);
  if (memRaw) {
    try {
      memberships = JSON.parse(memRaw);
    } catch {
      memberships = ['grp-1'];
    }
  }
  if (!memberships.includes(newId)) {
    memberships.push(newId);
    safeStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(memberships));
  }

  // Remote Supabase sync if online
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      if (user) {
        const { data: created } = await supabase
          .from('study_groups')
          .insert({
            name: newGroup.name,
            description: newGroup.description,
            is_private: newGroup.is_private,
            invite_code: newGroup.invite_code,
            created_by: user.id,
          })
          .select()
          .single();

        if (created) {
          await supabase.from('group_members').insert({
            group_id: created.id,
            user_id: user.id,
            role: 'admin',
          });
        }
      }
    } catch (err) {
      console.warn('Supabase group creation sync deferred:', err);
    }
  }

  return newGroup;
}

/**
 * Joins a group by ID (for public groups)
 */
export async function joinGroup(groupId) {
  let memberships = ['grp-1'];
  const memRaw = safeStorage.getItem(USER_GROUPS_STORAGE_KEY);
  if (memRaw) {
    try {
      memberships = JSON.parse(memRaw);
    } catch {
      memberships = ['grp-1'];
    }
  }

  if (!memberships.includes(groupId)) {
    memberships.push(groupId);
    safeStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(memberships));
  }

  // Increment group member count
  const allGroups = await getGroups();
  const target = allGroups.find((g) => g.id === groupId);
  if (target) {
    target.member_count = (target.member_count || 1) + 1;
    safeStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(allGroups));
  }

  return { success: true };
}

/**
 * Joins a private group by invite code
 */
export async function joinGroupByCode(inviteCode) {
  if (!inviteCode || typeof inviteCode !== 'string') {
    throw new Error('Please enter a valid group invite code.');
  }

  const cleanCode = inviteCode.trim().toUpperCase();
  const allGroups = await getGroups();
  const matched = allGroups.find(
    (g) => g.invite_code && g.invite_code.toUpperCase() === cleanCode
  );

  if (!matched) {
    throw new Error('No study group found with this invite code. Please verify the code.');
  }

  await joinGroup(matched.id);
  return { success: true, group: matched };
}

/**
 * Leaves a study group
 */
export async function leaveGroup(groupId) {
  let memberships = ['grp-1'];
  const memRaw = safeStorage.getItem(USER_GROUPS_STORAGE_KEY);
  if (memRaw) {
    try {
      memberships = JSON.parse(memRaw);
    } catch {
      memberships = ['grp-1'];
    }
  }

  memberships = memberships.filter((id) => id !== groupId);
  safeStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(memberships));
  return { success: true };
}
