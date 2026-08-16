import React, { useState, useEffect } from 'react';
import { UserProfile, Business } from '../types';
import { businessService } from '../services/BusinessService';
import {
  Building,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpCircle,
  Users,
  MapPin,
  CheckCircle,
  Shield,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface BusinessPageProps {
  user: UserProfile;
}

export const BusinessesPage: React.FC<BusinessPageProps> = ({ user }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filter, setFilter] = useState<'all' | 'my' | 'for_sale'>('all');

  const refreshBusinesses = () => {
    const list = businessService.getAllBusinesses();
    setBusinesses(list);
  };

  useEffect(() => {
    refreshBusinesses();
    // Live tick for passive profit counter
    const interval = setInterval(() => {
      refreshBusinesses();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleBuy = (bId: string) => {
    businessService.buyBusiness(user.id, bId);
    refreshBusinesses();
  };

  const handleUpgrade = (bId: string) => {
    businessService.upgradeBusiness(user.id, bId);
    refreshBusinesses();
  };

  const handleCollect = (bId: string) => {
    businessService.collectProfit(user.id, bId);
    refreshBusinesses();
  };

  const filteredBusinesses = businesses.filter((b) => {
    if (filter === 'my') return b.owner_id === user.id;
    if (filter === 'for_sale') return !b.owner_id;
    return true;
  });

  const totalHourlyIncome = businesses
    .filter((b) => b.owner_id === user.id)
    .reduce((acc, b) => acc + (b.hourly_profit - b.hourly_expenses), 0);

  const totalReadyToCollect = businesses
    .filter((b) => b.owner_id === user.id)
    .reduce((acc, b) => acc + (b.current_storage || 0), 0);

  return (
    <div id="businesses-page" className="space-y-6 pb-12">
      {/* Header Banner & Enterprise Summary */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Бизнес & Коммерческая недвижимость
            </h1>
            <p className="text-xs text-zinc-400">
              Покупка коммерческих точек, пассивный доход и управление предприятиями
            </p>
          </div>
        </div>

        {/* Enterprise Income Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Пассивный доход / час</span>
            <p className="text-sm font-black text-emerald-400 font-mono">
              +${totalHourlyIncome.toLocaleString('ru')} / ч
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">К инкассации</span>
            <p className="text-sm font-black text-cyan-400 font-mono">
              ${totalReadyToCollect.toLocaleString('ru')}
            </p>
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
          Все предприятия ({businesses.length})
        </button>
        <button
          onClick={() => setFilter('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'my'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Мои бизнесы ({businesses.filter((b) => b.owner_id === user.id).length})
        </button>
        <button
          onClick={() => setFilter('for_sale')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'for_sale'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          В свободной продаже ({businesses.filter((b) => !b.owner_id).length})
        </button>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((b) => {
          const isOwner = b.owner_id === user.id;
          const isOwnedByOther = Boolean(b.owner_id && !isOwner);
          const canAfford = user.bank_money >= b.price;
          const upgradeCost = Math.floor(b.price * 0.35 * b.level);
          const canAffordUpgrade = user.bank_money >= upgradeCost;
          const fillPercent = Math.min(100, Math.round(((b.current_storage || 0) / b.max_storage) * 100));

          return (
            <motion.div
              key={b.id}
              whileHover={{ y: -3 }}
              className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-5 transition-all ${
                isOwner
                  ? 'border-emerald-600/80 bg-zinc-900/95 ring-1 ring-emerald-600/50'
                  : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                {/* Top Badge: Type & Ownership */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-black uppercase">
                    {(b.type || 'business').toUpperCase()} • LVL {b.level}/5
                  </span>

                  {isOwner ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      Владелец: Вы
                    </span>
                  ) : isOwnedByOther ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold">
                      Владелец: {b.owner_name}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                      Свободен
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-white">{b.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{b.description}</p>
                <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500" />
                  {b.location}
                </p>
              </div>

              {/* Business Finance Indicators */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Чистый доход</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      +${(b.hourly_profit - b.hourly_expenses).toLocaleString('ru')} / ч
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Штат сотрудников</span>
                    <span className="font-bold text-zinc-200 font-mono">{b.employees_count} чел.</span>
                  </div>
                </div>

                {/* Storage & Income Vault (If owned by player) */}
                {isOwner && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Касса предприятия</span>
                      <span className="font-black text-emerald-400 font-mono">
                        ${(b.current_storage || 0).toLocaleString('ru')} / ${b.max_storage.toLocaleString('ru')}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleCollect(b.id)}
                        disabled={(b.current_storage || 0) <= 0}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Снять кассу
                      </button>

                      {b.level < 5 && (
                        <button
                          onClick={() => handleUpgrade(b.id)}
                          disabled={!canAffordUpgrade}
                          title={`Стоимость улучшения: $${upgradeCost.toLocaleString('ru')}`}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-600 text-zinc-300 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5 text-cyan-400" />
                          Апгрейд (${(upgradeCost / 1000).toFixed(0)}k)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Purchase Button (If not owned) */}
                {!b.owner_id && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Гос. стоимость:</span>
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        ${b.price.toLocaleString('ru')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBuy(b.id)}
                      disabled={!canAfford}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      {canAfford ? 'Купить предприятие' : 'Недостаточно средств в банке'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
