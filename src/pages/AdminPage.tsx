import React, { useState, useEffect } from 'react';
import { UserProfile, AdminLog, AntiCheatEvent, AdminLevel } from '../types';
import { adminService } from '../services/AdminService';
import { antiCheatService } from '../services/AntiCheatService';
import { playerService } from '../services/PlayerService';
import { dbEngine } from '../lib/storageEngine';
import { ADMIN_ROLES, INITIAL_ITEMS, INITIAL_VEHICLES } from '../data/gameData';
import {
  ShieldAlert,
  Users,
  Terminal,
  Activity,
  UserX,
  AlertTriangle,
  VolumeX,
  DollarSign,
  Car,
  Gift,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  Database,
  Sliders,
  Play,
  Flame,
  ShieldCheck,
  Zap,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPageProps {
  user: UserProfile;
}

export const AdminPage: React.FC<AdminPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'anticheat' | 'logs' | 'actions'>(
    'overview'
  );
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [acEvents, setAcEvents] = useState<AntiCheatEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected player for modal actions
  const [selectedPlayer, setSelectedPlayer] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<
    'ban' | 'kick' | 'warn' | 'mute' | 'givemoney' | 'giveitem' | 'givevehicle' | 'setadmin' | 'rename' | null
  >(null);

  // Form fields for admin actions
  const [actionReason, setActionReason] = useState('Нарушение правил сервера');
  const [actionDuration, setActionDuration] = useState('3d');
  const [actionMinutes, setActionMinutes] = useState(30);
  const [actionAmount, setActionAmount] = useState(50000);
  const [actionItemId, setActionItemId] = useState('wpn_ak47');
  const [actionVehicleId, setActionVehicleId] = useState('veh_bmw_m5');
  const [actionAdminLevel, setActionAdminLevel] = useState<AdminLevel>(1);
  const [actionNewNick, setActionNewNick] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ success?: boolean; message?: string } | null>(
    null
  );

  const refreshAll = () => {
    const pList = playerService.getAllProfiles();
    setPlayers(pList);
    const lList = adminService.getAdminLogs();
    setAdminLogs(lList);
    const acList = antiCheatService.getEvents();
    setAcEvents(acList);
  };

  useEffect(() => {
    refreshAll();
  }, [user]);

  const handleExecuteAction = () => {
    if (!selectedPlayer) return;
    setActionFeedback(null);

    let res: { success: boolean; message: string } = { success: false, message: 'Неизвестное действие' };

    switch (actionType) {
      case 'ban':
        res = adminService.banPlayer(user, selectedPlayer.username, actionDuration, actionReason);
        break;
      case 'kick':
        res = adminService.kickPlayer(user, selectedPlayer.username, actionReason);
        break;
      case 'warn':
        res = adminService.warnPlayer(user, selectedPlayer.username, actionReason);
        break;
      case 'mute':
        res = adminService.mutePlayer(user, selectedPlayer.username, actionMinutes, actionReason);
        break;
      case 'givemoney':
        res = adminService.giveMoney(user, selectedPlayer.username, actionAmount);
        break;
      case 'giveitem':
        res = adminService.giveItem(user, selectedPlayer.username, actionItemId, 1);
        break;
      case 'givevehicle':
        res = adminService.giveVehicle(user, selectedPlayer.username, actionVehicleId);
        break;
      case 'setadmin':
        res = adminService.setAdminLevel(user, selectedPlayer.username, actionAdminLevel);
        break;
      case 'rename': {
        const r = playerService.changeUsername(selectedPlayer.id, actionNewNick);
        res = {
          success: r.success,
          message: r.success ? `Никнейм игрока успешно изменен на «${r.username}»` : (r.error || 'Ошибка смены никнейма'),
        };
        break;
      }
    }

    setActionFeedback(res);
    refreshAll();

    if (res.success) {
      setTimeout(() => {
        setActionType(null);
        setActionFeedback(null);
      }, 1800);
    }
  };

  const handleSimulateCheat = (cheatType: string) => {
    switch (cheatType) {
      case 'speedhack':
        antiCheatService.flagViolation(
          user.id,
          'impossible_speed',
          'high',
          'Аномальное перемещение (скорость 420 км/ч пешком)',
          20
        );
        break;
      case 'rapid_clicks':
        antiCheatService.flagViolation(
          user.id,
          'rapid_clicks',
          'medium',
          'Обнаружен автокликер: 35 кликов в секунду в меню магазина',
          12
        );
        break;
      case 'suspicious_balance':
        antiCheatService.flagViolation(
          user.id,
          'suspicious_balance',
          'critical',
          'Попытка инъекции отрицательного баланса ($ -999,999,999)',
          35
        );
        break;
      case 'burst_actions':
        antiCheatService.flagViolation(
          user.id,
          'abnormal_burst',
          'high',
          'Слишком высокая частота пакетов (50 пакетов за 1 сек)',
          18
        );
        break;
    }
    refreshAll();
  };

  const filteredPlayers = players.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleInfo = adminService.getAdminRoleInfo(user.admin_level);

  return (
    <div id="admin-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-950 border border-red-800/80 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-600/40">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white uppercase tracking-wider">
                Центр администрирования
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${roleInfo.badgeColor}`}>
                {roleInfo.name}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Управление игроками, логирование команд, античит и модерация сервера
            </p>
          </div>
        </div>

        <button
          onClick={refreshAll}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Обновить данные
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Обзор & Метрики
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'players'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Игроки ({players.length})
        </button>
        <button
          onClick={() => setActiveTab('anticheat')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'anticheat'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          Античит ({acEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Логи действий ({adminLogs.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Server Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Всего аккаунтов</span>
              <p className="text-xl font-black text-white font-mono">{players.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Заблокировано</span>
              <p className="text-xl font-black text-red-400 font-mono">
                {players.filter((p) => p.is_banned).length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">События античита</span>
              <p className="text-xl font-black text-amber-400 font-mono">{acEvents.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Действий в логах</span>
              <p className="text-xl font-black text-cyan-400 font-mono">{adminLogs.length}</p>
            </div>
          </div>

          {/* Admin Permissions & Role Info */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              Ваши административные привилегии (Уровень {user.admin_level})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { id: 'VIEW_PLAYERS', label: 'Просмотр игроков' },
                { id: 'WARN_PLAYER', label: 'Выдача варнов' },
                { id: 'MUTE_PLAYER', label: 'Заглушка чата (/mute)' },
                { id: 'KICK_PLAYER', label: 'Кик с сервера (/kick)' },
                { id: 'BAN_PLAYER', label: 'Бан аккаунтов (/ban)' },
                { id: 'VIEW_LOGS', label: 'Просмотр логов' },
                { id: 'VIEW_ANTICHEAT', label: 'Античит монитор' },
                { id: 'EDIT_ECONOMY', label: 'Выдача денег (/givemoney)' },
                { id: 'EDIT_INVENTORY', label: 'Выдача предметов (/giveitem)' },
                { id: 'EDIT_VEHICLES', label: 'Спавн транспорта (/givevehicle)' },
                { id: 'MANAGE_ADMINS', label: 'Назначение прав (/setadmin)' },
              ].map((perm) => {
                const has = adminService.hasPermission(user.admin_level, perm.id as any);
                return (
                  <div
                    key={perm.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      has
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                        : 'bg-zinc-950/50 border-zinc-900 text-zinc-600'
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 ${has ? 'text-emerald-400' : 'text-zinc-700'}`} />
                    <span>{perm.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Players Moderation Table */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск игрока по никнейму..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-500 uppercase text-[10px] font-black tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Игрок</th>
                    <th className="py-3.5 px-4">LVL / Деньги</th>
                    <th className="py-3.5 px-4">Роль</th>
                    <th className="py-3.5 px-4">Статус / Нарушения</th>
                    <th className="py-3.5 px-4">Подозрения</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredPlayers.map((p) => {
                    const role = ADMIN_ROLES[String(p.admin_level)] || ADMIN_ROLES['0'];
                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.avatar_url}
                              alt={p.username}
                              className="w-8 h-8 rounded-xl object-cover border border-zinc-700"
                            />
                            <div>
                              <strong className="text-white block">{p.username}</strong>
                              <span className="text-[10px] text-zinc-500 font-mono">{p.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold text-zinc-300">{p.level} LVL</span>
                            <p className="text-[11px] font-mono text-emerald-400 font-bold">
                              ${p.money.toLocaleString('ru')}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${role.badgeColor}`}>
                            {role.name}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {p.is_banned ? (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-black">
                              БАН: {p.ban_reason}
                            </span>
                          ) : p.is_muted ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-black">
                              МУТ
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400">Варны:</span>
                              <span className="font-bold text-amber-400">{p.warnings_count}/3</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              (p.suspicion_score || 0) > 30
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'text-zinc-400'
                            }`}
                          >
                            {p.suspicion_score || 0}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.is_banned ? (
                              <button
                                onClick={() => adminService.unbanPlayer(user, p.username)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 font-bold text-[11px] transition-colors"
                              >
                                Разбанить
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedPlayer(p);
                                    setActionType('warn');
                                  }}
                                  title="Выдать предупреждение"
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-950 text-amber-400 border border-zinc-700 transition-colors"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedPlayer(p);
                                    setActionType('mute');
                                  }}
                                  title="Заглушить (/mute)"
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-yellow-950 text-yellow-400 border border-zinc-700 transition-colors"
                                >
                                  <VolumeX className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedPlayer(p);
                                    setActionType('kick');
                                  }}
                                  title="Кикнуть с сервера"
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 border border-zinc-700 transition-colors"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedPlayer(p);
                                    setActionType('ban');
                                  }}
                                  title="Заблокировать аккаунт"
                                  className="p-1.5 rounded-lg bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 transition-colors"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedPlayer(p);
                                    setActionNewNick(p.username);
                                    setActionType('rename');
                                  }}
                                  title="Сменить никнейм игрока"
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {user.admin_level >= 4 && (
                              <button
                                onClick={() => {
                                  setSelectedPlayer(p);
                                  setActionType('givemoney');
                                }}
                                title="Выдать средства"
                                className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 transition-colors"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {user.admin_level === 5 && (
                              <button
                                onClick={() => {
                                  setSelectedPlayer(p);
                                  setActionType('setadmin');
                                }}
                                title="Назначить админ-ранг"
                                className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800 transition-colors"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Live Anti-Cheat Monitor & Simulator */}
      {activeTab === 'anticheat' && (
        <div className="space-y-6">
          {/* Anticheat Test Bench */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Тестовый стенд эмуляции читов (Anti-Cheat Validation Bench)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Проверьте реакцию ядра античита на перехват пакетов, спидхак и спам кликера
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleSimulateCheat('speedhack')}
                className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
              >
                <span className="text-xs font-bold text-amber-400 block">Эмуляция SpeedHack</span>
                <span className="text-[10px] text-zinc-500">+20 очков подозрения</span>
              </button>

              <button
                onClick={() => handleSimulateCheat('rapid_clicks')}
                className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
              >
                <span className="text-xs font-bold text-cyan-400 block">Эмуляция AutoClicker</span>
                <span className="text-[10px] text-zinc-500">+12 очков подозрения</span>
              </button>

              <button
                onClick={() => handleSimulateCheat('suspicious_balance')}
                className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
              >
                <span className="text-xs font-bold text-red-400 block">Инъекция баланса</span>
                <span className="text-[10px] text-zinc-500">+35 очков подозрения</span>
              </button>

              <button
                onClick={() => handleSimulateCheat('burst_actions')}
                className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
              >
                <span className="text-xs font-bold text-purple-400 block">Packet Flood (Burst)</span>
                <span className="text-[10px] text-zinc-500">+18 очков подозрения</span>
              </button>
            </div>
          </div>

          {/* Anti-Cheat Event Log */}
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Журнал срабатываний системы безопасности ({acEvents.length})
              </h4>
            </div>

            <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
              {acEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Срабатываний античита пока нет. Все игроки соблюдают правила.
                </div>
              ) : (
                acEvents.map((e) => (
                  <div key={e.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          e.severity === 'critical'
                            ? 'bg-red-950 text-red-400 border-red-800 animate-pulse'
                            : e.severity === 'high'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {e.severity}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-xs">{e.username}</strong>
                          <span className="text-[10px] font-mono text-zinc-500">({e.event_type})</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{e.details}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-black text-red-400">
                        +{e.suspicion_added} Suspicion
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(e.created_at).toLocaleTimeString('ru')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live Server Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Аудит административных команд и действий
            </h4>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto font-mono text-xs">
            {adminLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-zinc-800/30 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-black">
                      {log.action}
                    </span>
                    <strong className="text-zinc-200">{log.admin_name}</strong>
                    <span className="text-zinc-600">→</span>
                    <span className="text-white font-bold">{log.target_username}</span>
                  </div>

                  <p className="text-zinc-400 text-[11px]">{log.details}</p>
                  <p className="text-zinc-500 text-[10px] bg-zinc-950 px-2 py-0.5 rounded inline-block">
                    {log.command}
                  </p>
                </div>

                <div className="text-right shrink-0 text-[10px] text-zinc-500">
                  {new Date(log.created_at).toLocaleTimeString('ru')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Dialog Modal */}
      <AnimatePresence>
        {actionType && selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Действие над игроком: <span className="text-red-400">{selectedPlayer.username}</span>
                </h3>
              </div>

              {/* Action Form Inputs */}
              {actionType === 'ban' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Срок блокировки
                    </label>
                    <select
                      value={actionDuration}
                      onChange={(e) => setActionDuration(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                    >
                      <option value="1h">1 час</option>
                      <option value="1d">1 день</option>
                      <option value="3d">3 дня</option>
                      <option value="7d">7 дней</option>
                      <option value="30d">30 дней</option>
                      <option value="perm">Перманентно</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Причина блокировки
                    </label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {actionType === 'kick' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                    Причина кика
                  </label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>
              )}

              {actionType === 'warn' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                    Причина предупреждения (Варна)
                  </label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>
              )}

              {actionType === 'mute' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Срок заглушки (минут)
                    </label>
                    <input
                      type="number"
                      value={actionMinutes}
                      onChange={(e) => setActionMinutes(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Причина
                    </label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {actionType === 'givemoney' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                    Сумма выдачи ($)
                  </label>
                  <input
                    type="number"
                    value={actionAmount}
                    onChange={(e) => setActionAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono"
                  />
                </div>
              )}

              {actionType === 'setadmin' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                    Назначить уровень администрирования
                  </label>
                  <select
                    value={actionAdminLevel}
                    onChange={(e) => setActionAdminLevel(Number(e.target.value) as AdminLevel)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
                  >
                    <option value={0}>0 — Игрок</option>
                    <option value={1}>1 — Support (Помощник)</option>
                    <option value={2}>2 — Moderator (Модератор)</option>
                    <option value={3}>3 — Admin (Администратор)</option>
                    <option value={3.5}>3.5 — Tech Admin (Тех. Администратор)</option>
                    <option value={4}>4 — Senior Admin (Главный Администратор)</option>
                    <option value={5}>5 — Owner (Создатель)</option>
                  </select>
                </div>
              )}

              {actionType === 'rename' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Новый никнейм игрока (3-24 символа)
                    </label>
                    <input
                      type="text"
                      value={actionNewNick}
                      onChange={(e) => setActionNewNick(e.target.value)}
                      placeholder="Новый ник..."
                      maxLength={24}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Текущий ник: <strong className="text-zinc-300">{selectedPlayer.username}</strong>
                  </p>
                </div>
              )}

              {/* Feedback Alert */}
              {actionFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    actionFeedback.success
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}
                >
                  {actionFeedback.message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => setActionType(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleExecuteAction}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-950 transition-all"
                >
                  Применить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
