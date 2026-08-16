import { dbEngine } from '../lib/storageEngine';
import { Transaction, CasinoStats } from '../types';
import { upgradeService } from './UpgradeService';
import { audioService } from './AudioService';
import { notificationService } from './NotificationService';

export interface SlotResult {
  reels: [string, string, string];
  winAmount: number;
  multiplier: number;
  isWin: boolean;
  isJackpot: boolean;
  message: string;
}

export interface RouletteBetItem {
  id: string;
  type: 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'number';
  numberValue?: number;
  amount: number;
}

export interface RouletteResult {
  winningNumber: number;
  color: 'red' | 'black' | 'green';
  totalBet: number;
  totalPayout: number;
  isWin: boolean;
  netProfit: number;
}

export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: string;
  value: number;
}

export interface BlackjackState {
  id: string;
  userId: string;
  bet: number;
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  status: 'playing' | 'player_bust' | 'dealer_bust' | 'player_blackjack' | 'player_win' | 'dealer_win' | 'push';
  payout: number;
}

export interface DiceResult {
  dice1: number;
  dice2: number;
  sum: number;
  choice: 'over7' | 'under7' | 'lucky7' | 'doubles' | 'exact';
  exactTarget?: number;
  isWin: boolean;
  multiplier: number;
  payout: number;
}

export interface WheelPrize {
  id: string;
  label: string;
  icon: string;
  type: 'cash' | 'xp' | 'item';
  amount?: number;
  itemId?: string;
  itemName?: string;
  color: string;
  chanceWeight: number;
}

export const WHEEL_PRIZES: WheelPrize[] = [
  { id: 'w_10k', label: '$15,000', icon: 'DollarSign', type: 'cash', amount: 15000, color: '#059669', chanceWeight: 30 },
  { id: 'w_xp300', label: '+350 XP', icon: 'Sparkles', type: 'xp', amount: 350, color: '#7c3aed', chanceWeight: 25 },
  { id: 'w_35k', label: '$35,000', icon: 'DollarSign', type: 'cash', amount: 35000, color: '#0284c7', chanceWeight: 18 },
  { id: 'w_energy', label: '3x Энергетик', icon: 'Coffee', type: 'item', itemId: 'food_energy_drink', itemName: 'Энергетик (3 шт)', color: '#d97706', chanceWeight: 12 },
  { id: 'w_75k', label: '$75,000', icon: 'DollarSign', type: 'cash', amount: 75000, color: '#e11d48', chanceWeight: 8 },
  { id: 'w_gold', label: 'Слиток Золота 1кг', icon: 'Coins', type: 'item', itemId: 'mat_gold_bar', itemName: 'Банковское золото', color: '#eab308', chanceWeight: 4 },
  { id: 'w_150k', label: '$150,000', icon: 'DollarSign', type: 'cash', amount: 150000, color: '#f59e0b', chanceWeight: 2.5 },
  { id: 'w_jackpot', label: '🔥 ДЖЕКПОТ $500,000', icon: 'Crown', type: 'cash', amount: 500000, color: '#ef4444', chanceWeight: 0.5 },
];

const SLOT_SYMBOLS = [
  { symbol: '💎', name: 'Diamond', mult: 50, weight: 5 },
  { symbol: '👑', name: 'Crown', mult: 25, weight: 10 },
  { symbol: '💰', name: 'MoneyBag', mult: 15, weight: 18 },
  { symbol: '🍒', name: 'Cherry', mult: 8, weight: 28 },
  { symbol: '🔔', name: 'Bell', mult: 5, weight: 35 },
  { symbol: '🍋', name: 'Lemon', mult: 3, weight: 45 },
  { symbol: '💀', name: 'Skull', mult: 0, weight: 30 },
];

const ROULETTE_RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

class CasinoService {
  private activeBlackjacks: Record<string, BlackjackState> = {};

