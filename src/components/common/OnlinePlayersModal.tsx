import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { dbEngine } from '../../lib/storageEngine';
import { ADMIN_ROLES } from '../../data/gameData';
import {
  Users,
  X,
  Search,
  Shield,
  Wifi,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  Car,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnlinePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');

  const loadPlayers = () => {
    const all = Object.values(dbEngine.getState().profiles);
    setProfiles(all);
  };

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
      const unsub = dbEngine.subscribe(loadPlayers);
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = profiles.filter((p) =>
    p.username.toLowerCase().includes(search.trim().toLowerCase()) ||
    (p.status && p.status.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    Реальные игроки онлайн
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[11px] font-bold">
                    {profiles.length} {profiles.length === 1 ? 'игрок' : 'игроков'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Список всех реальных зарегистрированных пользователей сервера (боты удалены)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar & info banner */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск игрока по никнейму или статусу..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Прямая синхронизация с базой данных
              </span>
              <span>Всего в сети: {profiles.length}</span>
            </div>
          </div>

          {/* Player list */}
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-zinc-800/40">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Игроков по запросу «{search}» не найдено
              </div>
            ) : (
              filtered.map((player) => {
                const isCurrent = player.id === currentUser.id;
                const role = ADMIN_ROLES[String(player.admin_level)] || ADMIN_ROLES['0'];

                return (
                  <div
                    key={player.id}
                    className={`pt-2.5 first:pt-0 p-3 rounded-2xl flex items-center justify-between gap-4 transition-colors ${
                      isCurrent
                        ? 'bg-red-950/20 border border-red-800/50'
                        : 'hover:bg-zinc-800/40 bg-zinc-950/40 border border-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={player.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={player.username}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-700 bg-zinc-800"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950"></span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">
                            {player.username}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-black uppercase text-white tracking-wider">
                              Вы
                            </span>
                          )}
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold border uppercase ${role.badgeColor}`}>
                            {role.name.split(' ')[0]}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 font-bold">
                            LVL {player.level}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {player.status || 'Гражданин штата'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-bold">
                        <Wifi className="w-3 h-3" />
                        <span>{16 + (player.username.length % 8)} ms</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ${(player.money + player.bank_money).toLocaleString('ru')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 text-[11px]">
              Новые игроки добавляются в список сразу после регистрации
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
