import { dbEngine } from '../lib/storageEngine';
import { PlayerMission, Transaction } from '../types';
import { playerService } from './PlayerService';
import { inventoryService } from './InventoryService';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class MissionService {
  public getUserMissions(userId: string): PlayerMission[] {
    const state = dbEngine.getState();
    return state.missions[userId] || [];
  }

  public recordAction(userId: string, actionType: string, count: number = 1) {
    dbEngine.updateState((draft) => {
      const list = draft.missions[userId] || [];
      list.forEach((pm) => {
        if (!pm.is_completed && pm.mission.target_action === actionType) {
          pm.progress = Math.min(pm.mission.target_count, pm.progress + count);
          if (pm.progress >= pm.mission.target_count) {
            pm.is_completed = true;
          }
          pm.updated_at = new Date().toISOString();
        }
      });
    });
  }

  public claimReward(userId: string, missionId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const userMissions = state.missions[userId] || [];
    const target = userMissions.find((m) => m.id === missionId || m.mission_id === missionId);

    if (!target) return { success: false, error: 'Задание не найдено' };
    if (!target.is_completed) return { success: false, error: 'Задание еще не выполнено!' };
    if (target.is_claimed) return { success: false, error: 'Награда за это задание уже получена' };

    const mission = target.mission;
    const tx: Transaction = {
      id: `tx_${Date.now()}_mis_rew`,
      user_id: userId,
      type: 'reward',
      amount: mission.reward_money,
      currency: 'cash',
      description: `Награда за выполнение задания "${mission.title}"`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money += mission.reward_money;
      draft.profiles[userId].total_earned += mission.reward_money;

      const list = draft.missions[userId] || [];
      const m = list.find((item) => item.id === target.id);
      if (m) {
        m.is_claimed = true;
      }
      draft.transactions.unshift(tx);
    });

    playerService.giveXP(userId, mission.reward_xp);

    if (mission.reward_item_id) {
      inventoryService.addItem(userId, mission.reward_item_id, 1);
    }

    audioService.play('reward');
    notificationService.notify(
      userId,
      'reward',
      'Награда получена!',
      `Задание "${mission.title}" закрыто! Получено $${mission.reward_money.toLocaleString(
        'ru'
      )} и +${mission.reward_xp} XP.`
    );

    return { success: true };
  }
}

export const missionService = new MissionService();
