import { dbEngine } from '../lib/storageEngine';
import { Job, JobType, ActiveJobShift, Transaction } from '../types';
import { JOBS_CATALOG } from '../data/gameData';
import { playerService } from './PlayerService';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';
import { antiCheatService } from './AntiCheatService';

const PASSENGER_DESTINATIONS = [
  'Элитный клуб "Black Lotus"',
  'Аэропорт "Bandit International"',
  'Центральный Банк',
  'Портовые доки, Сектор 4',
  'Отель "Grand Majestic"',
  'Жилой комплекс "Skyline Towers"',
  'Загородное казино "Red Dragon"',
  'Промзона "North Warehouses"',
];

const PASSENGER_NAMES = [
  'Бизнесмен в костюме',
  'Таинственная незнакомка',
  'Дон местной мафии',
  'Уличный гонщик',
  'Срочный курьер с кейсом',
  'Диджей ночного клуба',
  'Адвокат по уголовным делам',
];

class JobService {
  private activeShifts: Map<string, ActiveJobShift> = new Map();
  private userCooldowns: Map<string, Map<JobType, number>> = new Map();

  public getJobsCatalog(): Job[] {
    return JOBS_CATALOG;
  }

  public getActiveShift(userId: string): ActiveJobShift | null {
    const shift = this.activeShifts.get(userId);
    if (!shift) return null;

    if (Date.now() >= shift.endsAt) {
      shift.isReadyToClaim = true;
    }
    return shift;
  }

  public getCooldownRemaining(userId: string, jobId: JobType): number {
    const userCd = this.userCooldowns.get(userId);
    if (!userCd) return 0;
    const cdEnd = userCd.get(jobId) || 0;
    const diff = Math.ceil((cdEnd - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }

  public startJobShift(userId: string, jobId: JobType): { success: boolean; error?: string; shift?: ActiveJobShift } {
    const job = JOBS_CATALOG.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Работа не найдена' };

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    if (profile.level < job.min_level) {
      return { success: false, error: `Требуется минимум ${job.min_level} уровень персонажа` };
    }

    if (this.activeShifts.has(userId)) {
      return { success: false, error: 'У вас уже есть активная рабочая смена!' };
    }

    const cdRemaining = this.getCooldownRemaining(userId, jobId);
    if (cdRemaining > 0) {
      return { success: false, error: `Смена на перезарядке. Подождите ${cdRemaining} сек.` };
    }

    const check = antiCheatService.recordAction(userId, `job_start_${jobId}`, {
      minIntervalMs: 5000,
    });
    if (!check.isAllowed) {
      return { success: false, error: check.reason };
    }

    // Check player stat upgrades for job earnings bonus & speed bonus
    const upgrades = state.statUpgrades[userId] || [];
    const earnUpgrade = upgrades.find((u) => u.id === 'upg_job_bonus');
    const earnMultiplier = 1 + (earnUpgrade?.current_level || 0) * 0.08;

    const speedUpgrade = upgrades.find((u) => u.id === 'upg_speed_agility');
    const speedReduction = Math.min(0.4, (speedUpgrade?.current_level || 0) * 0.05);
    const durationSeconds = Math.max(10, Math.round(job.shift_duration_seconds * (1 - speedReduction)));

    const dest = PASSENGER_DESTINATIONS[Math.floor(Math.random() * PASSENGER_DESTINATIONS.length)];
    const passenger = PASSENGER_NAMES[Math.floor(Math.random() * PASSENGER_NAMES.length)];
    const now = Date.now();

    const payoutMoney = Math.round(job.base_pay * earnMultiplier);
    const payoutXp = job.base_xp;

    const shift: ActiveJobShift = {
      jobId,
      startedAt: now,
      endsAt: now + durationSeconds * 1000,
      targetObjective: `Доставить пассажира/груз в ${dest}`,
      destination: dest,
      passengerOrCargo: passenger,
      payoutMoney,
      payoutXp,
      isReadyToClaim: false,
    };

    this.activeShifts.set(userId, shift);

    audioService.play('click');
    notificationService.notify(
      userId,
      'info',
      `Смена начата: ${job.title}`,
      `Клиент: ${passenger}. Маршрут: ${dest}. Время в пути: ${durationSeconds} сек.`
    );

    return { success: true, shift };
  }

  public completeJobShift(userId: string): { success: boolean; error?: string; rewardMoney?: number; rewardXp?: number } {
    const shift = this.activeShifts.get(userId);
    if (!shift) return { success: false, error: 'Нет активной рабочей смены' };

    const now = Date.now();
    if (now < shift.endsAt) {
      const remainSec = Math.ceil((shift.endsAt - now) / 1000);
      return { success: false, error: `Маршрут еще не завершен! Осталось ${remainSec} сек.` };
    }

    const job = JOBS_CATALOG.find((j) => j.id === shift.jobId)!;

    // Set cooldown
    let userCdMap = this.userCooldowns.get(userId);
    if (!userCdMap) {
      userCdMap = new Map();
      this.userCooldowns.set(userId, userCdMap);
    }
    userCdMap.set(shift.jobId, now + job.cooldown_seconds * 1000);

    const tx: Transaction = {
      id: `tx_${Date.now()}_job_${shift.jobId}`,
      user_id: userId,
      type: 'job',
      amount: shift.payoutMoney,
      currency: 'cash',
      description: `Зарплата за смену: ${job.title}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money += shift.payoutMoney;
      draft.profiles[userId].total_earned += shift.payoutMoney;
      draft.profiles[userId].play_time_minutes += Math.round(job.shift_duration_seconds / 60) + 1;
      draft.transactions.unshift(tx);
    });

    playerService.giveXP(userId, shift.payoutXp);
    this.activeShifts.delete(userId);

    audioService.play('purchase');
    notificationService.notify(
      userId,
      'success',
      'Заказ выполнен!',
      `Вы получили $${shift.payoutMoney.toLocaleString('ru')} и +${shift.payoutXp} XP.`
    );

    return { success: true, rewardMoney: shift.payoutMoney, rewardXp: shift.payoutXp };
  }

  public cancelShift(userId: string) {
    this.activeShifts.delete(userId);
    notificationService.notify(userId, 'warning', 'Смена отменена', 'Вы сошли с маршрута.');
  }
}

export const jobService = new JobService();
