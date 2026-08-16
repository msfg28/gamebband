import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  casinoService,
  SlotResult,
  RouletteBetItem,
  RouletteResult,
  BlackjackState,
  DiceResult,
  WheelPrize,
  WHEEL_PRIZES,
} from '../services/CasinoService';
import { upgradeService } from '../services/UpgradeService';
import { audioService } from './../services/AudioService';
import {
  Sparkles,
  Dices,
  Crown,
  Trophy,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Volume2,
  HelpCircle,
  Zap,
  Flame,
  Award,
  CircleDot,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CasinoPageProps {
  user: UserProfile;
  onOpenBank?: () => void;
}

type CasinoTab = 'slots' | 'roulette' | 'blackjack' | 'dice' | 'wheel';

const ROULETTE_RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const CasinoPage: React.FC<CasinoPageProps> = ({ user, onOpenBank }) => {
  const [activeTab, setActiveTab] = useState<CasinoTab>('slots');
  const [luckLevel, setLuckLevel] = useState(0);

  // --- SLOTS STATE ---
  const [slotBet, setSlotBet] = useState(1000);
  const [isSpinningSlots, setIsSpinningSlots] = useState(false);
  const [slotReels, setSlotReels] = useState<[string, string, string]>(['💎', '7️⃣', '💎']);
  const [slotResult, setSlotResult] = useState<SlotResult | null>(null);

  // --- ROULETTE STATE ---
  const [rouletteChip, setRouletteChip] = useState(1000);
  const [rouletteBets, setRouletteBets] = useState<RouletteBetItem[]>([]);
  const [isSpinningRoulette, setIsSpinningRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<RouletteResult | null>(null);
  const [rouletteHistory, setRouletteHistory] = useState<{ num: number; color: string }[]>([
    { num: 17, color: 'black' },
    { num: 32, color: 'red' },
    { num: 0, color: 'green' },
    { num: 7, color: 'red' },
  ]);
  const [wheelRotation, setWheelRotation] = useState(0);

  // --- BLACKJACK STATE ---
  const [bjBet, setBjBet] = useState(2500);
  const [bjState, setBjState] = useState<BlackjackState | null>(null);

  // --- DICE STATE ---
  const [diceBet, setDiceBet] = useState(1000);
  const [diceChoice, setDiceChoice] = useState<'over7' | 'under7' | 'lucky7' | 'doubles' | 'exact'>('over7');
  const [diceExact, setDiceExact] = useState(7);
  const [diceValues, setDiceValues] = useState<[number, number]>([3, 4]);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);

  // --- LUCKY WHEEL STATE ---
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelPrizeResult, setWheelPrizeResult] = useState<WheelPrize | null>(null);
  const [freeSpinAvailable, setFreeSpinAvailable] = useState(true);

  useEffect(() => {
    const lvl = upgradeService.getUpgradeLevel(user.id, 'upg_casino_luck');
    setLuckLevel(lvl);

    const last = casinoService.getLastFreeWheelSpin(user.id);
    if (last && Date.now() - last < 24 * 3600 * 1000) {
      setFreeSpinAvailable(false);
    } else {
      setFreeSpinAvailable(true);
    }
  }, [user.id]);

  // ==========================================
  // SLOTS HANDLER
  // ==========================================
  const handleSpinSlots = () => {
    if (isSpinningSlots || user.money < slotBet) return;
    setIsSpinningSlots(true);
    setSlotResult(null);

    // Audio tick loop
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      audioService.play('spin');
      const symbols = ['💎', '👑', '💰', '🍒', '🔔', '🍋', '💀'];
      setSlotReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      if (ticks > 14) {
        clearInterval(interval);
        const res = casinoService.playSlots(user.id, slotBet);
        if (res.success && res.result) {
          setSlotReels(res.result.reels);
          setSlotResult(res.result);
        }
        setIsSpinningSlots(false);
      }
    }, 100);
  };

  // ==========================================
  // ROULETTE HANDLERS
  // ==========================================
  const addRouletteBet = (type: RouletteBetItem['type'], numberValue?: number) => {
    if (isSpinningRoulette) return;
    const id = numberValue !== undefined ? `num_${numberValue}` : type;
    const existingIndex = rouletteBets.findIndex((b) => b.id === id);

    audioService.play('click');

    if (existingIndex >= 0) {
      const updated = [...rouletteBets];
      updated[existingIndex].amount += rouletteChip;
      setRouletteBets(updated);
    } else {
      setRouletteBets([...rouletteBets, { id, type, numberValue, amount: rouletteChip }]);
    }
  };

  const clearRouletteBets = () => {
    if (!isSpinningRoulette) {
      audioService.play('click');
      setRouletteBets([]);
    }
  };

  const handleSpinRoulette = () => {
    const totalBet = rouletteBets.reduce((s, b) => s + b.amount, 0);
    if (isSpinningRoulette || totalBet === 0 || user.money < totalBet) return;

    setIsSpinningRoulette(true);
    setRouletteResult(null);

    // Spin animation degrees
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetDeg = wheelRotation + extraSpins * 360 + Math.floor(Math.random() * 360);
    setWheelRotation(targetDeg);

    audioService.play('spin');

    setTimeout(() => {
      const res = casinoService.playRoulette(user.id, rouletteBets);
      if (res.success && res.result) {
        setRouletteResult(res.result);
        setRouletteHistory((prev) => [
          { num: res.result!.winningNumber, color: res.result!.color },
          ...prev.slice(0, 7),
        ]);
      }
      setIsSpinningRoulette(false);
    }, 3200);
  };

  // ==========================================
  // BLACKJACK HANDLERS
  // ==========================================
  const handleStartBlackjack = () => {
    if (user.money < bjBet) return;
    const res = casinoService.startBlackjack(user.id, bjBet);
    if (res.success && res.state) {
      setBjState(res.state);
    }
  };

  const handleHitBlackjack = () => {
    const res = casinoService.hitBlackjack(user.id);
    if (res.success && res.state) {
      setBjState({ ...res.state });
    }
  };

  const handleStandBlackjack = () => {
    const res = casinoService.standBlackjack(user.id);
    if (res.success && res.state) {
      setBjState({ ...res.state });
    }
  };

  const handleDoubleBlackjack = () => {
    const res = casinoService.doubleBlackjack(user.id);
    if (res.success && res.state) {
      setBjState({ ...res.state });
    }
  };

  // ==========================================
  // DICE HANDLERS
  // ==========================================
  const handleRollDice = () => {
    if (isRollingDice || user.money < diceBet) return;
    setIsRollingDice(true);
    setDiceResult(null);

    let rolls = 0;
    const interval = setInterval(() => {
      rolls++;
      audioService.play('dice');
      setDiceValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      if (rolls > 10) {
        clearInterval(interval);
        const res = casinoService.playDice(
          user.id,
          diceBet,
          diceChoice,
          diceChoice === 'exact' ? diceExact : undefined
        );
        if (res.success && res.result) {
          setDiceValues([res.result.dice1, res.result.dice2]);
          setDiceResult(res.result);
        }
        setIsRollingDice(false);
      }
    }, 90);
  };

  // ==========================================
  // WHEEL OF FORTUNE HANDLERS
  // ==========================================
  const handleSpinWheel = (isFree: boolean) => {
    if (isSpinningWheel) return;
    setIsSpinningWheel(true);
    setWheelPrizeResult(null);

    const res = casinoService.spinLuckyWheel(user.id, isFree);
    if (!res.success) {
      setIsSpinningWheel(false);
      return;
    }

    if (isFree) setFreeSpinAvailable(false);

    // Calculate rotation degree based on prize index
    const segmentAngle = 360 / WHEEL_PRIZES.length;
    const prizeIdx = res.prizeIndex || 0;
    // Rotate to land pointer on chosen segment
    const spins = 5 * 360;
    const targetDeg = spins + (360 - prizeIdx * segmentAngle - segmentAngle / 2);
    setWheelAngle((prev) => prev + targetDeg);

    audioService.play('spin');

    setTimeout(() => {
      setIsSpinningWheel(false);
      if (res.prize) {
        setWheelPrizeResult(res.prize);
      }
    }, 4500);
  };

  return (
    <div id="casino-page" className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-amber-950/60 border border-red-900/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950 font-black text-2xl border border-amber-300/30">
            🎰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-wider">
                Казино Royal Diamond
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/50 text-[10px] font-black uppercase tracking-wider animate-pulse">
                VIP ZONE
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Слоты 777, Европейская Рулетка, Блэкджек 21, Кости и Ежедневное Колесо Фортуны
            </p>
          </div>
        </div>

        {/* Player Cash & Luck Perk Indicator */}
        <div className="flex items-center gap-3 z-10">
          {luckLevel > 0 && (
            <div className="px-3.5 py-2 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-xs flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-amber-400/80 block uppercase font-bold">Перк Удачи</span>
                <span className="font-bold">+{luckLevel * 4}% к выплатам</span>
              </div>
            </div>
          )}

          <div className="px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Наличные фишки</span>
            <strong className="text-emerald-400 font-mono text-sm font-black">
              ${user.money.toLocaleString('ru')}
            </strong>
          </div>

          {onOpenBank && (
            <button
              onClick={onOpenBank}
              className="px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-800/40 text-xs font-bold transition-all shadow-md"
            >
              Банк
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'slots', label: '🎰 Слоты 777', badge: 'Hot' },
          { id: 'roulette', label: '🎡 Рулетка', badge: 'Classic' },
          { id: 'blackjack', label: '🃏 Блэкджек 21', badge: '2.5x' },
          { id: 'dice', label: '🎲 Кости Удачи', badge: 'Fast' },
          { id: 'wheel', label: '🎁 Колесо Фортуны', badge: freeSpinAvailable ? 'FREE' : 'Daily' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CasinoTab)}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2.5 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xl shadow-red-950 border border-amber-400/30'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                tab.badge === 'FREE'
                  ? 'bg-emerald-500 text-black animate-bounce'
                  : 'bg-black/40 text-zinc-300'
              }`}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* 1. SLOTS TAB */}
      {/* ========================================== */}
      {activeTab === 'slots' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Slot Machine Box */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col items-center justify-between space-y-8 relative overflow-hidden">
            {/* Top Sign */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black text-amber-400 uppercase tracking-widest">
                  BANDIT 777 CLASSIC
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">ДЖЕКПОТ ДО 50x</span>
            </div>

            {/* Reels Display */}
            <div className="w-full py-10 px-6 rounded-3xl bg-zinc-950 border-4 border-amber-500/40 shadow-inner flex items-center justify-center gap-4 sm:gap-6 relative">
              <div className="absolute inset-x-0 h-0.5 bg-red-500/30 top-1/2 -translate-y-1/2 pointer-events-none" />

              {slotReels.map((sym, idx) => (
                <div
                  key={idx}
                  className="w-24 h-28 sm:w-32 sm:h-36 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-5xl sm:text-6xl shadow-2xl relative overflow-hidden"
                >
                  <span className="select-none animate-in fade-in zoom-in duration-150">{sym}</span>
                </div>
              ))}
            </div>

            {/* Result Message */}
            <div className="h-10 flex items-center justify-center">
              {slotResult ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                    slotResult.isWin
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {slotResult.isWin ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : null}
                  <span>{slotResult.message}</span>
                </motion.div>
              ) : (
                <span className="text-xs text-zinc-500">Сделайте ставку и нажмите «Крутить»</span>
              )}
            </div>

            {/* Controls */}
            <div className="w-full space-y-4 pt-4 border-t border-zinc-800">
              {/* Quick Bet Buttons */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                {[500, 1000, 2500, 5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSlotBet(amt)}
                    disabled={isSpinningSlots}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                      slotBet === amt
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    ${amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              {/* Big Spin Button */}
              <button
                id="slots-spin-btn"
                onClick={handleSpinSlots}
                disabled={isSpinningSlots || user.money < slotBet}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                  isSpinningSlots
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : user.money < slotBet
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:brightness-110 text-white shadow-xl shadow-red-950 active:scale-[0.99]'
                }`}
              >
                <RotateCcw className={`w-5 h-5 ${isSpinningSlots ? 'animate-spin' : ''}`} />
                {isSpinningSlots
                  ? 'Барабаны вращаются...'
                  : `Крутить за $${slotBet.toLocaleString('ru')}`}
              </button>
            </div>
          </div>

          {/* Paytable & Rules */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Таблица выплат
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { sym: '💎 💎 💎', name: 'Бриллианты', mult: 'x50.0' },
                { sym: '👑 👑 👑', name: 'Короны', mult: 'x25.0' },
                { sym: '💰 💰 💰', name: 'Мешки денег', mult: 'x15.0' },
                { sym: '🍒 🍒 🍒', name: 'Вишни', mult: 'x8.0' },
                { sym: '🔔 🔔 🔔', name: 'Колокольчики', mult: 'x5.0' },
                { sym: '🍋 🍋 🍋', name: 'Лимоны', mult: 'x3.0' },
                { sym: 'Пара 💎💎 / 👑👑', name: 'Совпадение 2x', mult: 'x4 - x5' },
                { sym: 'Пара 🍒🍒 / 💰💰', name: 'Совпадение 2x', mult: 'x2 - x2.5' },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between"
                >
                  <span className="font-bold text-zinc-200">{row.sym}</span>
                  <span className="text-zinc-400 text-[11px]">{row.name}</span>
                  <span className="font-mono font-black text-amber-400">{row.mult}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300/90 leading-relaxed">
              💡 <strong>Совет:</strong> Прокачивайте навык <em>«Фартовый игрок»</em> в разделе навыков, чтобы получать повышенные коэффициенты во всех играх казино!
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. ROULETTE TAB */}
      {/* ========================================== */}
      {activeTab === 'roulette' && (
        <div className="space-y-6">
          {/* Top Roulette Wheel & Recent Numbers */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Spinning Wheel Mockup */}
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: isSpinningRoulette ? 3.2 : 0, ease: 'easeOut' }}
                  className="w-28 h-28 rounded-full border-4 border-amber-500/80 bg-gradient-to-tr from-red-700 via-zinc-900 to-zinc-950 flex items-center justify-center shadow-2xl relative"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xs">
                    0-36
                  </div>
                  {/* Outer Ball Pip */}
                  <div className="absolute top-1 w-2.5 h-2.5 rounded-full bg-white shadow-md shadow-white" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-base font-black text-white">Европейская Рулетка</h3>
                <p className="text-xs text-zinc-400">Ставки на цвет, чет/нечет, дюжины и точные числа</p>
                {rouletteResult && (
                  <div className="mt-2 text-xs font-bold text-amber-300 flex items-center gap-2">
                    <span>Выпало:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-white font-mono font-black ${
                        rouletteResult.color === 'red'
                          ? 'bg-red-600'
                          : rouletteResult.color === 'black'
                          ? 'bg-zinc-800'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {rouletteResult.winningNumber}
                    </span>
                    <span className="text-emerald-400">
                      {rouletteResult.isWin
                        ? `+$${rouletteResult.totalPayout.toLocaleString('ru')}`
                        : 'Мимо'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* History Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 uppercase font-bold">История:</span>
              <div className="flex items-center gap-1.5">
                {rouletteHistory.map((h, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-black flex items-center justify-center text-white ${
                      h.color === 'red'
                        ? 'bg-red-600'
                        : h.color === 'black'
                        ? 'bg-zinc-800'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {h.num}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Betting Board */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
            {/* Chips Selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-bold">Номинал фишки:</span>
                {[500, 1000, 5000, 25000, 100000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRouletteChip(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                      rouletteChip === val
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950 font-black'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    ${val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">
                  Всего ставок:{' '}
                  <strong className="text-emerald-400 font-mono">
                    ${rouletteBets.reduce((s, b) => s + b.amount, 0).toLocaleString('ru')}
                  </strong>
                </span>
                <button
                  onClick={clearRouletteBets}
                  disabled={rouletteBets.length === 0 || isSpinningRoulette}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-red-400 border border-red-900/40 text-xs font-bold"
                >
                  Очистить
                </button>
              </div>
            </div>

            {/* Grid of Bets */}
            <div className="space-y-3">
              {/* Outside Bets (Red, Black, Even, Odd, 1-18, 19-36) */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <button
                  onClick={() => addRouletteBet('red')}
                  className="p-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-between"
                >
                  <span>КРАСНОЕ (x2)</span>
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded">
                    ${rouletteBets.find((b) => b.id === 'red')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('black')}
                  className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider border border-zinc-700 flex items-center justify-between"
                >
                  <span>ЧЕРНОЕ (x2)</span>
                  <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded">
                    ${rouletteBets.find((b) => b.id === 'black')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('even')}
                  className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase border border-zinc-800 flex items-center justify-between"
                >
                  <span>ЧЕТ (x2)</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded">
                    ${rouletteBets.find((b) => b.id === 'even')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('odd')}
                  className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase border border-zinc-800 flex items-center justify-between"
                >
                  <span>НЕЧЕТ (x2)</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded">
                    ${rouletteBets.find((b) => b.id === 'odd')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('low')}
                  className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase border border-zinc-800 flex items-center justify-between"
                >
                  <span>1 - 18 (x2)</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded">
                    ${rouletteBets.find((b) => b.id === 'low')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('high')}
                  className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase border border-zinc-800 flex items-center justify-between"
                >
                  <span>19 - 36 (x2)</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded">
                    ${rouletteBets.find((b) => b.id === 'high')?.amount || 0}
                  </span>
                </button>
              </div>

              {/* Dozens */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addRouletteBet('dozen1')}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 font-bold text-xs border border-zinc-800 flex items-center justify-between"
                >
                  <span>1-я Дюжина (1-12) x3</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded font-mono">
                    ${rouletteBets.find((b) => b.id === 'dozen1')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('dozen2')}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 font-bold text-xs border border-zinc-800 flex items-center justify-between"
                >
                  <span>2-я Дюжина (13-24) x3</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded font-mono">
                    ${rouletteBets.find((b) => b.id === 'dozen2')?.amount || 0}
                  </span>
                </button>

                <button
                  onClick={() => addRouletteBet('dozen3')}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 font-bold text-xs border border-zinc-800 flex items-center justify-between"
                >
                  <span>3-я Дюжина (25-36) x3</span>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded font-mono">
                    ${rouletteBets.find((b) => b.id === 'dozen3')?.amount || 0}
                  </span>
                </button>
              </div>

              {/* Numbers Grid (0 to 36) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-semibold">
                    Прямые ставки на числа (Выплата 36x):
                  </span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  <button
                    onClick={() => addRouletteBet('number', 0)}
                    className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-mono font-black text-xs col-span-6 sm:col-span-12"
                  >
                    0 Зеро (36x){' '}
                    {rouletteBets.find((b) => b.id === 'num_0')?.amount ? `[$${rouletteBets.find((b) => b.id === 'num_0')?.amount}]` : ''}
                  </button>

                  {Array.from({ length: 36 }).map((_, i) => {
                    const num = i + 1;
                    const isRed = ROULETTE_RED_NUMBERS.includes(num);
                    const betObj = rouletteBets.find((b) => b.id === `num_${num}`);

                    return (
                      <button
                        key={num}
                        onClick={() => addRouletteBet('number', num)}
                        className={`p-2 rounded-lg text-xs font-mono font-black text-white transition-transform active:scale-90 relative ${
                          isRed ? 'bg-red-600 hover:bg-red-500' : 'bg-zinc-800 hover:bg-zinc-700'
                        } ${betObj ? 'ring-2 ring-amber-400' : ''}`}
                      >
                        {num}
                        {betObj && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={handleSpinRoulette}
              disabled={isSpinningRoulette || rouletteBets.length === 0}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                isSpinningRoulette || rouletteBets.length === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white shadow-xl shadow-red-950 active:scale-[0.99]'
              }`}
            >
              <RotateCcw className={`w-5 h-5 ${isSpinningRoulette ? 'animate-spin' : ''}`} />
              {isSpinningRoulette
                ? 'Шарик катится...'
                : `Крутить рулетку ($${rouletteBets.reduce((s, b) => s + b.amount, 0).toLocaleString('ru')})`}
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. BLACKJACK TAB */}
      {/* ========================================== */}
      {activeTab === 'blackjack' && (
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-8">
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Блэкджек 21 Classic
              </h2>
              <p className="text-xs text-zinc-400">Натуральный блэкджек платит 3 к 2 (2.5x). Дилер берет до 17.</p>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-400 font-bold">
              Ставка: ${bjBet.toLocaleString('ru')}
            </div>
          </div>

          {/* Table Felt */}
          <div className="w-full py-8 px-6 rounded-3xl bg-gradient-to-b from-emerald-950/80 to-zinc-950 border-4 border-emerald-800/40 shadow-inner space-y-8">
            {/* Dealer Hand */}
            <div className="text-center space-y-3">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                Рука Дилера {bjState && bjState.status !== 'playing' ? `(${bjState.dealerScore})` : ''}
              </span>

              <div className="flex items-center justify-center gap-3">
                {bjState ? (
                  bjState.dealerCards.map((c, i) => {
                    const isHidden = i === 1 && bjState.status === 'playing';
                    return (
                      <div
                        key={i}
                        className={`w-16 h-24 rounded-xl border-2 flex flex-col justify-between p-2 shadow-xl ${
                          isHidden
                            ? 'bg-red-950 border-red-800 text-red-500 items-center justify-center font-black text-xs'
                            : 'bg-white border-zinc-300 text-zinc-900 font-black'
                        }`}
                      >
                        {isHidden ? (
                          <span>BANDIT</span>
                        ) : (
                          <>
                            <div className="text-left text-sm leading-none">
                              {c.rank}
                              <span className={c.suit === '♥' || c.suit === '♦' ? 'text-red-600' : 'text-black'}>
                                {c.suit}
                              </span>
                            </div>
                            <div className={`text-center text-xl ${c.suit === '♥' || c.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                              {c.suit}
                            </div>
                            <div className="text-right text-sm leading-none rotate-180">
                              {c.rank}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="w-16 h-24 rounded-xl border-2 border-dashed border-emerald-700/50 flex items-center justify-center text-emerald-600 text-xs font-bold">
                    Карты
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-emerald-800/30" />

            {/* Player Hand */}
            <div className="text-center space-y-3">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                Ваша Рука {bjState ? `(Очков: ${bjState.playerScore})` : ''}
              </span>

              <div className="flex items-center justify-center gap-3">
                {bjState ? (
                  bjState.playerCards.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-16 h-24 rounded-xl bg-white border-2 border-zinc-300 text-zinc-900 font-black flex flex-col justify-between p-2 shadow-xl"
                    >
                      <div className="text-left text-sm leading-none">
                        {c.rank}
                        <span className={c.suit === '♥' || c.suit === '♦' ? 'text-red-600' : 'text-black'}>
                          {c.suit}
                        </span>
                      </div>
                      <div className={`text-center text-xl ${c.suit === '♥' || c.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                        {c.suit}
                      </div>
                      <div className="text-right text-sm leading-none rotate-180">
                        {c.rank}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="w-16 h-24 rounded-xl border-2 border-dashed border-emerald-700/50 flex items-center justify-center text-emerald-600 text-xs font-bold">
                    Ваша рука
                  </div>
                )}
              </div>
            </div>

            {/* Round Status Banner */}
            {bjState && bjState.status !== 'playing' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-black uppercase tracking-wider"
              >
                {bjState.status === 'player_blackjack' && (
                  <span className="text-amber-400">🔥 Натуральный Блэкджек! Выплата ${bjState.payout.toLocaleString('ru')}</span>
                )}
                {bjState.status === 'player_win' && (
                  <span className="text-emerald-400">Победа игрока! Выплата ${bjState.payout.toLocaleString('ru')}</span>
                )}
                {bjState.status === 'dealer_bust' && (
                  <span className="text-emerald-400">У дилера перебор! Выплата ${bjState.payout.toLocaleString('ru')}</span>
                )}
                {bjState.status === 'player_bust' && (
                  <span className="text-red-400">Перебор! Вы проиграли ставку</span>
                )}
                {bjState.status === 'dealer_win' && (
                  <span className="text-red-400">Победа дилера. Попробуйте еще раз</span>
                )}
                {bjState.status === 'push' && (
                  <span className="text-cyan-400">Ничья (Push)! Ставка возвращена</span>
                )}
              </motion.div>
            )}
          </div>

          {/* Blackjack Controls */}
          {bjState && bjState.status === 'playing' ? (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleHitBlackjack}
                className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg"
              >
                Взять (Hit)
              </button>
              <button
                onClick={handleStandBlackjack}
                className="py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg"
              >
                Хватит (Stand)
              </button>
              <button
                onClick={handleDoubleBlackjack}
                disabled={bjState.playerCards.length !== 2 || user.money < bjState.bet}
                className="py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50"
              >
                Удвоить (Double)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[1000, 2500, 5000, 10000, 25000, 50000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBjBet(val)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      bjBet === val
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    ${val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartBlackjack}
                disabled={user.money < bjBet}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-950 transition-all active:scale-[0.99]"
              >
                Раздать карты (${bjBet.toLocaleString('ru')})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 4. DICE DUEL TAB */}
      {/* ========================================== */}
      {activeTab === 'dice' && (
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Кости Удачи (Dice Duel)
              </h2>
              <p className="text-xs text-zinc-400">Бросьте два кубика и угадайте комбинацию исхода</p>
            </div>
            <Dices className="w-8 h-8 text-amber-400" />
          </div>

          {/* Dice Cups Visualization */}
          <div className="w-full py-10 rounded-3xl bg-zinc-950 border-2 border-zinc-800 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-6">
              {diceValues.map((d, idx) => (
                <motion.div
                  key={idx}
                  animate={isRollingDice ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: isRollingDice ? Infinity : 0, duration: 0.2 }}
                  className="w-20 h-20 rounded-2xl bg-white border-2 border-zinc-300 shadow-2xl flex items-center justify-center text-4xl font-black text-zinc-900"
                >
                  {d}
                </motion.div>
              ))}
            </div>

            <div className="text-sm font-bold text-zinc-300 font-mono">
              Сумма кубиков: <strong className="text-amber-400 text-lg">{diceValues[0] + diceValues[1]}</strong>
            </div>

            {diceResult && (
              <div
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                  diceResult.isWin
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {diceResult.isWin ? `ПОБЕДА! Выплата +$${diceResult.payout.toLocaleString('ru')}` : 'Проигрыш'}
              </div>
            )}
          </div>

          {/* Betting Options */}
          <div className="space-y-4">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Выберите исход:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'over7', label: 'Больше 7', mult: 'x2.1' },
                { id: 'under7', label: 'Меньше 7', mult: 'x2.1' },
                { id: 'lucky7', label: 'Ровно 7 (Счастливая)', mult: 'x5.8' },
                { id: 'doubles', label: 'Дубль (Пара)', mult: 'x3.6' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDiceChoice(opt.id as any)}
                  className={`p-3.5 rounded-2xl text-xs font-black uppercase transition-all flex flex-col justify-between items-start gap-2 ${
                    diceChoice === opt.id
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-950'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="font-mono text-sm">{opt.mult}</span>
                </button>
              ))}
            </div>

            {/* Bet selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[500, 1000, 2500, 5000, 15000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDiceBet(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono ${
                    diceBet === amt
                      ? 'bg-cyan-500 text-black font-black'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  ${amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleRollDice}
              disabled={isRollingDice || user.money < diceBet}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-red-950 active:scale-[0.99] transition-all"
            >
              {isRollingDice ? 'Бросаем кубики...' : `Бросить кости ($${diceBet.toLocaleString('ru')})`}
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. WHEEL OF FORTUNE TAB */}
      {/* ========================================== */}
      {activeTab === 'wheel' && (
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              Ежедневное Колесо Фортуны
            </h2>
            <p className="text-xs text-zinc-400">
              1 бесплатное вращение раз в 24 часа. Джекпот $500,000, золото и редкие призы!
            </p>
          </div>

          {/* Animated Wheel */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Top Center Pointer */}
            <div className="absolute -top-3 z-30 w-6 h-8 flex items-center justify-center text-amber-400 drop-shadow-lg">
              ▼
            </div>

            <motion.div
              animate={{ rotate: wheelAngle }}
              transition={{ duration: isSpinningWheel ? 4.5 : 0, ease: 'easeOut' }}
              className="w-full h-full rounded-full border-8 border-amber-500/80 bg-zinc-950 shadow-2xl relative overflow-hidden flex items-center justify-center"
            >
              {/* Segments representation */}
              {WHEEL_PRIZES.map((prize, idx) => {
                const rot = idx * (360 / WHEEL_PRIZES.length);
                return (
                  <div
                    key={prize.id}
                    style={{ transform: `rotate(${rot}deg)` }}
                    className="absolute inset-0 flex justify-center pt-3 origin-center pointer-events-none"
                  >
                    <span
                      style={{ color: prize.color }}
                      className="text-[10px] sm:text-xs font-black uppercase tracking-tighter"
                    >
                      {prize.label}
                    </span>
                  </div>
                );
              })}

              {/* Center Hub */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-zinc-900 shadow-xl flex items-center justify-center font-black text-black text-xs z-20">
                BANDIT
              </div>
            </motion.div>
          </div>

          {/* Prize Win Banner */}
          {wheelPrizeResult && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-center space-y-1"
            >
              <div className="text-emerald-300 font-bold text-xs">🎉 ВЫ ВЫИГРАЛИ:</div>
              <div className="text-white font-black text-lg">{wheelPrizeResult.label}</div>
            </motion.div>
          )}

          {/* Wheel Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            {freeSpinAvailable ? (
              <button
                onClick={() => handleSpinWheel(true)}
                disabled={isSpinningWheel}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-950 animate-pulse"
              >
                Бесплатный спин (Free 24h)
              </button>
            ) : (
              <button
                onClick={() => handleSpinWheel(false)}
                disabled={isSpinningWheel || user.money < 25000}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-950"
              >
                Спин за $25,000 наличных
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
