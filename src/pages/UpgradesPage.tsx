import React, { useState, useEffect } from 'react';
import { UserProfile, PlayerStatUpgrade } from '../types';
import { upgradeService } from '../services/UpgradeService';
import {
  Zap,
  Shield,
  Briefcase,
  TrendingUp,
  DollarSign,
  Heart,
  Package,
  Activity,
  Award,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { motion } from 'motion/react';

interface UpgradesPageProps {
  user: UserProfile;
  onOpenBank?: () => void;
}

export const UpgradesPage: React.FC<UpgradesPageProps> = ({ user, onOpenBank }) => {
  const [upgrades, setUpgrades] = useState<PlayerStatUpgrade[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const refreshUpgrades = () => {
    const list = upgradeService.getUserUpgrades(user.id);
    setUpgrades(list);
  };

  useEffect(() => {
    refreshUpgrades();
  }, [user]);

  const handleUpgrade = (upgradeId: string) => {
    const res = upgradeService.purchaseUpgrade(user.id, upgradeId);
    if (res.success) {
      refreshUpgrades();
    }
  };

  const getUpgradeIcon = (upg: PlayerStatUpgrade) => {
    switch (upg.id) {
      case 'upg_inventory_cap':
        return Package;
      case 'upg_job_bonus':
        return TrendingUp;
      case 'upg_casino_luck':
        return Sparkles;
      case 'upg_speed_agility':
        return Zap;
      case 'upg_armor_defense':
        return Shield;
      case 'upg_discount_perk':
        return DollarSign;
      case 'upg_biz_mastery':
        return Briefcase;
      default:
        return Zap;
    }
  };

  const filteredUpgrades = upgrades.filter((u) => {
    if (selectedCategory === 'all') return true;
    return u.category === selectedCategory;
  });

  return (
    <div id="upgrades-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-inner">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white uppercase tracking-wider">
                Прокачка навыков & Перки
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black uppercase">
                RP Stats
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Увеличивайте вместимость инвентаря, бонусы к зарплатам, удачу в казино и стойкость персонажа
            </p>
          </div>
        </div>

        {/* Balances & Banking */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Наличные средства</span>
            <strong className="text-emerald-400 font-mono text-sm font-black">
              ${user.money.toLocaleString('ru')}
            </strong>
          </div>

          {onOpenBank && (
            <button
              onClick={onOpenBank}
              className="px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-800/40 text-xs font-bold transition-all"
            >
              Снять из Банка
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Все навыки' },
          { id: 'earning', label: '💰 Доход & Удача' },
          { id: 'inventory', label: '🎒 Инвентарь & Скидки' },
          { id: 'speed', label: '⚡ Скорость & Выносливость' },
          { id: 'armor', label: '🛡️ Стойкость' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUpgrades.map((upg) => {
          const Icon = getUpgradeIcon(upg);
          const isMax = upg.current_level >= upg.max_level;
          const nextLevel = upg.current_level + 1;
          const cost = upgradeService.getUpgradeCost(upg);
          const canAfford = user.money >= cost;
          const missingAmount = Math.max(0, cost - user.money);

          return (
            <motion.div
              key={upg.id}
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isMax
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950/40 text-amber-400 border-amber-800/80'
                    }`}
                  >
                    Уровень {upg.current_level} / {upg.max_level}
                  </span>
                </div>

                <h3 className="text-base font-black text-white">{upg.name}</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{upg.description}</p>

                {/* Perk Effect Badge */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-amber-300 font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{upg.effect_per_level}</span>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-zinc-800/80">
                {/* Level Pip Indicators */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-semibold">
                    <span>Прогресс изучения:</span>
                    <span className="text-zinc-200">
                      {Math.round((upg.current_level / upg.max_level) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: upg.max_level }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 flex-1 rounded-full transition-all ${
                          idx < upg.current_level
                            ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Buy / Max Action */}
                {isMax ? (
                  <div className="w-full py-3.5 rounded-2xl bg-zinc-950 border border-emerald-900/40 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Максимальный уровень изучен
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Cost breakdown card */}
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          Стоимость для {nextLevel} LVL:
                        </span>
                        <span className="font-black text-emerald-400 font-mono text-sm">
                          ${cost.toLocaleString('ru')}
                        </span>
                      </div>

                      {!canAfford && (
                        <span className="text-[10px] text-red-400 font-semibold bg-red-950/60 px-2 py-1 rounded border border-red-900/60">
                          Не хватает ${missingAmount.toLocaleString('ru')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleUpgrade(upg.id)}
                      disabled={!canAfford}
                      className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-950 active:scale-[0.98]'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      {canAfford
                        ? `Прокачать навык ($${cost.toLocaleString('ru')})`
                        : `Недостаточно средств ($${cost.toLocaleString('ru')})`}
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
