import React, { useState, useEffect } from 'react';
import { UserProfile, PlayerMission } from '../types';
import { missionService } from '../services/MissionService';
import {
  Target,
  Gift,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';

interface MissionsPageProps {
  user: UserProfile;
}

export const MissionsPage: React.FC<MissionsPageProps> = ({ user }) => {
  const [missions, setMissions] = useState<PlayerMission[]>([]);
  const [filter, setFilter] = useState<'all' | 'daily' | 'story' | 'weekly'>('all');

  const refreshMissions = () => {
    const list = missionService.getUserMissions(user.id);
    setMissions(list);
  };

  useEffect(() => {
    refreshMissions();
  }, [user]);

  const handleClaim = (misId: string) => {
    const res = missionService.claimReward(user.id, misId);
    if (res.success) {
      refreshMissions();
    }
  };

  const filteredMissions = missions.filter((m) => {
    if (filter === 'daily') return m.mission.type === 'daily';
    if (filter === 'story') return m.mission.type === 'story';
    if (filter === 'weekly') return m.mission.type === 'weekly';
    return true;
  });

  const completedCount = missions.filter((m) => m.is_completed || m.is_claimed).length;

  return (
    <div id="missions-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Ежедневные & Сюжетные Задания
            </h1>
            <p className="text-xs text-zinc-400">
              Выполняйте поручения синдиката и городские контракты для получения бонусов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Выполнено заданий: </span>
            <strong className="text-emerald-400 font-mono font-bold">
              {completedCount} / {missions.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Все ({missions.length})
        </button>
        <button
          onClick={() => setFilter('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'daily'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Ежедневные
        </button>
        <button
          onClick={() => setFilter('story')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'story'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Сюжетные
        </button>
        <button
          onClick={() => setFilter('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'weekly'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Еженедельные
        </button>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((pm) => {
          const m = pm.mission;
          const progressPercent = Math.min(
            100,
            Math.round((pm.progress / m.target_count) * 100)
          );
          const isReadyToClaim = pm.is_completed && !pm.is_claimed;

          return (
            <motion.div
              key={pm.id}
              whileHover={{ y: -2 }}
              className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                isReadyToClaim
                  ? 'bg-emerald-950/20 border-emerald-600/60 ring-1 ring-emerald-500/40'
                  : pm.is_claimed
                  ? 'bg-zinc-950/60 border-zinc-900 opacity-70'
                  : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      m.type === 'daily'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : m.type === 'story'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}
                  >
                    {(m.type || 'daily').toUpperCase()}
                  </span>

                  {pm.is_claimed ? (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Получено
                    </span>
                  ) : isReadyToClaim ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold animate-pulse">
                      Награда готова!
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {pm.progress} / {m.target_count}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-white">{m.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{m.description}</p>
              </div>

              {/* Rewards & Progress */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span>Прогресс задания</span>
                    <span className="font-bold text-white">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pm.is_completed ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rewards Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-black text-emerald-400">
                      +${m.reward_money.toLocaleString('ru')}
                    </span>
                    <span className="font-mono font-bold text-purple-400">
                      +{m.reward_xp} XP
                    </span>
                  </div>

                  {isReadyToClaim ? (
                    <button
                      onClick={() => handleClaim(pm.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      Забрать
                    </button>
                  ) : pm.is_claimed ? (
                    <span className="text-xs text-zinc-500 font-bold">Завершено</span>
                  ) : (
                    <span className="text-xs text-zinc-500">В процессе...</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
