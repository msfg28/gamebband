import { dbEngine } from '../lib/storageEngine';
import { Clan, ClanMember, ClanMessage, ClanRank } from '../types';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class ClanService {
  public getAllClans(): Clan[] {
    return dbEngine.getState().clans;
  }

  public getClanById(clanId: string): Clan | null {
    return dbEngine.getState().clans.find((c) => c.id === clanId) || null;
  }

  public getUserClan(userId: string): Clan | null {
    const profile = dbEngine.getState().profiles[userId];
    if (!profile || !profile.clan_id) return null;
    return this.getClanById(profile.clan_id);
  }

  public joinClan(userId: string, clanId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    if (profile.clan_id) {
      return { success: false, error: 'Вы уже состоите в клане! Сначала покиньте текущий.' };
    }

    const clan = state.clans.find((c) => c.id === clanId);
    if (!clan) return { success: false, error: 'Клан не найден' };

    if (clan.members.length >= clan.max_members) {
      return { success: false, error: `В клане достигнут лимит участников (${clan.max_members}/${clan.max_members})` };
    }

    const newMember: ClanMember = {
      user_id: userId,
      username: profile.username,
      avatar_url: profile.avatar_url,
      level: profile.level,
      rank: 'Member',
      joined_at: new Date().toISOString(),
      donations: 0,
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].clan_id = clanId;
      const targetClan = draft.clans.find((c) => c.id === clanId);
      if (targetClan) {
        targetClan.members.push(newMember);
      }
    });

    audioService.play('reward');
    notificationService.notify(
      userId,
      'success',
      'Вступление в клан',
      `Вы успешно вступили в синдикат "${clan.name}" [${clan.tag}]!`
    );

    return { success: true };
  }

  public leaveClan(userId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile || !profile.clan_id) return { success: false, error: 'Вы не состоите в клане' };

    const clan = state.clans.find((c) => c.id === profile.clan_id);
    if (!clan) return { success: false, error: 'Клан не найден' };

    const memberEntry = clan.members.find((m) => m.user_id === userId);
    if (memberEntry?.rank === 'Leader' && clan.members.length > 1) {
      return {
        success: false,
        error: 'Лидер не может покинуть клан, пока в нем есть участники. Передайте лидерство заместителю.',
      };
    }

    dbEngine.updateState((draft) => {
      draft.profiles[userId].clan_id = null;
      const targetClan = draft.clans.find((c) => c.id === profile.clan_id);
      if (targetClan) {
        targetClan.members = targetClan.members.filter((m) => m.user_id !== userId);
      }
    });

    audioService.play('click');
    notificationService.notify(userId, 'warning', 'Клан покинут', `Вы вышли из клана "${clan.name}".`);

    return { success: true };
  }

  public depositToClan(userId: string, amount: number): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: 'Сумма должна быть больше $0' };

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile || !profile.clan_id) return { success: false, error: 'Вы не состоите в клане' };

    if (profile.money < amount) {
      return { success: false, error: 'Недостаточно наличных средств' };
    }

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= amount;
      const clan = draft.clans.find((c) => c.id === profile.clan_id);
      if (clan) {
        clan.balance += amount;
        const member = clan.members.find((m) => m.user_id === userId);
        if (member) {
          member.donations += amount;
        }
      }
    });

    audioService.play('deposit');
    notificationService.notify(
      userId,
      'success',
      'Казна клана пополнена',
      `Вы внесли $${amount.toLocaleString('ru')} в общак клана.`
    );

    return { success: true };
  }

  public changeMemberRank(
    leaderUserId: string,
    targetUserId: string,
    newRank: ClanRank
  ): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const leaderProfile = state.profiles[leaderUserId];
    if (!leaderProfile || !leaderProfile.clan_id) return { success: false, error: 'Лидер не найден' };

    const clan = state.clans.find((c) => c.id === leaderProfile.clan_id);
    if (!clan) return { success: false, error: 'Клан не найден' };

    const leaderMember = clan.members.find((m) => m.user_id === leaderUserId);
    if (leaderMember?.rank !== 'Leader') {
      return { success: false, error: 'Только Лидер клана может изменять ранги участников' };
    }

    dbEngine.updateState((draft) => {
      const targetClan = draft.clans.find((c) => c.id === leaderProfile.clan_id);
      if (targetClan) {
        const member = targetClan.members.find((m) => m.user_id === targetUserId);
        if (member) {
          member.rank = newRank;
        }
      }
    });

    notificationService.notify(
      targetUserId,
      'info',
      'Ранг в клане изменен',
      `Лидер назначил вам новый ранг: [${newRank}]`
    );

    return { success: true };
  }

  public kickMember(leaderUserId: string, targetUserId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const leaderProfile = state.profiles[leaderUserId];
    if (!leaderProfile || !leaderProfile.clan_id) return { success: false, error: 'Ошибка доступа' };

    const clan = state.clans.find((c) => c.id === leaderProfile.clan_id);
    if (!clan) return { success: false, error: 'Клан не найден' };

    const leaderMember = clan.members.find((m) => m.user_id === leaderUserId);
    if (leaderMember?.rank !== 'Leader' && leaderMember?.rank !== 'Deputy') {
      return { success: false, error: 'Недостаточно прав для исключения' };
    }

    dbEngine.updateState((draft) => {
      draft.profiles[targetUserId].clan_id = null;
      const targetClan = draft.clans.find((c) => c.id === leaderProfile.clan_id);
      if (targetClan) {
        targetClan.members = targetClan.members.filter((m) => m.user_id !== targetUserId);
      }
    });

    notificationService.notify(
      targetUserId,
      'warning',
      'Исключение из клана',
      `Вы были исключены из синдиката "${clan.name}".`
    );

    return { success: true };
  }
}

export const clanService = new ClanService();
