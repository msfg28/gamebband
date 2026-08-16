import React, { useState, useEffect } from 'react';
import { UserProfile, Job, JobType, ActiveJobShift } from '../types';
import { jobService } from '../services/JobService';
import {
  Briefcase,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Play,
  XCircle,
  Navigation,
  Award,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobsPageProps {
  user: UserProfile;
}

export const JobsPage: React.FC<JobsPageProps> = ({ user }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveJobShift | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const refreshJobState = () => {
    const list = jobService.getJobsCatalog();
    setJobs(list);
    const shift = jobService.getActiveShift(user.id);
    setActiveShift(shift);
    if (!selectedJob && list.length > 0) {
      setSelectedJob(list[0]);
    }
  };

  useEffect(() => {
    refreshJobState();
  }, [user]);

  // Live timer countdown
  useEffect(() => {
    if (!activeShift) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const remain = Math.max(0, Math.ceil((activeShift.endsAt - now) / 1000));
      setCountdown(remain);
      if (remain === 0 && !activeShift.isReadyToClaim) {
        setActiveShift({ ...activeShift, isReadyToClaim: true });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const handleStartShift = (jobId: JobType) => {
    const res = jobService.startJobShift(user.id, jobId);
    if (res.success && res.shift) {
      setActiveShift(res.shift);
    }
  };

  const handleCompleteShift = () => {
    const res = jobService.completeJobShift(user.id);
    if (res.success) {
      setActiveShift(null);
    }
  };

  const handleCancelShift = () => {
    if (confirm('Вы уверены, что хотите сойти с маршрута и отменить смену?')) {
      jobService.cancelShift(user.id);
      setActiveShift(null);
    }
  };

  const activeJobData = activeShift ? jobs.find((j) => j.id === activeShift.jobId) : null;

  return (
    <div id="jobs-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Биржа труда & Заказы
            </h1>
            <p className="text-xs text-zinc-400">
              Легальный заработок, грузоперевозки, частный извоз и сервис
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Уровень персонажа: </span>
            <strong className="text-red-400 font-bold">{user.level} LVL</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Заработано на работах: </span>
            <strong className="text-emerald-400 font-mono font-bold">
              ${user.total_earned.toLocaleString('ru')}
            </strong>
          </div>
        </div>
      </div>

      {/* Active Shift Tracking Live Bar (If any shift is in progress) */}
      <AnimatePresence>
        {activeShift && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-950 border border-amber-700/60 shadow-2xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 animate-pulse">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-black uppercase">
                      Активная смена: {(activeShift.jobId || 'job').toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-300 font-bold">
                      {activeShift.targetObjective}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Пассажир / Контракт: <strong className="text-white">{activeShift.passengerOrCargo}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    +${activeShift.payoutMoney.toLocaleString('ru')}
                  </span>
                  <p className="text-[10px] text-zinc-400 font-semibold">+{activeShift.payoutXp} XP</p>
                </div>
              </div>
            </div>

            {/* Live Progress Bar & Timers */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {countdown > 0
                    ? `Ориентировочное время прибытия: ${countdown} сек.`
                    : 'Маршрут успешно пройден! Заказ доставлен.'}
                </span>
                <span className="font-bold">
                  {countdown > 0 ? `${countdown}s` : 'ГОТОВО К ВЫПЛАТЕ'}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    countdown === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((Date.now() - activeShift.startedAt) /
                          (activeShift.endsAt - activeShift.startedAt)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleCancelShift}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Сойти с маршрута
              </button>

              {countdown === 0 && (
                <button
                  onClick={handleCompleteShift}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Получить зарплату (${activeShift.payoutMoney})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jobs Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => {
          const isLocked = user.level < job.min_level;
          const cdRemaining = jobService.getCooldownRemaining(user.id, job.id);
          const isCurrentActive = activeShift?.jobId === job.id;
          const hasOtherActive = activeShift && !isCurrentActive;

          return (
            <motion.div
              key={job.id}
              whileHover={{ y: -3 }}
              className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                isCurrentActive
                  ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-red-500">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  {isLocked ? (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase border border-zinc-700">
                      Нужен {job.min_level} LVL
                    </span>
                  ) : cdRemaining > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-amber-400 text-[10px] font-bold uppercase border border-zinc-700 font-mono">
                      Кулдаун: {cdRemaining}s
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-800">
                      Доступно
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-white">{job.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{job.description}</p>
              </div>

              {/* Stats Bar */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Оплата</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      ${job.base_pay.toLocaleString('ru')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Опыт</span>
                    <span className="font-bold text-purple-400 font-mono">+{job.base_xp} XP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Смена</span>
                    <span className="font-bold text-zinc-300 font-mono">
                      {job.shift_duration_seconds} сек.
                    </span>
                  </div>
                </div>

                {/* Dispatch Button */}
                <button
                  onClick={() => handleStartShift(job.id)}
                  disabled={Boolean(isLocked || cdRemaining > 0 || hasOtherActive || isCurrentActive)}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    isCurrentActive
                      ? 'bg-amber-600 text-white cursor-default'
                      : !isLocked && cdRemaining === 0 && !activeShift
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  {isCurrentActive
                    ? 'Смена выполняется'
                    : isLocked
                    ? `Требуется ${job.min_level} уровень`
                    : cdRemaining > 0
                    ? `Перезарядка (${cdRemaining}с)`
                    : hasOtherActive
                    ? 'Другая смена активна'
                    : 'Начать рабочую смену'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
