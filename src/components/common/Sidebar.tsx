import React from 'react';
import { UserProfile } from '../../types';
import {
  LayoutDashboard,
  User,
  Backpack,
  Car,
  ShoppingBag,
  Zap,
  Briefcase,
  Target,
  Trophy,
  Users,
  Building,
  ShieldAlert,
  Settings,
  Terminal,
  LogOut,
  Dices,
} from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenTerminal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activePage,
  onNavigate,
  onOpenTerminal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'profile', label: 'Профиль & Персонаж', icon: User },
    { id: 'inventory', label: 'Инвентарь', icon: Backpack },
    { id: 'vehicles', label: 'Гараж & Автосалон', icon: Car },
    { id: 'shop', label: 'Оружейный магазин', icon: ShoppingBag },
    { id: 'upgrades', label: 'Прокачка навыков', icon: Zap },
    { id: 'casino', label: 'Казино Royal 777', icon: Dices },
    { id: 'jobs', label: 'Работа & Заказы', icon: Briefcase },
    { id: 'missions', label: 'Задания', icon: Target },
    { id: 'achievements', label: 'Достижения', icon: Trophy },
    { id: 'clans', label: 'Кланы & Синдикаты', icon: Users },
    { id: 'businesses', label: 'Бизнесы & Доход', icon: Building },
  ];

  return (
    <aside className="w-64 bg-zinc-950/95 border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none shrink-0 min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* Navigation Sections */}
        <div>
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
            Игровой мир
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/90'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administration Section */}
        {user.admin_level >= 1 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-500">
                Администрация
              </p>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-950 text-red-400 border border-red-800">
                LVL {user.admin_level}
              </span>
            </div>
            <div className="space-y-1">
              <button
                id="nav-admin"
                onClick={() => onNavigate('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activePage === 'admin'
                    ? 'bg-red-950 text-red-300 border border-red-600 shadow-lg shadow-red-950'
                    : 'text-red-400 hover:bg-red-950/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Центр управления</span>
              </button>

              <button
                id="nav-terminal"
                onClick={onOpenTerminal}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Командный CLI</span>
                </div>
                <kbd className="text-[9px] bg-black/60 px-1 py-0.5 rounded border border-zinc-800 text-zinc-500">
                  Ctrl+Q
                </kbd>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Settings & Version */}
      <div className="pt-3 border-t border-zinc-900 space-y-1">
        <button
          id="nav-settings"
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activePage === 'settings'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Настройки & БД</span>
        </button>

        <div className="px-3 pt-2 flex items-center justify-between text-[10px] text-zinc-600">
          <span>BANDIT RP Core</span>
          <span className="font-mono">v2.5.0</span>
        </div>
      </div>
    </aside>
  );
};
