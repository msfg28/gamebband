import { dbEngine } from '../lib/storageEngine';
import { PlayerStatUpgrade, Transaction } from '../types';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';
import { INITIAL_STAT_UPGRADES } from '../data/gameData';

class UpgradeService {
  public getUserUpgrades(userId: string): PlayerStatUpgrade[] {
    const state = dbEngine.getState();
    const existing = state.statUpgrades[userId] || [];
    
    // Ensure all initial upgrades are present with user's current progress
    const merged: PlayerStatUpgrade[] = INITIAL_STAT_UPGRADES.map((base) => {
      const match = existing.find((u) => u.id === base.id);
      return {
        ...base,
        current_level: match ? match.current_level : 0,
      };
    });

    return merged;
  }

  public getUpgradeCost(upgrade: PlayerStatUpgrade): number {
    return Math.round(upgrade.base_price * Math.pow(upgrade.price_multiplier, upgrade.current_level));
  }

  public getUpgradeLevel(userId: string, upgradeId: string): number {
    const upgrades = this.getUserUpgrades(userId);
    const target = upgrades.find((u) => u.id === upgradeId);
    return target ? target.current_level : 0;
  }

  public purchaseUpgrade(userId: string, upgradeId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const upgrades = this.getUserUpgrades(userId);
    const target = upgrades.find((u) => u.id === upgradeId);
    if (!target) return { success: false, error: 'Улучшение не найдено' };

    if (target.current_level >= target.max_level) {
      return { success: false, error: 'Достигнут максимальный уровень навыка' };
    }

    const nextLevel = target.current_level + 1;
    const cost = this.getUpgradeCost(target);

    if (profile.money < cost) {
      return {
        success: false,
        error: `Недостаточно наличных средств. Требуется $${cost.toLocaleString('ru')}`,
      };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_upg_${target.id}`,
      user_id: userId,
      type: 'purchase',
      amount: cost,
      currency: 'cash',
      description: `Прокачка навыка "${target.name}" до уровня ${nextLevel}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= cost;
      draft.profiles[userId].total_spent += cost;

      if (!draft.statUpgrades[userId]) {
        draft.statUpgrades[userId] = INITIAL_STAT_UPGRADES.map((u) => ({ ...u }));
      }

      const list = draft.statUpgrades[userId];
      let item = list.find((u) => u.id === upgradeId);
      if (!item) {
        const base = INITIAL_STAT_UPGRADES.find((u) => u.id === upgradeId);
        if (base) {
          item = { ...base, current_level: nextLevel };
          list.push(item);
        }
      } else {
        item.current_level = nextLevel;
      }

      draft.transactions.unshift(tx);
    });

    audioService.play('levelUp');
    notificationService.notify(
      userId,
      'reward',
      'Навык улучшен!',
      `Вы прокачали "${target.name}" до ${nextLevel}-го уровня!`
    );

    return { success: true };
  }
}

export const upgradeService = new UpgradeService();
