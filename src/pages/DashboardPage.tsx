import React, { useState, useEffect } from 'react';
import { UserProfile, PlayerVehicle, PlayerMission, Transaction, ActiveJobShift } from '../types';
import { vehicleService } from '../services/VehicleService';
import { missionService } from '../services/MissionService';
import { inventoryService } from '../services/InventoryService';
import { jobService } from '../services/JobService';
import { dbEngine } from '../lib/storageEngine';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Car,
  Briefcase,
  Target,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Fuel,
  Wrench,
  Award,
  Zap,
  ShoppingBag,
  Users,
  Dices,
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardPageProps {
  user: UserProfile;
  onNavigate: (page: string) => void;
  onOpenBank: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onNavigate, onOpenBank }) => {
  const [vehicles, setVehicles] = useState<PlayerVehicle[]>([]);
  const [missions, setMissions] = useState<PlayerMission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveJobShift | null>(null);
  const [shiftCountdown, setShiftCountdown] = useState<number>(0);

  useEffect(() => {
    const vList = vehicleService.getUserVehicles(user.id);
    setVehicles(vList);

    const mList = missionService.getUserMissions(user.id);
    setMissions(mList);

    const txList = dbEngine.getState().transactions.filter((t) => t.user_id === user.id);
    setTransactions(txList.slice(0, 8));

    const curShift = jobService.getActiveShift(user.id);
    setActiveShift(curShift);
  }, [user]);

  // Live countdown timer for active job
  useEffect(() => {
    if (!activeShift) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const remain = Math.max(0, Math.ceil((activeShift.endsAt - now) / 1000));
      setShiftCountdown(remain);
      if (remain === 0 && !activeShift.isReadyToClaim) {
        setActiveShift({ ...activeShift, isReadyToClaim: true });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const activeVehicle = vehicles.find((v) => v.id === user.active_vehicle_id) || vehicles[0];
  const curWeight = inventoryService.getCurrentWeight(user.id);
  const maxWeight = inventoryService.getMaxWeight(user.id);
  const weightPercent = Math.min(100, Math.round((curWeight / maxWeight) * 100));

  const handleClaimMission = (missionId: string) => {
    missionService.claimReward(user.id, missionId);
    setMissions(missionService.getUserMissions(user.id));
  };

  const handleCompleteShift = () => {
    const res = jobService.completeJobShift(user.id);
    if (res.success) {
      setActiveShift(null);
    }
  };

  return (
    <div id="dashboard-page" className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-950 border border-red-900/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/50 text-[11px] font-black uppercase tracking-widest text-red-300">
                BANDIT ROLEPLAY NETWORK
              </span>
              <span className="text-xs text-zinc-400">ID: {user.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Добро пожаловать, <span className="text-red-500">{user.username}</span>
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 max-w-xl leading-relaxed">
              «{user.status || 'Криминальный авторитет в поисках новых вершин'}»
            </p>
          </div>

          {/* Quick Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-jobs-btn"
              onClick={() => onNavigate('jobs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950 transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>Начать работу</span>
            </button>
            <button
              id="dash-casino-btn"
              onClick={() => onNavigate('casino')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-amber-950/80 transition-all"
            >
              <Dices className="w-4 h-4 text-amber-200" />
              <span>Казино Royal 777</span>
            </button>
            <button
              id="dash-upgrades-btn"
              onClick={() => onNavigate('upgrades')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-colors"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Прокачка</span>
            </button>
            <button
              id="dash-bank-btn"
              onClick={onOpenBank}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Банкинг</span>
            </button>
            <button
              id="dash-shop-btn"
              onClick={() => onNavigate('shop')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-yellow-400" />
              <span>Арсенал</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
      </div>

      {/* Main Economy & Resource Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Наличные</span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              ${user.money.toLocaleString('ru')}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Доступно для мгновенных покупок</p>
          </div>
        </div>

        {/* Bank Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Банковский счет</span>
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-400 tracking-tight">
              ${user.bank_money.toLocaleString('ru')}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Защищено от грабежей</p>
          </div>
        </div>

        {/* Total Net Worth */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Общий капитал</span>
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/80">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300 tracking-tight">
              ${(user.money + user.bank_money).toLocaleString('ru')}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Заработано: ${user.total_earned.toLocaleString('ru')}</p>
          </div>
        </div>

        {/* Backpack Weight Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Инвентарь</span>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[11px] font-bold text-red-400 hover:underline"
            >
              Открыть
            </button>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-lg font-black text-white">
                {curWeight} <span className="text-xs font-normal text-zinc-400">/ {maxWeight} кг</span>
              </span>
              <span className="text-xs font-bold text-zinc-400">{weightPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  weightPercent > 90 ? 'bg-red-500' : weightPercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${weightPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Active Job Widget & Active Vehicle Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Job / Shift Status */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Текущая деятельность & Работа
                  </h3>
                  <p className="text-xs text-zinc-400">Заказы в реальном времени</p>
                </div>
              </div>
              {activeShift && (
                <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[11px] font-bold animate-pulse">
                  В пути
                </span>
              )}
            </div>

            {activeShift ? (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Активный заказ: {activeShift.jobId.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{activeShift.targetObjective}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Клиент: {activeShift.passengerOrCargo}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400">
                      +${activeShift.payoutMoney.toLocaleString('ru')}
                    </span>
                    <p className="text-[10px] text-zinc-400">+{activeShift.payoutXp} XP</p>
                  </div>
                </div>

                {/* Progress countdown bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1 font-mono">
                    <span>
                      {shiftCountdown > 0 ? `Прибытие через: ${shiftCountdown} сек.` : 'Маршрут пройден!'}
                    </span>
                    <span>{shiftCountdown === 0 ? 'ГОТОВО' : `${shiftCountdown}s`}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
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

                {shiftCountdown === 0 ? (
                  <button
                    onClick={handleCompleteShift}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Забрать оплату (${activeShift.payoutMoney})
                  </button>
                ) : (
                  <button
                    onClick={() => jobService.cancelShift(user.id)}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold transition-colors"
                  >
                    Отменить заказ
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-400 mb-3">
                  В данный момент вы свободны. Возьмите смену в такси, грузоперевозках или доставке, чтобы заработать денег.
                </p>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Выбрать работу
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Vehicle Status */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Основной автомобиль</h3>
                  <p className="text-xs text-zinc-400">Гараж и состояние транспорта</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('vehicles')}
                className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1"
              >
                Гараж ({vehicles.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeVehicle ? (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {activeVehicle.custom_name || activeVehicle.vehicle.name}
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] font-bold text-zinc-200 tracking-wider">
                      [{activeVehicle.license_plate}]
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-300">
                      Класс: {(activeVehicle.vehicle.type || 'car').toUpperCase()}
                    </span>
                    <p className="text-[11px] text-red-400 font-semibold">
                      Макс. {activeVehicle.vehicle.speed} км/ч
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Fuel className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Топливо</span>
                      <p className="text-xs font-bold text-zinc-200">{activeVehicle.fuel}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Состояние</span>
                      <p className="text-xs font-bold text-zinc-200">{activeVehicle.durability}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-400 mb-3">
                  У вас пока нет личного автомобиля. Посетите автосалон BANDIT для покупки.
                </p>
                <button
                  onClick={() => onNavigate('vehicles')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <Car className="w-3.5 h-3.5" />
                  Перейти в автосалон
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Tasks & Recent Financial Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Missions Progress */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Ежедневные задания</h3>
                <p className="text-xs text-zinc-400">Выполняйте задания для получения наличных и опыта</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('missions')}
              className="text-xs font-bold text-red-400 hover:underline"
            >
              Все ({missions.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {missions.slice(0, 3).map((pm) => {
              const mission = pm.mission;
              const percent = Math.min(100, Math.round((pm.progress / mission.target_count) * 100));
              return (
                <div
                  key={pm.id}
                  className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-200">{mission.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-400">
                        {mission.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mb-1.5">{mission.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {pm.progress}/{mission.target_count}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-emerald-400">
                      +${mission.reward_money.toLocaleString('ru')}
                    </span>
                    {pm.is_completed && !pm.is_claimed ? (
                      <button
                        onClick={() => handleClaimMission(pm.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950 transition-all"
                      >
                        Забрать
                      </button>
                    ) : pm.is_claimed ? (
                      <span className="text-[10px] font-bold text-zinc-500">Получено</span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500">{percent}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">История операций</h3>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Live Audit</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Операций пока нет</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-zinc-200 truncate">{tx.description}</p>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.currency === 'cash' ? 'Наличные' : 'Банк'}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold shrink-0 ${
                      tx.type === 'purchase' ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'purchase' ? '-' : '+'}${tx.amount.toLocaleString('ru')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
