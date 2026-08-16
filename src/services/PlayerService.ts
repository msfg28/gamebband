import { dbEngine } from '../lib/storageEngine';
import { UserProfile, CharacterAppearance } from '../types';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';
import confetti from 'canvas-confetti';

class PlayerService {
  public getRequiredXPForNextLevel(level: number): number {
    return level * 300;
  }

  public getProfile(userId: string): UserProfile | null {
    return dbEngine.getState().profiles[userId] || null;
  }

  public getAllProfiles(): UserProfile[] {
    return Object.values(dbEngine.getState().profiles);
  }

  public giveXP(userId: string, xpAmount: number): { leveledUp: boolean; newLevel: number } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile || xpAmount <= 0) return { leveledUp: false, newLevel: profile?.level || 1 };

    let currentXP = profile.xp + xpAmount;
    let currentLevel = profile.level;
    let leveledUp = false;

    let required = this.getRequiredXPForNextLevel(currentLevel);
    while (currentXP >= required) {
      currentXP -= required;
      currentLevel += 1;
      leveledUp = true;
      required = this.getRequiredXPForNextLevel(currentLevel);
    }

    dbEngine.updateState((draft) => {
      if (draft.profiles[userId]) {
        draft.profiles[userId].xp = currentXP;
        draft.profiles[userId].level = currentLevel;

        if (leveledUp) {
          const levelReward = currentLevel * 5000;
          draft.profiles[userId].money += levelReward;
          draft.profiles[userId].total_earned += levelReward;
        }
      }
    });

    if (leveledUp) {
      audioService.play('levelUp');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      notificationService.notify(
        userId,
        'reward',
        'НОВЫЙ УРОВЕНЬ!',
        `Поздравляем! Вы достигли ${currentLevel}-го уровня и получили бонус $${(
          currentLevel * 5000
        ).toLocaleString('ru')}!`
      );
    }

    return { leveledUp, newLevel: currentLevel };
  }

  public updateCharacterAppearance(userId: string, character: Partial<CharacterAppearance>) {
    dbEngine.updateState((draft) => {
      if (draft.profiles[userId]) {
        draft.profiles[userId].character = {
          ...draft.profiles[userId].character,
          ...character,
        };
      }
    });

    audioService.play('click');
    notificationService.notify(
      userId,
      'success',
      'Внешний вид изменен',
      'Настройки персонажа успешно сохранены.'
    );
  }

  public updateAvatar(userId: string, avatarUrl: string) {
    dbEngine.updateState((draft) => {
      if (draft.profiles[userId]) {
        draft.profiles[userId].avatar_url = avatarUrl;
      }
    });
    audioService.play('click');
  }

  public updateStatus(userId: string, status: string) {
    const cleanStatus = status.trim().substring(0, 60);
    dbEngine.updateState((draft) => {
      if (draft.profiles[userId]) {
        draft.profiles[userId].status = cleanStatus;
      }
    });
    audioService.play('click');
  }

  public changeUsername(
    userId: string,
    newUsername: string
  ): { success: boolean; error?: string; username?: string } {
    const cleanName = newUsername.trim();
    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: 'Никнейм должен содержать минимум 3 символа' };
    }
    if (cleanName.length > 24) {
      return { success: false, error: 'Никнейм не должен превышать 24 символа' };
    }

    // Allowed characters: latin, cyrillic, numbers, underscore, hyphen, space
    const validPattern = /^[a-zA-Z0-9а-яА-ЯёЁ_ -]+$/;
    if (!validPattern.test(cleanName)) {
      return {
        success: false,
        error: 'Никнейм может содержать только буквы, цифры, пробел, дефис и подчеркивание',
      };
    }

    const state = dbEngine.getState();
    const currentProfile = state.profiles[userId];
    if (!currentProfile) {
      return { success: false, error: 'Профиль игрока не найден' };
    }

    if (currentProfile.username.toLowerCase() === cleanName.toLowerCase()) {
      return { success: false, error: 'Новый никнейм совпадает с текущим' };
    }

    // Check collision with another user
    const existing = Object.values(state.profiles).find(
      (p) => p.id !== userId && p.username.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'Игрок с таким никнеймом уже зарегистрирован на сервере' };
    }

    const oldUsername = currentProfile.username;

    dbEngine.updateState((draft) => {
      if (draft.profiles[userId]) {
        draft.profiles[userId].username = cleanName;
      }

      // Update clan leadership if user is leader
      draft.clans.forEach((clan) => {
        if (clan.leader_id === userId) {
          clan.leader_name = cleanName;
        }
      });

      // Add system log
      draft.adminLogs.unshift({
        id: `alog_nick_${Date.now()}`,
        admin_id: userId,
        admin_name: cleanName,
        admin_level: currentProfile.admin_level,
        target_user_id: userId,
        target_username: cleanName,
        action: 'CHANGE_NICKNAME',
        command: `/rename ${cleanName}`,
        details: `Игрок сменил ник с "${oldUsername}" на "${cleanName}"`,
        created_at: new Date().toISOString(),
      });
    });

    audioService.play('levelUp');
    notificationService.notify(
      userId,
      'success',
      'Никнейм изменен!',
      `Ваш никнейм успешно изменен на «${cleanName}».`
    );

    return { success: true, username: cleanName };
  }

  public getPlayerStats(userId: string) {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    const inventory = state.inventory[userId] || [];
    const vehicles = state.vehicles[userId] || [];
    const missions = state.missions[userId] || [];
    const achievements = state.achievements[userId] || [];
    const clan = state.clans.find((c) => c.id === profile?.clan_id);

    return {
      profile,
      inventoryCount: inventory.reduce((acc, item) => acc + item.quantity, 0),
      vehiclesCount: vehicles.length,
      completedMissionsCount: missions.filter((m) => m.is_completed || m.is_claimed).length,
      unlockedAchievementsCount: achievements.filter((a) => a.is_unlocked).length,
      clanName: clan?.name || 'Без клана',
      totalEarned: profile?.total_earned || 0,
      totalSpent: profile?.total_spent || 0,
      playTimeHours: ((profile?.play_time_minutes || 0) / 60).toFixed(1),
    };
  }
}

export const playerService = new PlayerService();
