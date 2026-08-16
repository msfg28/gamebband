import React, { useState, useEffect } from 'react';
import { UserProfile, PlayerVehicle, Vehicle, VehicleUpgradeLevels } from '../types';
import { vehicleService } from '../services/VehicleService';
import {
  Car,
  Fuel,
  Wrench,
  Gauge,
  Shield,
  Zap,
  Palette,
  Edit2,
  DollarSign,
  CheckCircle,
  Plus,
  ShoppingBag,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';

interface VehiclesPageProps {
  user: UserProfile;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'garage' | 'dealership'>('garage');
  const [userVehicles, setUserVehicles] = useState<PlayerVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<PlayerVehicle | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [renameMode, setRenameMode] = useState<boolean>(false);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<'cash' | 'bank'>('bank');

  const refreshVehicles = () => {
    const list = vehicleService.getUserVehicles(user.id);
    setUserVehicles(list);
    if (selectedVehicle) {
      const updated = list.find((v) => v.id === selectedVehicle.id);
      setSelectedVehicle(updated || list[0] || null);
    } else if (list.length > 0) {
      const active = list.find((v) => v.is_active) || list[0];
      setSelectedVehicle(active);
    }
  };

  useEffect(() => {
    refreshVehicles();
  }, [user]);

  const catalog = vehicleService.getAllCatalogVehicles();

  const handleSetActive = (vId: string) => {
    vehicleService.setActiveVehicle(user.id, vId);
    refreshVehicles();
  };

  const handleSell = (vId: string) => {
    if (confirm('Вы уверены, что хотите продать данный автомобиль за 70% стоимости?')) {
      vehicleService.sellVehicle(user.id, vId);
      refreshVehicles();
    }
  };

  const handleUpgrade = (type: keyof Omit<VehicleUpgradeLevels, 'color'>) => {
    if (!selectedVehicle) return;
    vehicleService.upgradeVehicleTuning(user.id, selectedVehicle.id, type);
    refreshVehicles();
  };

  const handleRepaint = (color: string) => {
    if (!selectedVehicle) return;
    vehicleService.repaintVehicle(user.id, selectedVehicle.id, color);
    refreshVehicles();
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !customName.trim()) return;
    vehicleService.renameVehicle(user.id, selectedVehicle.id, customName);
    setRenameMode(false);
    refreshVehicles();
  };

  const handleBuyVehicle = (vId: string) => {
    const res = vehicleService.buyVehicle(user.id, vId, buyPaymentMethod);
    if (res.success) {
      setActiveTab('garage');
      refreshVehicles();
    }
  };

  const colors = [
    '#18181b', // Obsidian Black
    '#dc2626', // Crimson Red
    '#2563eb', // Royal Blue
    '#16a34a', // Racing Green
    '#eab308', // Cyber Yellow
    '#9333ea', // Deep Purple
    '#fafafa', // Pearl White
  ];

  return (
    <div id="vehicles-page" className="space-y-6 pb-12">
      {/* Top Banner & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/30">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Транспорт & Гараж
            </h1>
            <p className="text-xs text-zinc-400">
              Покупка, тюнинг деталей, покраска и управление автопарком
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 shrink-0">
          <button
            id="tab-garage-btn"
            onClick={() => setActiveTab('garage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'garage'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Мой гараж ({userVehicles.length})
          </button>
          <button
            id="tab-dealership-btn"
            onClick={() => setActiveTab('dealership')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dealership'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Автосалон BANDIT
          </button>
        </div>
      </div>

      {/* TAB 1: GARAGE */}
      {activeTab === 'garage' && (
        <div className="space-y-6">
          {userVehicles.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-dashed border-zinc-800">
              <Car className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">В вашем гараже пусто</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-4">
                У вас нет зарегистрированных автомобилей. Перейдите во вкладку автосалона для выбора первой машины.
              </p>
              <button
                onClick={() => setActiveTab('dealership')}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
              >
                Открыть Автосалон
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Vehicles List */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                  Список ваших авто
                </h3>
                <div className="space-y-2.5">
                  {userVehicles.map((pv) => {
                    const isSelected = selectedVehicle?.id === pv.id;
                    return (
                      <div
                        key={pv.id}
                        onClick={() => {
                          setSelectedVehicle(pv);
                          setCustomName(pv.custom_name);
                        }}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-red-500 bg-zinc-900 shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                            style={{
                              backgroundColor: pv.upgrades.color || '#18181b',
                              borderColor: '#3f3f46',
                            }}
                          >
                            <Car className="w-5 h-5 text-white drop-shadow" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">
                              {pv.custom_name || pv.vehicle.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-zinc-300 font-bold">
                                [{pv.license_plate}]
                              </span>
                              <span className="text-[10px] text-zinc-500 capitalize">
                                {pv.vehicle.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {pv.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            Активен
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetActive(pv.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                          >
                            Выбрать
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Tuning & Workshop */}
              <div className="lg:col-span-7">
                {selectedVehicle && (
                  <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                      <div>
                        {renameMode ? (
                          <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-sm font-bold text-white"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="px-3 py-1 rounded-lg bg-red-600 text-xs font-bold text-white"
                            >
                              OK
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-white">
                              {selectedVehicle.custom_name || selectedVehicle.vehicle.name}
                            </h2>
                            <button
                              onClick={() => {
                                setRenameMode(true);
                                setCustomName(selectedVehicle.custom_name);
                              }}
                              className="p-1 text-zinc-500 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Гос. номер: [{selectedVehicle.license_plate}] • Приобретен:{' '}
                          {new Date(selectedVehicle.purchased_at).toLocaleDateString('ru')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSell(selectedVehicle.id)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-800 hover:text-red-400 text-xs font-bold text-zinc-400 transition-colors"
                        >
                          Продать (${Math.floor(selectedVehicle.vehicle.price * 0.7).toLocaleString('ru')})
                        </button>
                      </div>
                    </div>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Скорость</span>
                        <p className="text-sm font-bold text-red-400 mt-0.5">
                          {selectedVehicle.vehicle.max_speed + selectedVehicle.upgrades.engine * 8} км/ч
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Топливо</span>
                        <p className="text-sm font-bold text-amber-400 mt-0.5">{selectedVehicle.fuel}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Прочность</span>
                        <p className="text-sm font-bold text-emerald-400 mt-0.5">{selectedVehicle.durability}%</p>
                      </div>
                    </div>

                    {/* Tuning Upgrades Station */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-red-500" />
                          Тюнинг-мастерская деталей (Уровни 0 - 5)
                        </h3>
                        <span className="text-[11px] text-zinc-500 font-semibold">Оплата наличными</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'engine', label: 'Двигатель (Stage)', icon: Gauge },
                          { key: 'turbo', label: 'Турбонаддув (Turbo)', icon: Zap },
                          { key: 'brakes', label: 'Тормозная система', icon: RotateCcw },
                          { key: 'handling', label: 'Подвеска & Сцепление', icon: Wrench },
                          { key: 'armor', label: 'Бронирование кузова', icon: Shield },
                        ].map((part) => {
                          const lvl = selectedVehicle.upgrades[part.key as keyof Omit<VehicleUpgradeLevels, 'color'>] || 0;
                          const cost = Math.floor(selectedVehicle.vehicle.price * 0.08 * (lvl + 1));
                          const PartIcon = part.icon;
                          return (
                            <div
                              key={part.key}
                              className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                                  <PartIcon className="w-4 h-4 text-red-400" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-white">{part.label}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((step) => (
                                      <div
                                        key={step}
                                        className={`w-3.5 h-1.5 rounded-sm ${
                                          step <= lvl ? 'bg-red-500' : 'bg-zinc-800'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {lvl >= 5 ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded">
                                  MAX
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleUpgrade(part.key as keyof Omit<VehicleUpgradeLevels, 'color'>)
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold transition-colors"
                                >
                                  +${cost.toLocaleString('ru')}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paint Booth */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-red-500" />
                          Покрасочная камера ($2,500)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {colors.map((c) => (
                          <button
                            key={c}
                            onClick={() => handleRepaint(c)}
                            className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                              selectedVehicle.upgrades.color === c ? 'scale-110 border-white' : 'border-zinc-800'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEALERSHIP CATALOG */}
      {activeTab === 'dealership' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-300">
              Выберите способ списания средств при покупке в автосалоне:
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuyPaymentMethod('bank')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  buyPaymentMethod === 'bank'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Со счета в банке (${user.bank_money.toLocaleString('ru')})
              </button>
              <button
                onClick={() => setBuyPaymentMethod('cash')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  buyPaymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Наличными (${user.money.toLocaleString('ru')})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map((v) => {
              const canAfford =
                (buyPaymentMethod === 'cash' ? user.money : user.bank_money) >= v.price;
              return (
                <div
                  key={v.id}
                  className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-800 text-[10px] font-black uppercase">
                        {v.type}
                      </span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        ${v.price.toLocaleString('ru')}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">{v.name}</h3>
                  </div>

                  {/* Quick specs */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Скорость</span>
                      <span className="font-bold text-white">{v.speed} км/ч</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Ускорение</span>
                      <span className="font-bold text-amber-400">{v.acceleration}s</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Багажник</span>
                      <span className="font-bold text-cyan-400">{v.trunk_capacity} кг</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyVehicle(v.id)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {canAfford ? 'Купить в гараж' : 'Недостаточно средств'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
