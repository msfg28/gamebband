import {
  UserProfile,
  InventoryItem,
  PlayerVehicle,
  Clan,
  Business,
  PlayerStatUpgrade,
  PlayerMission,
  PlayerAchievement,
  Transaction,
  AdminLog,
  AntiCheatEvent,
  NotificationItem,
  AppSettings,
  AdminLevel,
} from '../types';
import {
  INITIAL_ITEMS,
  INITIAL_VEHICLES,
  INITIAL_CLANS,
  INITIAL_BUSINESSES,
  INITIAL_STAT_UPGRADES,
  INITIAL_MISSIONS,
  INITIAL_ACHIEVEMENTS,
} from '../data/gameData';

const DB_KEY = 'BANDIT_GAME_DB_V2';

export interface GameDatabaseState {
  version: number;
  users: Record<string, { email: string; passwordHash: string; userId: string }>;
  profiles: Record<string, UserProfile>;
  inventory: Record<string, InventoryItem[]>; // userId -> items
  vehicles: Record<string, PlayerVehicle[]>; // userId -> vehicles
  clans: Clan[];
  businesses: Business[];
  statUpgrades: Record<string, PlayerStatUpgrade[]>; // userId -> upgrades
  missions: Record<string, PlayerMission[]>; // userId -> missions
  achievements: Record<string, PlayerAchievement[]>; // userId -> achievements
  transactions: Transaction[];
  adminLogs: AdminLog[];
  antiCheatEvents: AntiCheatEvent[];
  notifications: Record<string, NotificationItem[]>; // userId -> notifications
  settings: Record<string, AppSettings>;
}