  // Retrieve user casino stats
  public getCasinoStats(userId: string): CasinoStats {
    try {
      const stored = localStorage.getItem(`bandit_casino_stats_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return {
      total_bets: 0,
      total_won: 0,
      total_lost: 0,
      biggest_win: 0,
      games_played: 0,
    };
  }

  private updateCasinoStats(userId: string, bet: number, payout: number) {
    const stats = this.getCasinoStats(userId);
    stats.games_played += 1;
    stats.total_bets += bet;
    if (payout > bet) {
      const profit = payout - bet;
      stats.total_won += profit;
      if (profit > stats.biggest_win) stats.biggest_win = profit;
    } else if (payout < bet) {
      stats.total_lost += (bet - payout);
    }
    try {
      localStorage.setItem(`bandit_casino_stats_${userId}`, JSON.stringify(stats));
    } catch {}
  }

  public getLastFreeWheelSpin(userId: string): number | null {
    try {
      const t = localStorage.getItem(`bandit_wheel_last_free_${userId}`);
      return t ? parseInt(t, 10) : null;
    } catch {
      return null;
    }
  }

  public setLastFreeWheelSpin(userId: string) {
    try {
      localStorage.setItem(`bandit_wheel_last_free_${userId}`, Date.now().toString());
    } catch {}
  }

  // --- 1. SLOTS ENGINE ---
  public playSlots(userId: string, bet: number): { success: boolean; result?: SlotResult; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };
    if (bet <= 0 || profile.money < bet) {
      return { success: false, error: 'Недостаточно наличных средств для ставки' };
    }

    const luckLevel = upgradeService.getUpgradeLevel(userId, 'upg_casino_luck');
    const luckBoost = luckLevel * 0.04; // +4% per level

    // Deduct bet
    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= bet;
      draft.profiles[userId].total_spent += bet;
    });

    // Roll 3 reels
    const pickSymbol = () => {
      // Adjust weights slightly by luck
      const pool: string[] = [];
      SLOT_SYMBOLS.forEach((s) => {
        let count = s.weight;
        if (s.mult > 0 && luckBoost > 0) {
          count = Math.round(count * (1 + luckBoost));
        }
        for (let i = 0; i < count; i++) {
          pool.push(s.symbol);
        }
      });
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const reels: [string, string, string] = [pickSymbol(), pickSymbol(), pickSymbol()];

    let multiplier = 0;
    let isWin = false;
    let isJackpot = false;
    let message = 'Не повезло в этот раз!';

    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const sym = SLOT_SYMBOLS.find((s) => s.symbol === reels[0]);
      if (sym && sym.mult > 0) {
        multiplier = sym.mult * (1 + luckBoost);
        isWin = true;
        if (sym.symbol === '💎' || sym.symbol === '👑') {
          isJackpot = true;
          message = `ДЖЕКПОТ! 3x ${sym.symbol}! Множитель x${multiplier.toFixed(1)}!`;
        } else {
          message = `ПОБЕДА! 3x ${sym.symbol}! Выигрыш x${multiplier.toFixed(1)}!`;
        }
      }
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      const pair = reels[0] === reels[1] ? reels[0] : reels[1] === reels[2] ? reels[1] : reels[0];
      if (pair === '💎') multiplier = 5 * (1 + luckBoost);
      else if (pair === '👑') multiplier = 4 * (1 + luckBoost);
      else if (pair === '💰') multiplier = 2.5 * (1 + luckBoost);
      else if (pair === '🍒') multiplier = 2 * (1 + luckBoost);
      else if (pair === '🔔') multiplier = 1.5 * (1 + luckBoost);

      if (multiplier > 0) {
        isWin = true;
        message = `Совпадение пары ${pair}! Множитель x${multiplier.toFixed(1)}!`;
      }
    }

    const winAmount = Math.round(bet * multiplier);

    if (winAmount > 0) {
      const tx: Transaction = {
        id: `tx_${Date.now()}_slots_win`,
        user_id: userId,
        type: 'casino',
        amount: winAmount,
        currency: 'cash',
        description: `Выигрыш в слотах Bandit 777 (${reels.join(' ')})`,
        created_at: new Date().toISOString(),
      };

      dbEngine.updateState((draft) => {
        draft.profiles[userId].money += winAmount;
        draft.profiles[userId].total_earned += winAmount;
        draft.transactions.unshift(tx);
      });

      if (isJackpot) audioService.play('jackpot');
      else audioService.play('win');

      notificationService.notify(
        userId,
        'reward',
        'Слоты Bandit 777',
        `Поздравляем! Вы выиграли $${winAmount.toLocaleString('ru')}!`
      );
    } else {
      audioService.play('error');
    }

    this.updateCasinoStats(userId, bet, winAmount);

    return {
      success: true,
      result: {
        reels,
        winAmount,
        multiplier,
        isWin,
        isJackpot,
        message,
      },
    };
  }

  // --- 2. ROULETTE ENGINE ---
  public playRoulette(
    userId: string,
    bets: RouletteBetItem[]
  ): { success: boolean; result?: RouletteResult; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if (totalBet <= 0) return { success: false, error: 'Сумма ставок должна быть больше $0' };
    if (profile.money < totalBet) return { success: false, error: 'Недостаточно наличных средств' };

    // Deduct total bet
    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= totalBet;
      draft.profiles[userId].total_spent += totalBet;
    });

    const winningNumber = Math.floor(Math.random() * 37); // 0 to 36
    const isZero = winningNumber === 0;
    const isRed = !isZero && ROULETTE_RED_NUMBERS.includes(winningNumber);
    const color: 'red' | 'black' | 'green' = isZero ? 'green' : isRed ? 'red' : 'black';

    const luckLevel = upgradeService.getUpgradeLevel(userId, 'upg_casino_luck');
    const luckBoost = 1 + luckLevel * 0.03;

    let totalPayout = 0;

    bets.forEach((bet) => {
      if (bet.type === 'red' && color === 'red') totalPayout += Math.round(bet.amount * 2 * luckBoost);
      else if (bet.type === 'black' && color === 'black') totalPayout += Math.round(bet.amount * 2 * luckBoost);
      else if (bet.type === 'even' && !isZero && winningNumber % 2 === 0) totalPayout += Math.round(bet.amount * 2 * luckBoost);
      else if (bet.type === 'odd' && !isZero && winningNumber % 2 !== 0) totalPayout += Math.round(bet.amount * 2 * luckBoost);
      else if (bet.type === 'low' && !isZero && winningNumber >= 1 && winningNumber <= 18) totalPayout += Math.round(bet.amount * 2 * luckBoost);
      else if (bet.type === 'high' && !isZero && winningNumber >= 19 && winningNumber <= 36) totalPayout += Math.round(bet.amount * 2 * luckBoost);
      else if (bet.type === 'dozen1' && !isZero && winningNumber >= 1 && winningNumber <= 12) totalPayout += Math.round(bet.amount * 3 * luckBoost);
      else if (bet.type === 'dozen2' && !isZero && winningNumber >= 13 && winningNumber <= 24) totalPayout += Math.round(bet.amount * 3 * luckBoost);
      else if (bet.type === 'dozen3' && !isZero && winningNumber >= 25 && winningNumber <= 36) totalPayout += Math.round(bet.amount * 3 * luckBoost);
      else if (bet.type === 'number' && bet.numberValue === winningNumber) totalPayout += Math.round(bet.amount * 36 * luckBoost);
    });

    const isWin = totalPayout > 0;
    const netProfit = totalPayout - totalBet;

    if (totalPayout > 0) {
      const tx: Transaction = {
        id: `tx_${Date.now()}_roulette_win`,
        user_id: userId,
        type: 'casino',
        amount: totalPayout,
        currency: 'cash',
        description: `Выигрыш на Рулетке (Число ${winningNumber} ${color.toUpperCase()})`,
        created_at: new Date().toISOString(),
      };

      dbEngine.updateState((draft) => {
        draft.profiles[userId].money += totalPayout;
        draft.profiles[userId].total_earned += totalPayout;
        draft.transactions.unshift(tx);
      });

      if (netProfit > 50000) audioService.play('jackpot');
      else audioService.play('win');

      notificationService.notify(
        userId,
        'reward',
        'Европейская Рулетка',
        `Выпало ${winningNumber} (${color === 'red' ? 'Красное' : color === 'black' ? 'Черное' : 'Зеро'})! Выплата: $${totalPayout.toLocaleString('ru')}`
      );
    } else {
      audioService.play('error');
    }

    this.updateCasinoStats(userId, totalBet, totalPayout);

    return {
      success: true,
      result: {
        winningNumber,
        color,
        totalBet,
        totalPayout,
        isWin,
        netProfit,
      },
    };
  }

  // --- 3. BLACKJACK ENGINE ---
  private createCardDeck(): Card[] {
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
    const ranks = [
      { r: '2', v: 2 },
      { r: '3', v: 3 },
      { r: '4', v: 4 },
      { r: '5', v: 5 },
      { r: '6', v: 6 },
      { r: '7', v: 7 },
      { r: '8', v: 8 },
      { r: '9', v: 9 },
      { r: '10', v: 10 },
      { r: 'J', v: 10 },
      { r: 'Q', v: 10 },
      { r: 'K', v: 10 },
      { r: 'A', v: 11 },
    ];
    const deck: Card[] = [];
    suits.forEach((s) => {
      ranks.forEach((rk) => {
        deck.push({ suit: s, rank: rk.r, value: rk.v });
      });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  public calculateHandScore(cards: Card[]): number {
    let sum = cards.reduce((acc, c) => acc + c.value, 0);
    let aces = cards.filter((c) => c.rank === 'A').length;
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces -= 1;
    }
    return sum;
  }

  public startBlackjack(userId: string, bet: number): { success: boolean; state?: BlackjackState; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };
    if (bet <= 0 || profile.money < bet) return { success: false, error: 'Недостаточно наличных для ставки' };

    // Deduct bet
    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= bet;
      draft.profiles[userId].total_spent += bet;
    });

    const deck = this.createCardDeck();
    const playerCards = [deck.pop()!, deck.pop()!];
    const dealerCards = [deck.pop()!, deck.pop()!];

    const pScore = this.calculateHandScore(playerCards);
    const dScore = this.calculateHandScore(dealerCards);

    let status: BlackjackState['status'] = 'playing';
    let payout = 0;

    const luckLevel = upgradeService.getUpgradeLevel(userId, 'upg_casino_luck');
    const luckBoost = 1 + luckLevel * 0.04;

    if (pScore === 21) {
      if (dScore === 21) {
        status = 'push';
        payout = bet;
      } else {
        status = 'player_blackjack';
        payout = Math.round(bet * 2.5 * luckBoost);
      }
    }

    const gameState: BlackjackState = {
      id: `bj_${Date.now()}`,
      userId,
      bet,
      playerCards,
      dealerCards,
      playerScore: pScore,
      dealerScore: dScore,
      status,
      payout,
    };

    if (status !== 'playing') {
      this.finalizeBlackjack(gameState);
    } else {
      this.activeBlackjacks[userId] = gameState;
      audioService.play('card');
    }

    return { success: true, state: gameState };
  }

  public hitBlackjack(userId: string): { success: boolean; state?: BlackjackState; error?: string } {
    const game = this.activeBlackjacks[userId];
    if (!game || game.status !== 'playing') return { success: false, error: 'Активная игра не найдена' };

    const deck = this.createCardDeck();
    game.playerCards.push(deck.pop()!);
    game.playerScore = this.calculateHandScore(game.playerCards);

    audioService.play('card');

    if (game.playerScore > 21) {
      game.status = 'player_bust';
      game.payout = 0;
      this.finalizeBlackjack(game);
    } else if (game.playerScore === 21) {
      return this.standBlackjack(userId);
    }

    return { success: true, state: game };
  }

  public standBlackjack(userId: string): { success: boolean; state?: BlackjackState; error?: string } {
    const game = this.activeBlackjacks[userId];
    if (!game || game.status !== 'playing') return { success: false, error: 'Активная игра не найдена' };

    const deck = this.createCardDeck();
    // Dealer draws to 17
    while (this.calculateHandScore(game.dealerCards) < 17) {
      game.dealerCards.push(deck.pop()!);
    }
    game.dealerScore = this.calculateHandScore(game.dealerCards);

    const luckLevel = upgradeService.getUpgradeLevel(userId, 'upg_casino_luck');
    const luckBoost = 1 + luckLevel * 0.04;

    if (game.dealerScore > 21) {
      game.status = 'dealer_bust';
      game.payout = Math.round(game.bet * 2 * luckBoost);
    } else if (game.playerScore > game.dealerScore) {
      game.status = 'player_win';
      game.payout = Math.round(game.bet * 2 * luckBoost);
    } else if (game.playerScore < game.dealerScore) {
      game.status = 'dealer_win';
      game.payout = 0;
    } else {
      game.status = 'push';
      game.payout = game.bet;
    }

    this.finalizeBlackjack(game);
    return { success: true, state: game };
  }

  public doubleBlackjack(userId: string): { success: boolean; state?: BlackjackState; error?: string } {
    const game = this.activeBlackjacks[userId];
    if (!game || game.status !== 'playing') return { success: false, error: 'Активная игра не найдена' };
    if (game.playerCards.length !== 2) return { success: false, error: 'Удвоить можно только на первом ходе' };

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (profile.money < game.bet) return { success: false, error: 'Недостаточно средств для удвоения' };

    // Deduct second bet
    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= game.bet;
      draft.profiles[userId].total_spent += game.bet;
    });

    game.bet *= 2;

    const deck = this.createCardDeck();
    game.playerCards.push(deck.pop()!);
    game.playerScore = this.calculateHandScore(game.playerCards);

    if (game.playerScore > 21) {
      game.status = 'player_bust';
      game.payout = 0;
      this.finalizeBlackjack(game);
      return { success: true, state: game };
    }

    return this.standBlackjack(userId);
  }

  private finalizeBlackjack(game: BlackjackState) {
    delete this.activeBlackjacks[game.userId];

    if (game.payout > 0) {
      const tx: Transaction = {
        id: `tx_${Date.now()}_bj_win`,
        user_id: game.userId,
        type: 'casino',
        amount: game.payout,
        currency: 'cash',
        description: `Выплата в Блэкджек (${game.status})`,
        created_at: new Date().toISOString(),
      };

      dbEngine.updateState((draft) => {
        draft.profiles[game.userId].money += game.payout;
        draft.profiles[game.userId].total_earned += game.payout;
        draft.transactions.unshift(tx);
      });

      if (game.status === 'player_blackjack') audioService.play('jackpot');
      else audioService.play('win');

      notificationService.notify(
        game.userId,
        'reward',
        'Блэкджек 21',
        `Раунд окончен! Выплата: $${game.payout.toLocaleString('ru')}`
      );
    } else {
      audioService.play('error');
    }

    this.updateCasinoStats(game.userId, game.bet, game.payout);
  }

  // --- 4. DICE DUEL ENGINE ---
  public playDice(
    userId: string,
    bet: number,
    choice: 'over7' | 'under7' | 'lucky7' | 'doubles' | 'exact',
    exactTarget?: number
  ): { success: boolean; result?: DiceResult; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };
    if (bet <= 0 || profile.money < bet) return { success: false, error: 'Недостаточно средств для ставки' };

    // Deduct bet
    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= bet;
      draft.profiles[userId].total_spent += bet;
    });

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    const luckLevel = upgradeService.getUpgradeLevel(userId, 'upg_casino_luck');
    const luckBoost = 1 + luckLevel * 0.035;

    let isWin = false;
    let multiplier = 0;

    if (choice === 'over7' && sum > 7) {
      isWin = true;
      multiplier = 2.1 * luckBoost;
    } else if (choice === 'under7' && sum < 7) {
      isWin = true;
      multiplier = 2.1 * luckBoost;
    } else if (choice === 'lucky7' && sum === 7) {
      isWin = true;
      multiplier = 5.8 * luckBoost;
    } else if (choice === 'doubles' && d1 === d2) {
      isWin = true;
      multiplier = 3.6 * luckBoost;
    } else if (choice === 'exact' && exactTarget && sum === exactTarget) {
      isWin = true;
      multiplier = 11.0 * luckBoost;
    }

    const payout = isWin ? Math.round(bet * multiplier) : 0;

    if (payout > 0) {
      const tx: Transaction = {
        id: `tx_${Date.now()}_dice_win`,
        user_id: userId,
        type: 'casino',
        amount: payout,
        currency: 'cash',
        description: `Выигрыш в Кости (${d1} + ${d2} = ${sum})`,
        created_at: new Date().toISOString(),
      };

      dbEngine.updateState((draft) => {
        draft.profiles[userId].money += payout;
        draft.profiles[userId].total_earned += payout;
        draft.transactions.unshift(tx);
      });

      audioService.play('win');
      notificationService.notify(
        userId,
        'reward',
        'Кости Удачи',
        `Выпало [${d1}] и [${d2}] (Сумма ${sum})! Выигрыш: $${payout.toLocaleString('ru')}`
      );
    } else {
      audioService.play('error');
    }

    this.updateCasinoStats(userId, bet, payout);

    return {
      success: true,
      result: {
        dice1: d1,
        dice2: d2,
        sum,
        choice,
        exactTarget,
        isWin,
        multiplier,
        payout,
      },
    };
  }

  // --- 5. LUCKY WHEEL ENGINE ---
  public spinLuckyWheel(
    userId: string,
    isFree: boolean
  ): { success: boolean; prize?: WheelPrize; prizeIndex?: number; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const SPIN_COST = 25000;

    if (isFree) {
      const last = this.getLastFreeWheelSpin(userId);
      const now = Date.now();
      if (last && now - last < 24 * 3600 * 1000) {
        return { success: false, error: 'Бесплатное вращение доступно раз в 24 часа' };
      }
      this.setLastFreeWheelSpin(userId);
    } else {
      if (profile.money < SPIN_COST) {
        return { success: false, error: `Требуется $${SPIN_COST.toLocaleString('ru')} наличными` };
      }
      dbEngine.updateState((draft) => {
        draft.profiles[userId].money -= SPIN_COST;
        draft.profiles[userId].total_spent += SPIN_COST;
      });
    }

    const luckLevel = upgradeService.getUpgradeLevel(userId, 'upg_casino_luck');
    const luckBoost = luckLevel * 0.05;

    // Weighted random selection
    const weightedPrizes = WHEEL_PRIZES.map((p, idx) => {
      let weight = p.chanceWeight;
      if (p.amount && p.amount >= 100000) weight *= (1 + luckBoost);
      return { prize: p, index: idx, weight };
    });

    const totalWeight = weightedPrizes.reduce((sum, wp) => sum + wp.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = weightedPrizes[0];

    for (const wp of weightedPrizes) {
      if (rand < wp.weight) {
        chosen = wp;
        break;
      }
      rand -= wp.weight;
    }

    const prize = chosen.prize;

    // Apply prize rewards
    dbEngine.updateState((draft) => {
      if (prize.type === 'cash' && prize.amount) {
        draft.profiles[userId].money += prize.amount;
        draft.profiles[userId].total_earned += prize.amount;
        draft.transactions.unshift({
          id: `tx_${Date.now()}_wheel`,
          user_id: userId,
          type: 'casino',
          amount: prize.amount,
          currency: 'cash',
          description: `Приз в Колесе Фортуны (${prize.label})`,
          created_at: new Date().toISOString(),
        });
      } else if (prize.type === 'xp' && prize.amount) {
        draft.profiles[userId].xp += prize.amount;
      }
    });

    if (prize.id === 'w_jackpot' || (prize.amount && prize.amount >= 100000)) {
      audioService.play('jackpot');
    } else {
      audioService.play('win');
    }

    notificationService.notify(
      userId,
      'reward',
      'Колесо Фортуны',
      `Поздравляем! Вы выиграли приз: ${prize.label}!`
    );

    return {
      success: true,
      prize,
      prizeIndex: chosen.index,
    };
  }
}

export const casinoService = new CasinoService();
