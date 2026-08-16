import { dbEngine } from '../lib/storageEngine';
import { UserProfile, AdminLevel } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { notificationService } from './NotificationService';

const SESSION_KEY = 'BANDIT_GAME_CURRENT_USER_ID';

class AuthService {
  private currentUserId: string | null = null;
  private authListeners: Set<(user: UserProfile | null) => void> = new Set();

  constructor() {
    this.initSession();
  }

  private initSession() {
    if (typeof window === 'undefined') return;
    const savedId = localStorage.getItem(SESSION_KEY);
    const state = dbEngine.getState();

    if (savedId && state.profiles[savedId]) {
      this.currentUserId = savedId;
    } else {
      // Default to demo owner user for immediate out-of-the-box readiness
      const demoId = 'usr_bandit_demo_1';
      if (state.profiles[demoId]) {
        this.currentUserId = demoId;
        localStorage.setItem(SESSION_KEY, demoId);
      }
    }
  }

  public subscribe(listener: (user: UserProfile | null) => void): () => void {
    this.authListeners.add(listener);
    listener(this.getCurrentProfile());
    return () => {
      this.authListeners.delete(listener);
    };
  }

  private notify() {
    const profile = this.getCurrentProfile();
    this.authListeners.forEach((l) => l(profile));
  }

  public getCurrentProfile(): UserProfile | null {
    if (!this.currentUserId) return null;
    const state = dbEngine.getState();
    return state.profiles[this.currentUserId] || null;
  }

  public async register(
    username: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Имя пользователя должно содержать не менее 3 символов' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Введите корректный адрес электронной почты' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Пароль должен быть длиной не менее 6 символов' };
    }

    // Check if Supabase is active
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: { username: cleanUsername },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
    }

    const state = dbEngine.getState();

    // Check username collision
    const existingUser = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existingUser) {
      return { success: false, error: 'Пользователь с таким никнеймом уже зарегистрирован' };
    }

    // Check email collision
    if (state.users[cleanEmail]) {
      return { success: false, error: 'Аккаунт с таким email уже существует' };
    }

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProfile: UserProfile = {
      id: newUserId,
      user_id: newUserId,
      username: cleanUsername,
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}`,
      level: 1,
      xp: 0,
      money: 10000,
      bank_money: 25000,
      status: 'Новичок на районе',
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      clan_id: null,
      admin_level: 0 as AdminLevel,
      is_banned: false,
      ban_reason: null,
      ban_until: null,
      is_muted: false,
      mute_until: null,
      warnings_count: 0,
      suspicion_score: 0,
      total_earned: 10000,
      total_spent: 0,
      play_time_minutes: 0,
      active_vehicle_id: null,
      character: {
        gender: 'male',
        skinColor: '#d4a373',
        hairStyle: 'crew',
        hairColor: '#1a1a1a',
        faceType: 'default',
        shirt: 'tshirt_black',
        shirtColor: '#18181b',
        pants: 'jeans_dark',
        pantsColor: '#27272a',
        shoes: 'sneakers',
        shoesColor: '#ffffff',
        jacket: 'none',
        jacketColor: '#18181b',
        hat: 'none',
        glasses: 'none',
        accessory: 'none',
      },
    };

    dbEngine.updateState((draft) => {
      draft.users[cleanEmail] = {
        email: cleanEmail,
        passwordHash: password, // In client mock we store, in Supabase Auth it handles securely
        userId: newUserId,
      };
      draft.profiles[newUserId] = newProfile;
      draft.inventory[newUserId] = [];
      draft.vehicles[newUserId] = [];
      draft.notifications[newUserId] = [
        {
          id: `notif_reg_${Date.now()}`,
          type: 'success',
          title: 'Регистрация завершена',
          message: `Добро пожаловать на сервер BANDIT GAME, ${cleanUsername}! Вам начислен стартовый капитал $10,000 наличными и $25,000 в банке.`,
          created_at: new Date().toISOString(),
          read: false,
        },
      ];
    });

    this.currentUserId = newUserId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, newUserId);
    }
    this.notify();

    notificationService.notify(
      newUserId,
      'success',
      'Добро пожаловать!',
      'Аккаунт успешно создан. Стартовый бонус зачислен.'
    );

    return { success: true, profile: newProfile };
  }

  public async login(
    emailOrUsername: string,
    password: string
  ): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
    const cleanInput = emailOrUsername.trim().toLowerCase();

    if (isSupabaseConfigured && supabase && cleanInput.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
    }

    const state = dbEngine.getState();
    let targetUserId: string | null = null;

    // Search by email
    if (state.users[cleanInput]) {
      if (state.users[cleanInput].passwordHash === password) {
        targetUserId = state.users[cleanInput].userId;
      } else {
        return { success: false, error: 'Неверный пароль' };
      }
    } else {
      // Search by username
      const profile = Object.values(state.profiles).find(
        (p) => p.username.toLowerCase() === cleanInput
      );
      if (profile) {
        const userEntry = Object.values(state.users).find((u) => u.userId === profile.id);
        if (userEntry && userEntry.passwordHash === password) {
          targetUserId = profile.id;
        } else {
          return { success: false, error: 'Неверный пароль' };
        }
      }
    }

    if (!targetUserId || !state.profiles[targetUserId]) {
      return { success: false, error: 'Пользователь не найден или неверные учетные данные' };
    }

    const userProfile = state.profiles[targetUserId];

    if (userProfile.is_banned) {
      return {
        success: false,
        error: `Ваш аккаунт заблокирован! Причина: ${userProfile.ban_reason || 'Нарушение правил сервера'}${
          userProfile.ban_until ? ` (до ${new Date(userProfile.ban_until).toLocaleString('ru')})` : ' (Перманентно)'
        }`,
      };
    }

    // Update last seen
    dbEngine.updateState((draft) => {
      if (draft.profiles[targetUserId!]) {
        draft.profiles[targetUserId!].last_seen = new Date().toISOString();
      }
    });

    this.currentUserId = targetUserId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, targetUserId);
    }
    this.notify();

    notificationService.notify(
      targetUserId,
      'info',
      'Вход выполнен',
      `С возвращением в BANDIT GAME, ${userProfile.username}!`
    );

    return { success: true, profile: userProfile };
  }

  public logout() {
    this.currentUserId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    this.notify();
  }

  public switchDemoAccount(targetAdminLevel: AdminLevel) {
    const state = dbEngine.getState();
    const current = this.getCurrentProfile();
    if (!current) return;

    dbEngine.updateState((draft) => {
      if (draft.profiles[current.id]) {
        draft.profiles[current.id].admin_level = targetAdminLevel;
      }
    });
    this.notify();
  }
}

export const authService = new AuthService();
