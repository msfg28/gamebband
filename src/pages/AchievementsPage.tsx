import React, { useState, useEffect } from 'react';
import { UserProfile, PlayerAchievement } from '../types';
import { achievementService } from '../services/AchievementService';
import {
  Trophy,
  Award,
  Lock,
  Unlock,
  CheckCircle,
  Sparkles,
  DollarSign,
  TrendingUp,
  Star,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AchievementsPageProps {
  user: UserProfile;
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ user }) => {
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);

  const refreshAchievements = () => {
    achievementService.checkAchievements(user.id);
    const list = achievementService.getUserAchievements(user.id);
    setAchievements(list);
  };

  useEffect(() => {
    refreshAchievements();
  }, [user]);

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;

  return (
    <div id="achievements-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Достижения & Трофеи
            </h1>
            <p className="text-xs text-zinc-400">
              Личные рекорды криминального мира и денежные бонусы за прогресс
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Открыто трофеев: </span>
            <strong className="text-amber-400 font-mono font-bold">
              {unlockedCount} / {achievements.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((pa) => {
          const ach = pa.achievement;
          const isUnlocked = pa.is_unlocked;
          const progressPercent = Math.min(
            100,
            Math.round((pa.current_progress / ach.condition_value) * 100)
          );

          return (
            <motion.div
              key={ach.id}
              whileHover={{ y: -3 }}
              className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                isUnlocked
                  ? 'bg-zinc-900/95 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-zinc-950/70 border-zinc-800/80 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-3 rounded-2xl border ${
                      isUnlocked
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                    }`}
                  >
                    {isUnlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  {isUnlocked ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-black uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Разблокировано
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] font-bold">
                      Заблокировано
                    </span>
                  )}
                </div>

                <h3 className={`text-base font-black ${isUnlocked ? 'text-white' : 'text-zinc-400'}`}>
                  {ach.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{ach.description}</p>
              </div>

              {/* Progress & Bonus */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                {!isUnlocked && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1">
                      <span>Прогресс:</span>
                      <span>
                        {pa.current_progress} / {ach.condition_value}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400">
                      +${ach.reward_money.toLocaleString('ru')}
                    </span>
                    <span className="font-mono font-bold text-purple-400">
                      +{ach.reward_xp} XP
                    </span>
                  </div>

                  {isUnlocked && pa.unlocked_at && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(pa.unlocked_at).toLocaleDateString('ru')}
                    </span>
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
