import React, { useState, useEffect } from 'react';
import { UserProfile, NotificationItem } from '../../types';
import { notificationService } from '../../services/NotificationService';
import { playerService } from '../../services/PlayerService';
import { audioService } from '../../services/AudioService';
import { dbEngine } from '../../lib/storageEngine';
import { OnlinePlayersModal } from './OnlinePlayersModal';
import {
  Wallet,
  CreditCard,
  Bell,
  Volume2,
  VolumeX,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Terminal,
  Layers,
  Radio,
  Users,
} from 'lucide-react';

interface TopBarProps {
  user: UserProfile;
  onOpenBank: () => void;
  onOpenTerminal: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onSwitchAdminRole: (lvl: any) => void;
  activePage: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  onOpenBank,
  onOpenTerminal,
  onNavigate,
  onLogout,
  onSwitchAdminRole,
  activePage,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audioService.isSoundEnabled());
  const [onlineCount, setOnlineCount] = useState(() => Object.keys(dbEngine.getState().profiles).length);

  // Sync real online players count from database
  useEffect(() => {
    const updateCount = () => {
      const realCount = Object.keys(dbEngine.getState().profiles).length;
      setOnlineCount(realCount);
    };
    updateCount();
    const unsub = dbEngine.subscribe(updateCount);
    return () => unsub();
  }, []);

  useEffect(() => {
    setNotifications(notificationService.getNotifications(user.id));
  }, [user.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const reqXP = playerService.getRequiredXPForNextLevel(user.level);
  const xpPercent = Math.min(100, Math.round((user.xp / reqXP) * 100));

  const toggleSound = () => {
    const next = !soundEnabled;
    audioService.setEnabled(next);
    setSoundEnabled(next);
    if (next) audioService.play('click');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Brand & Server Online Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-red-900 group-hover:scale-105 transition-transform">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wider text-white">BANDIT</span>
              <span className="font-bold text-xs tracking-widest text-red-500 uppercase">GAME</span>
            </div>
            <p className="text-[10px] text-zinc-500 tracking-tight">ROLEPLAY SERVER</p>
          </div>
        </button>

        {/* Live Real Players Online Pulse */}
        <button
          id="topbar-online-btn"
          onClick={() => setShowOnlineModal(true)}
          title="Нажмите, чтобы открыть список реальных игроков онлайн"
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-xs transition-all cursor-pointer group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
            Игроков онлайн: <strong className="text-emerald-400 font-mono">{onlineCount}</strong>
          </span>
        </button>
      </div>

      {/* Middle: Money Badges & Quick Banking */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cash Balance */}
        <button
          id="topbar-cash-badge"
          onClick={onOpenBank}
          title="Наличные средства. Нажмите для открытия Банка"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-emerald-500/30 text-xs font-bold transition-colors"
        >
          <div className="p-1 rounded-md bg-emerald-950 text-emerald-400">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="hidden md:block text-[9px] text-zinc-400 font-semibold uppercase">Наличные</span>
            <span className="text-emerald-400">${user.money.toLocaleString('ru')}</span>
          </div>
        </button>

        {/* Bank Balance */}
        <button
          id="topbar-bank-badge"
          onClick={onOpenBank}
          title="Банковский счет. Нажмите для переводов и снятия"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-cyan-500/30 text-xs font-bold transition-colors"
        >
          <div className="p-1 rounded-md bg-cyan-950 text-cyan-400">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="hidden md:block text-[9px] text-zinc-400 font-semibold uppercase">Банк</span>
            <span className="text-cyan-400">${user.bank_money.toLocaleString('ru')}</span>
          </div>
        </button>

        {/* Level & XP Progress Bar */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <div className="w-6 h-6 rounded-lg bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-black text-xs">
            {user.level}
          </div>
          <div className="w-24">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold mb-0.5">
              <span>LVL {user.level}</span>
              <span>{xpPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: Sound, Terminal, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Выключить звуковые эффекты' : 'Включить звуковые эффекты'}
          className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
            soundEnabled
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              : 'bg-zinc-900 border-red-900/50 text-red-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Admin CLI Trigger (Ctrl+Q) */}
        {user.admin_level >= 1 && (
          <button
            id="topbar-terminal-btn"
            onClick={onOpenTerminal}
            title="Открыть командный терминал администрации (Ctrl + Q)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-bold transition-all shadow-sm shadow-red-950"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">CLI</span>
            <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-black/50 text-[9px] text-zinc-400 border border-zinc-700">
              ^Q
            </kbd>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="topbar-notif-btn"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
              if (unreadCount > 0) {
                notificationService.markAllAsRead(user.id);
              }
            }}
            className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden z-50 text-zinc-100">
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-white">Уведомления</span>
                <button
                  onClick={() => notificationService.clearAll(user.id)}
                  className="text-[11px] text-zinc-400 hover:text-red-400"
                >
                  Очистить
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/60 p-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">Уведомлений нет</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="p-3 hover:bg-zinc-800/40 rounded-xl transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-200">{n.title}</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            id="topbar-profile-btn"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">{user.username}</p>
              <p className="text-[10px] text-red-400 font-semibold">
                {user.admin_level > 0 ? `Админ [LVL ${user.admin_level}]` : 'Гражданин'}
              </p>
            </div>
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
              alt={user.username}
              className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
            />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-50 text-zinc-100">
              <div className="p-3 bg-zinc-950 rounded-xl mb-2">
                <p className="text-xs font-bold text-white">{user.username}</p>
                <p className="text-[11px] text-zinc-400">{user.status}</p>
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">ID аккаунта:</span>
                  <span className="font-mono font-bold text-zinc-300">{user.id.slice(0, 12)}...</span>
                </div>
              </div>

              <div className="space-y-1 text-xs font-semibold">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                  Мой профиль
                </button>

                {user.admin_level >= 1 && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-950/60 text-red-400 font-bold transition-colors"
                  >
                    <Shield className="w-4 h-4 text-red-500" />
                    Панель Администратора
                  </button>
                )}

                {/* Quick Role Tester Switcher for Demonstration */}
                <div className="pt-2 border-t border-zinc-800">
                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500">Тест ролей (Demo):</p>
                  <div className="grid grid-cols-3 gap-1 px-2">
                    {[
                      { lvl: 0, label: 'Игрок' },
                      { lvl: 2, label: 'Модер' },
                      { lvl: 5, label: 'Owner' },
                    ].map((r) => (
                      <button
                        key={r.lvl}
                        onClick={() => {
                          onSwitchAdminRole(r.lvl);
                          setShowProfileDropdown(false);
                        }}
                        className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                          user.admin_level === r.lvl
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 mt-2 rounded-lg hover:bg-red-950/40 text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из игры
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real Online Players Modal */}
      <OnlinePlayersModal
        isOpen={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        currentUser={user}
      />
    </header>
  );
};
