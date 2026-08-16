import { dbEngine } from '../lib/storageEngine';
import { AdminLevel, AdminPermission, AdminLog, UserProfile } from '../types';
import { ADMIN_ROLES, INITIAL_ITEMS, INITIAL_VEHICLES } from '../data/gameData';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class AdminService {
  public hasPermission(adminLevel: AdminLevel, permission: AdminPermission): boolean {
    const role = ADMIN_ROLES[String(adminLevel)];
    if (!role) return false;
    if (adminLevel === 5) return true; // Owner has all permissions
    return role.permissions.includes(permission);
  }

  public getAdminRoleInfo(adminLevel: AdminLevel) {
    return ADMIN_ROLES[String(adminLevel)] || ADMIN_ROLES['0'];
  }

  public logAction(
    admin: UserProfile,
    targetUser: UserProfile | { id: string; username: string },
    action: string,
    command: string,
    details: string
  ) {
    const log: AdminLog = {
      id: `alog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      admin_id: admin.id,
      admin_name: admin.username,
      admin_level: admin.admin_level,
      target_user_id: targetUser.id,
      target_username: targetUser.username,
      action,
      command,
      details,
      created_at: new Date().toISOString(),
      ip_hash: '127.0.0.1 (Verified)',
    };

    dbEngine.updateState((draft) => {
      draft.adminLogs.unshift(log);
      if (draft.adminLogs.length > 500) {
        draft.adminLogs.pop();
      }
    });
  }

  public banPlayer(
    admin: UserProfile,
    targetUsername: string,
    durationStr: string,
    reason: string
  ): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'BAN_PLAYER')) {
      return { success: false, message: 'У вас недостаточно прав для блокировки игроков (нужен Level 3+)' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    if (target.admin_level >= admin.admin_level && admin.admin_level !== 5) {
      return { success: false, message: 'Вы не можете заблокировать администратора равного или высшего уровня!' };
    }

    let banUntil: string | null = null;
    let durationLabel = 'Перманентно';
    if (durationStr && durationStr !== '0' && durationStr !== 'perm') {
      const num = parseInt(durationStr);
      if (!isNaN(num)) {
        if (durationStr.endsWith('m')) {
          banUntil = new Date(Date.now() + num * 60000).toISOString();
          durationLabel = `${num} минут`;
        } else if (durationStr.endsWith('h')) {
          banUntil = new Date(Date.now() + num * 3600000).toISOString();
          durationLabel = `${num} часов`;
        } else if (durationStr.endsWith('d')) {
          banUntil = new Date(Date.now() + num * 86400000).toISOString();
          durationLabel = `${num} дней`;
        }
      }
    }

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].is_banned = true;
        draft.profiles[target.id].ban_reason = reason;
        draft.profiles[target.id].ban_until = banUntil;
      }
    });

    const cmdStr = `/ban ${target.username} ${durationStr} ${reason}`;
    this.logAction(admin, target, 'BAN_PLAYER', cmdStr, `Срок: ${durationLabel}. Причина: ${reason}`);

    notificationService.notify(
      target.id,
      'admin',
      'БЛОКИРОВКА АККАУНТА',
      `Администратор ${admin.username} заблокировал ваш аккаунт. Срок: ${durationLabel}. Причина: ${reason}`
    );

    audioService.play('admin');
    return { success: true, message: `Игрок ${target.username} успешно заблокирован (${durationLabel}). Причина: ${reason}` };
  }

  public unbanPlayer(admin: UserProfile, targetUsername: string): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'BAN_PLAYER')) {
      return { success: false, message: 'Недостаточно прав для разблокировки' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].is_banned = false;
        draft.profiles[target.id].ban_reason = null;
        draft.profiles[target.id].ban_until = null;
      }
    });

    this.logAction(admin, target, 'UNBAN_PLAYER', `/unban ${target.username}`, 'Аккаунт разблокирован');
    return { success: true, message: `Игрок ${target.username} успешно разблокирован.` };
  }

  public kickPlayer(admin: UserProfile, targetUsername: string, reason: string): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'KICK_PLAYER')) {
      return { success: false, message: 'Недостаточно прав для кика игроков' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    this.logAction(admin, target, 'KICK_PLAYER', `/kick ${target.username} ${reason}`, `Причина: ${reason}`);

    notificationService.notify(
      target.id,
      'admin',
      'КИК С СЕРВЕРА',
      `Администратор ${admin.username} отключил вас от сервера. Причина: ${reason}`
    );

    return { success: true, message: `Игрок ${target.username} отключен от сервера. Причина: ${reason}` };
  }

  public warnPlayer(admin: UserProfile, targetUsername: string, reason: string): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'WARN_PLAYER')) {
      return { success: false, message: 'Недостаточно прав для выдачи предупреждений' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    let newWarns = target.warnings_count + 1;
    let autoBanned = false;

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].warnings_count = newWarns;
        if (newWarns >= 3) {
          draft.profiles[target.id].is_banned = true;
          draft.profiles[target.id].ban_reason = '3/3 Предупреждений от администрации';
          draft.profiles[target.id].ban_until = new Date(Date.now() + 7 * 86400000).toISOString();
          autoBanned = true;
        }
      }
    });

    this.logAction(
      admin,
      target,
      'WARN_PLAYER',
      `/warn ${target.username} ${reason}`,
      `Варнов: ${newWarns}/3. Причина: ${reason}${autoBanned ? ' (Авто-бан на 7 дней)' : ''}`
    );

    notificationService.notify(
      target.id,
      'admin',
      'ПРЕДУПРЕЖДЕНИЕ',
      `Администратор ${admin.username} выдал вам предупреждение (${newWarns}/3). Причина: ${reason}`
    );

    return {
      success: true,
      message: `Игроку ${target.username} выдано предупреждение (${newWarns}/3).${
        autoBanned ? ' Игрок получил 3/3 и заблокирован на 7 дней!' : ''
      }`,
    };
  }

  public mutePlayer(
    admin: UserProfile,
    targetUsername: string,
    minutes: number,
    reason: string
  ): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'MUTE_PLAYER')) {
      return { success: false, message: 'Недостаточно прав для мута' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    const muteUntil = new Date(Date.now() + minutes * 60000).toISOString();

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].is_muted = true;
        draft.profiles[target.id].mute_until = muteUntil;
      }
    });

    this.logAction(
      admin,
      target,
      'MUTE_PLAYER',
      `/mute ${target.username} ${minutes}m ${reason}`,
      `Срок: ${minutes} мин. Причина: ${reason}`
    );

    notificationService.notify(
      target.id,
      'admin',
      'БЛОКИРОВКА ЧАТА (МУТ)',
      `Администратор ${admin.username} заглушил вас на ${minutes} минут. Причина: ${reason}`
    );

    return { success: true, message: `Игроку ${target.username} выдан мут на ${minutes} мин.` };
  }

  public unmutePlayer(admin: UserProfile, targetUsername: string): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'MUTE_PLAYER')) {
      return { success: false, message: 'Недостаточно прав для снятия мута' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].is_muted = false;
        draft.profiles[target.id].mute_until = null;
      }
    });

    this.logAction(admin, target, 'UNMUTE_PLAYER', `/unmute ${target.username}`, 'Снят мут чата');
    return { success: true, message: `С игрока ${target.username} снят мут.` };
  }

  public giveMoney(admin: UserProfile, targetUsername: string, amount: number): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'EDIT_ECONOMY')) {
      return { success: false, message: 'Недостаточно прав для изменения баланса (нужен Level 4+)' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].money += amount;
        draft.profiles[target.id].total_earned += amount;
      }
    });

    this.logAction(
      admin,
      target,
      'GIVE_MONEY',
      `/givemoney ${target.username} ${amount}`,
      `Выдано $${amount.toLocaleString('ru')} наличными`
    );

    notificationService.notify(
      target.id,
      'admin',
      'ВЫПЛАТА ОТ АДМИНИСТРАЦИИ',
      `Администратор ${admin.username} выдал вам $${amount.toLocaleString('ru')}.`
    );

    return { success: true, message: `Игроку ${target.username} успешно выдано $${amount.toLocaleString('ru')}.` };
  }

  public removeMoney(admin: UserProfile, targetUsername: string, amount: number): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'EDIT_ECONOMY')) {
      return { success: false, message: 'Недостаточно прав для изменения баланса' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].money = Math.max(0, draft.profiles[target.id].money - amount);
      }
    });

    this.logAction(
      admin,
      target,
      'REMOVE_MONEY',
      `/removemoney ${target.username} ${amount}`,
      `Списано $${amount.toLocaleString('ru')}`
    );

    return { success: true, message: `У игрока ${target.username} списано $${amount.toLocaleString('ru')}.` };
  }

  public giveItem(
    admin: UserProfile,
    targetUsername: string,
    itemId: string,
    quantity: number = 1
  ): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'EDIT_INVENTORY')) {
      return { success: false, message: 'Недостаточно прав для выдачи предметов' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    const item = INITIAL_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, message: `Предмет с ID "${itemId}" не найден` };

    dbEngine.updateState((draft) => {
      if (!draft.inventory[target.id]) {
        draft.inventory[target.id] = [];
      }
      draft.inventory[target.id].push({
        id: `inv_${Date.now()}_adm`,
        item_id: itemId,
        item,
        quantity,
        is_equipped: false,
        created_at: new Date().toISOString(),
      });
    });

    this.logAction(
      admin,
      target,
      'GIVE_ITEM',
      `/giveitem ${target.username} ${itemId} ${quantity}`,
      `Выдан предмет: ${item.name} x${quantity}`
    );

    return { success: true, message: `Игроку ${target.username} выдан предмет "${item.name}" (x${quantity}).` };
  }

  public giveVehicle(
    admin: UserProfile,
    targetUsername: string,
    vehicleId: string
  ): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'EDIT_VEHICLES')) {
      return { success: false, message: 'Недостаточно прав для выдачи транспорта' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    const vehicle = INITIAL_VEHICLES.find((v) => v.id === vehicleId);
    if (!vehicle) return { success: false, message: `Транспорт "${vehicleId}" не найден` };

    const plate = `ADM${Math.floor(100 + Math.random() * 900)}77`;

    dbEngine.updateState((draft) => {
      if (!draft.vehicles[target.id]) {
        draft.vehicles[target.id] = [];
      }
      draft.vehicles[target.id].push({
        id: `pveh_adm_${Date.now()}`,
        vehicle_id: vehicle.id,
        vehicle,
        custom_name: vehicle.name,
        fuel: 100,
        durability: 100,
        license_plate: plate,
        upgrades: {
          engine: 5,
          brakes: 5,
          handling: 5,
          armor: 5,
          turbo: 5,
          color: '#18181b',
        },
        is_active: false,
        purchased_at: new Date().toISOString(),
      });
    });

    this.logAction(
      admin,
      target,
      'GIVE_VEHICLE',
      `/givevehicle ${target.username} ${vehicleId}`,
      `Выдан полностью тюнингованный автомобиль: ${vehicle.name} [${plate}]`
    );

    return {
      success: true,
      message: `Игроку ${target.username} выдан эксклюзивный автомобиль "${vehicle.name}" [${plate}].`,
    };
  }

  public setLevel(admin: UserProfile, targetUsername: string, level: number): { success: boolean; message: string } {
    if (!this.hasPermission(admin.admin_level, 'EDIT_ECONOMY')) {
      return { success: false, message: 'Недостаточно прав для изменения уровня' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].level = Math.max(1, level);
        draft.profiles[target.id].xp = 0;
      }
    });

    this.logAction(admin, target, 'SET_LEVEL', `/setlevel ${target.username} ${level}`, `Установлен уровень: ${level}`);
    return { success: true, message: `Игроку ${target.username} установлен уровень ${level}.` };
  }

  public setAdminLevel(
    ownerAdmin: UserProfile,
    targetUsername: string,
    targetAdminLevel: AdminLevel
  ): { success: boolean; message: string } {
    if (ownerAdmin.admin_level !== 5) {
      return { success: false, message: 'Только Создатель (Owner Level 5) может назначать права администраторов!' };
    }

    const state = dbEngine.getState();
    const target = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );
    if (!target) return { success: false, message: `Игрок "${targetUsername}" не найден` };

    dbEngine.updateState((draft) => {
      if (draft.profiles[target.id]) {
        draft.profiles[target.id].admin_level = targetAdminLevel;
      }
    });

    const roleName = ADMIN_ROLES[String(targetAdminLevel)].name;
    this.logAction(
      ownerAdmin,
      target,
      'MANAGE_ADMINS',
      `/setadmin ${target.username} ${targetAdminLevel}`,
      `Назначена должность: ${roleName}`
    );

    notificationService.notify(
      target.id,
      'reward',
      'НАЗНАЧЕНИЕ В АДМИНИСТРАЦИЮ',
      `Создатель проекта назначил вас на должность: ${roleName}!`
    );

    return { success: true, message: `Игрок ${target.username} назначен на роль "${roleName}".` };
  }

  public getAdminLogs(): AdminLog[] {
    return dbEngine.getState().adminLogs;
  }
}

export const adminService = new AdminService();
