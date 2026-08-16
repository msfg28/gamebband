export type AdminLevel = 0 | 1 | 2 | 3 | 3.5 | 4 | 5;

export interface AdminRoleInfo {
  level: AdminLevel;
  name: string;
  badgeColor: string;
  description: string;
  permissions: AdminPermission[];
}

export type AdminPermission =
  | 'VIEW_PLAYERS'
  | 'BAN_PLAYER'
  | 'KICK_PLAYER'
  | 'WARN_PLAYER'
  | 'MUTE_PLAYER'
  | 'EDIT_ECONOMY'
  | 'EDIT_INVENTORY'
  | 'EDIT_VEHICLES'
  | 'VIEW_LOGS'
  | 'VIEW_ANTICHEAT'
  | 'MANAGE_ADMINS'
  | 'OWNER_ONLY';

export interface CharacterAppearance {
  gender: 'male' | 'female';
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  faceType: string;
  shirt: string;
  shirtColor: string;
  pants: string;
  pantsColor: string;
  shoes: string;
  shoesColor: string;
  jacket: string;
  jacketColor: string;
  hat: string;
  glasses: string;
  accessory: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  level: number;
  xp: number;
  money: number;
  bank_money: number;
  status: string;
  created_at: string;
  last_seen: string;
  clan_id: string | null;
  admin_level: AdminLevel;
  is_banned: boolean;
  ban_reason?: string | null;
  ban_until?: string | null;
  is_muted: boolean;
  mute_until?: string | null;
  warnings_count: number;
  suspicion_score: number;
  total_earned: number;
  total_spent: number;
  play_time_minutes: number;
  active_vehicle_id: string | null;
  character: CharacterAppearance;
}

export type ItemCategory =
  | 'weapons'
  | 'clothing'
  | 'food'
  | 'tools'
  | 'materials'
  | 'accessories'
  | 'medical'
  | 'special';

export type ItemRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC';

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ItemCategory;
  rarity: ItemRarity;
  price: number;
  weight: number; // in kg
  max_stack: number;
  is_equippable?: boolean;
  metadata?: Record<string, any>;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  item: Item;
  quantity: number;
  is_equipped?: boolean;
  slot_index?: number;
  created_at: string;
}

export type VehicleType =
  | 'car'
  | 'motorcycle'
  | 'truck'
  | 'special'
  | 'premium';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  price: number;
  speed: number; // 0-100% or km/h
  acceleration: number; // 0-100%
  handling: number; // 0-100%
  fuel_capacity: number; // in liters
  durability: number; // 0-100%
  image: string;
  rarity: ItemRarity;
  trunk_capacity: number; // kg
}

export interface VehicleUpgradeLevels {
  engine: number; // 0-5
  brakes: number; // 0-5
  handling: number; // 0-5
  armor: number; // 0-5
  turbo: number; // 0-5
  color: string;
}

export interface PlayerVehicle {
  id: string;
  vehicle_id: string;
  vehicle: Vehicle;
  custom_name?: string;
  fuel: number;
  durability: number;
  license_plate: string;
  upgrades: VehicleUpgradeLevels;
  is_active: boolean;
  purchased_at: string;
}

export interface PlayerStatUpgrade {
  id: string;
  name: string;
  category: 'engine' | 'brakes' | 'handling' | 'armor' | 'capacity' | 'speed' | 'earning' | 'inventory';
  description: string;
  current_level: number;
  max_level: number;
  base_price: number;
  price_multiplier: number;
  effect_per_level: string;
  icon: string;
}

export type MissionType = 'daily' | 'weekly' | 'story' | 'special';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  target_count: number;
  target_action: string;
  reward_money: number;
  reward_xp: number;
  reward_item_id?: string | null;
  reward_item_name?: string | null;
  expires_at?: string;
}

export interface PlayerMission {
  id: string;
  mission_id: string;
  mission: Mission;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  updated_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  reward_money: number;
  reward_xp: number;
  rarity: ItemRarity;
}

export interface PlayerAchievement {
  achievement_id: string;
  achievement: Achievement;
  is_unlocked: boolean;
  unlocked_at?: string | null;
  current_progress: number;
}

export type ClanRank = 'Leader' | 'Deputy' | 'Member';

export interface ClanMember {
  user_id: string;
  username: string;
  avatar_url: string;
  level: number;
  rank: ClanRank;
  joined_at: string;
  donations: number;
}

export interface ClanMessage {
  id: string;
  user_id: string;
  username: string;
  rank: ClanRank;
  message: string;
  created_at: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  emblem: string;
  leader_id: string;
  leader_name: string;
  balance: number;
  members: ClanMember[];
  max_members: number;
  level: number;
  created_at: string;
  warehouse_items: InventoryItem[];
}

export type BusinessType = 'supermarket' | 'autosalon' | 'restaurant' | 'gas_station' | 'workshop';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  description: string;
  owner_id: string | null;
  owner_name: string | null;
  level: number;
  price: number;
  hourly_profit: number;
  hourly_expenses: number;
  accumulated_profit: number;
  max_storage: number;
  current_storage: number;
  location: string;
  image: string;
  employees_count: number;
  last_collected_at: string;
}

export type JobType = 'taxi' | 'trucker' | 'courier' | 'mechanic' | 'delivery' | 'miner';

export interface Job {
  id: JobType;
  title: string;
  description: string;
  icon: string;
  min_level: number;
  base_pay: number;
  base_xp: number;
  shift_duration_seconds: number;
  cooldown_seconds: number;
  image: string;
}

export interface ActiveJobShift {
  jobId: JobType;
  startedAt: number;
  endsAt: number;
  targetObjective: string;
  destination: string;
  passengerOrCargo: string;
  payoutMoney: number;
  payoutXp: number;
  isReadyToClaim: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'purchase' | 'reward' | 'job' | 'business' | 'admin' | 'casino';
  amount: number;
  currency: 'cash' | 'bank';
  description: string;
  created_at: string;
}

export type CasinoGameType = 'slots' | 'roulette' | 'blackjack' | 'dice' | 'wheel';

export interface CasinoStats {
  total_bets: number;
  total_won: number;
  total_lost: number;
  biggest_win: number;
  games_played: number;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_level: AdminLevel;
  target_user_id: string;
  target_username: string;
  action: string;
  command: string;
  details: string;
  created_at: string;
  ip_hash?: string;
  metadata?: Record<string, any>;
}

export interface AntiCheatEvent {
  id: string;
  user_id: string;
  username: string;
  event_type: 'rapid_clicks' | 'impossible_speed' | 'excessive_rpc' | 'suspicious_balance' | 'abnormal_burst';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  created_at: string;
  suspicion_added: number;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'admin' | 'reward';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface AppSettings {
  language: 'ru' | 'en';
  theme: 'dark' | 'midnight' | 'cyberpunk';
  soundVolume: number; // 0 to 100
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
}