function getInitialDatabase(): GameDatabaseState {
  const defaultUserId = 'usr_bandit_demo_1';
  const defaultEmail = 'player@bandit.game';

  const defaultProfile: UserProfile = {
    id: defaultUserId,
    user_id: defaultUserId,
    username: 'Tony_Montana',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    level: 3,
    xp: 420,
    money: 28500,
    bank_money: 145000,
    status: 'Авторитет района',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    last_seen: new Date().toISOString(),
    clan_id: 'clan_italian_mafia',
    admin_level: 5 as AdminLevel, // Demo user is OWNER so user can immediately test everything including Admin panel and /commands!
    is_banned: false,
    ban_reason: null,
    ban_until: null,
    is_muted: false,
    mute_until: null,
    warnings_count: 0,
    suspicion_score: 12,
    total_earned: 94000,
    total_spent: 65500,
    play_time_minutes: 380,
    active_vehicle_id: 'pveh_bmw_1',
    character: {
      gender: 'male',
      skinColor: '#d4a373',
      hairStyle: 'slick',
      hairColor: '#18181b',
      faceType: 'default',
      shirt: 'leather_jacket',
      shirtColor: '#18181b',
      pants: 'cargo_dark',
      pantsColor: '#27272a',
      shoes: 'boots',
      shoesColor: '#09090b',
      jacket: 'trench',
      jacketColor: '#0f172a',
      hat: 'fedora',
      glasses: 'aviator',
      accessory: 'gold_chain',
    },
  };

  const starterInventory: InventoryItem[] = [
    {
      id: 'inv_1',
      item_id: 'wpn_deagle',
      item: INITIAL_ITEMS.find((i) => i.id === 'wpn_deagle')!,
      quantity: 1,
      is_equipped: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv_2',
      item_id: 'med_kit_pro',
      item: INITIAL_ITEMS.find((i) => i.id === 'med_kit_pro')!,
      quantity: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv_3',
      item_id: 'food_energy_drink',
      item: INITIAL_ITEMS.find((i) => i.id === 'food_energy_drink')!,
      quantity: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv_4',
      item_id: 'acc_gold_rolex',
      item: INITIAL_ITEMS.find((i) => i.id === 'acc_gold_rolex')!,
      quantity: 1,
      is_equipped: true,
      created_at: new Date().toISOString(),
    },
  ];

  const starterVehicles: PlayerVehicle[] = [
    {
      id: 'pveh_bmw_1',
      vehicle_id: 'veh_bmw_m5',
      vehicle: INITIAL_VEHICLES.find((v) => v.id === 'veh_bmw_m5')!,
      custom_name: 'Черная Молния M5',
      fuel: 95,
      durability: 100,
      license_plate: 'B777BT77',
      upgrades: {
        engine: 2,
        brakes: 1,
        handling: 1,
        armor: 1,
        turbo: 2,
        color: '#0f172a',
      },
      is_active: true,
      purchased_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];

  const starterMissions: PlayerMission[] = INITIAL_MISSIONS.map((m) => ({
    id: `pmis_${m.id}`,
    mission_id: m.id,
    mission: m,
    progress: m.id === 'mis_daily_earnings' ? 4500 : m.id === 'mis_daily_jobs' ? 1 : 0,
    is_completed: false,
    is_claimed: false,
    updated_at: new Date().toISOString(),
  }));

  const starterAchievements: PlayerAchievement[] = INITIAL_ACHIEVEMENTS.map((a) => ({
    achievement_id: a.id,
    achievement: a,
    is_unlocked: a.id === 'ach_newbie' || a.id === 'ach_first_car',
    unlocked_at: a.id === 'ach_newbie' ? new Date().toISOString() : null,
    current_progress: a.id === 'ach_newbie' ? 1 : a.id === 'ach_first_car' ? 1 : 0,
  }));

  const starterNotifications: NotificationItem[] = [
    {
      id: 'notif_welcome',
      type: 'info',
      title: 'Добро пожаловать в BANDIT GAME!',
      message: 'Сервер успешно инициализирован. Вы вошли как создатель (Owner Level 5). Нажмите Ctrl+Q для открытия админ-панели.',
      created_at: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif_clan_news',
      type: 'reward',
      title: 'Синдикат Italian Mafia',
      message: 'Дон Сальваторе назначил вас доверенным лицом семьи.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
  ];

  return {
    version: 2,
    users: {
      [defaultEmail]: {
        email: defaultEmail,
        passwordHash: 'demo123456',
        userId: defaultUserId,
      },
    },
    profiles: {
      [defaultUserId]: defaultProfile,
    },
    inventory: {
      [defaultUserId]: starterInventory,
    },
    vehicles: {
      [defaultUserId]: starterVehicles,
    },
    clans: INITIAL_CLANS,
    businesses: INITIAL_BUSINESSES,
    statUpgrades: {
      [defaultUserId]: INITIAL_STAT_UPGRADES,
    },
    missions: {
      [defaultUserId]: starterMissions,
    },
    achievements: {
      [defaultUserId]: starterAchievements,
    },
    transactions: [
      {
        id: 'tx_init_1',
        user_id: defaultUserId,
        type: 'job',
        amount: 8500,
        currency: 'cash',
        description: 'Выплата за контракт дальнобойщика',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'tx_init_2',
        user_id: defaultUserId,
        type: 'purchase',
        amount: 145000,
        currency: 'bank',
        description: 'Покупка авто BMW M5 F90 Competition',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    adminLogs: [
      {
        id: 'alog_init_1',
        admin_id: defaultUserId,
        admin_name: 'Tony_Montana',
        admin_level: 5,
        target_user_id: defaultUserId,
        target_username: 'Tony_Montana',
        action: 'SERVER_BOOT',
        command: '/system start',
        details: 'BANDIT GAME Database & RP Engine initialized successfully',
        created_at: new Date().toISOString(),
      },
    ],
    antiCheatEvents: [
      {
        id: 'ac_init_1',
        user_id: defaultUserId,
        username: 'Tony_Montana',
        event_type: 'abnormal_burst',
        severity: 'low',
        details: 'Initial system latency check OK. Heuristics baseline set.',
        created_at: new Date().toISOString(),
        suspicion_added: 0,
      },
    ],
    notifications: {
      [defaultUserId]: starterNotifications,
    },
    settings: {
      [defaultUserId]: {
        language: 'ru',
        theme: 'dark',
        soundVolume: 70,
        soundEnabled: true,
        notificationsEnabled: true,
        animationsEnabled: true,
        compactMode: false,
      },
    },
  };
}

class StorageEngine {
  private state: GameDatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.load();
  }

  private load(): GameDatabaseState {
    if (typeof window === 'undefined') {
      return getInitialDatabase();
    }
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.version === 2) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    const fresh = getInitialDatabase();
    this.saveDirect(fresh);
    return fresh;
  }

  private saveDirect(newState: GameDatabaseState) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(newState));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }

  public getState(): GameDatabaseState {
    return this.state;
  }

  public updateState(updater: (draft: GameDatabaseState) => void) {
    updater(this.state);
    this.saveDirect(this.state);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }

  public resetDatabase() {
    this.state = getInitialDatabase();
    this.saveDirect(this.state);
    this.notify();
  }
}

export const dbEngine = new StorageEngine();
