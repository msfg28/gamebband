import { dbEngine } from '../lib/storageEngine';
import { PlayerAchievement, Transaction } from '../types';
import { playerService } from './PlayerService';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class AchievementService {
  public getUserAchievements(userId: string): PlayerAchievement[] {
    const state = dbEngine.getState();
    return state.achievements[userId] || [];
  }

  public checkAchievements(userId: string) {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return;

    const vehicles = state.vehicles[userId] || [];
    const businesses = state.businesses.filter((b) => b.owner_id === userId);
    const achievements = state.achievements[userId] || [];

    achievements.forEach((pa) => {
      if (pa.is_unlocked) return;

      const ach = pa.achievement;
      let shouldUnlock = false;
      let currentProgress = pa.current_progress;

      switch (ach.condition_type) {
        case 'login':
          shouldUnlock = true;
          currentProgress = 1;
          break;
        case 'buy_vehicle':
          currentProgress = vehicles.length;
          shouldUnlock = vehicles.length >= ach.condition_value;
          break;
        case 'vehicles_count':
          currentProgress = vehicles.length;
          shouldUnlock = vehicles.length >= ach.condition_value;
          break;
        case 'bank_money':
          currentProgress = profile.bank_money;
          shouldUnlock = profile.bank_money >= ach.condition_value;
          break;
        case 'reach_level':
          currentProgress = profile.level;
          shouldUnlock = profile.level >= ach.condition_value;
          break;
        case 'own_business_and_clan':
          currentProgress = businesses.length > 0 && profile.clan_id ? 1 : 0;
          shouldUnlock = businesses.length > 0 && Boolean(profile.clan_id);
          break;
      }

      if (shouldUnlock) {
        this.unlockAchievement(userId, ach.id);
      } else {
        dbEngine.updateState((draft) => {
          const list = draft.achievements[userId] || [];
          const item = list.find((a) => a.achievement_id === ach.id);
          if (item) {
            item.current_progress = currentProgress;
          }
        });
      }
    });
  }

  private unlockAchievement(userId: string, achievementId: string) {
    const state = dbEngine.getState();
    const list = state.achievements[userId] || [];
    const target = list.find((a) => a.achievement_id === achievementId);
    if (!target || target.is_unlocked) return;

    const ach = target.achievement;
    const tx: Transaction = {
      id: `tx_${Date.now()}_ach_${ach.id}`,
      user_id: userId,
      type: 'reward',
      amount: ach.reward_money,
      currency: 'cash',
      description: `Достижение разблокировано: "${ach.title}"`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money += ach.reward_money;
      draft.profiles[userId].total_earned += ach.reward_money;

      const uList = draft.achievements[userId] || [];
      const item = uList.find((a) => a.achievement_id === achievementId);
      if (item) {
        item.is_unlocked = true;
        item.unlocked_at = new Date().toISOString();
        item.current_progress = ach.condition_value;
      }
      draft.transactions.unshift(tx);
    });

    playerService.giveXP(userId, ach.reward_xp);
    audioService.play('reward');
    notificationService.notify(
      userId,
      'reward',
      'ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО!',
      `Вы получили награду "${ach.title}": $${ach.reward_money.toLocaleString('ru')} и +${
        ach.reward_xp
      } XP!`
    );
  }
}

export const achievementService = new AchievementService();
