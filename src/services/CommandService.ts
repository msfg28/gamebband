import { UserProfile, AdminLevel } from '../types';
import { adminService } from './AdminService';
import { playerService } from './PlayerService';
import { dbEngine } from '../lib/storageEngine';
import { INITIAL_ITEMS, INITIAL_VEHICLES } from '../data/gameData';

export interface CommandHelpItem {
  command: string;
  syntax: string;
  description: string;
  minLevel: AdminLevel;
}

export const ALL_COMMANDS_HELP: CommandHelpItem[] = [
  {
    command: '/ahelp',
    syntax: '/ahelp',
    description: 'Список доступных административных команд для вашего уровня',
    minLevel: 1,
  },
  {
    command: '/rename',
    syntax: '/rename <новый_ник>',
    description: 'Сменить никнейм своего текущего аккаунта',
    minLevel: 0,
  },
  {
    command: '/setname',
    syntax: '/setname <старый_ник> <новый_ник>',
    description: 'Сменить никнейм указанному игроку (Admin 3+)',
    minLevel: 3,
  },
  {
    command: '/warn',
    syntax: '/warn <username> <причина>',
    description: 'Выдать предупреждение игроку (3 предупреждения = бан на 7 дней)',
    minLevel: 1,
  },
  {
    command: '/mute',
    syntax: '/mute <username> <минуты> <причина>',
    description: 'Заблокировать чат игроку на указанное время',
    minLevel: 1,
  },
  {
    command: '/unmute',
    syntax: '/unmute <username>',
    description: 'Снять блокировку чата с игрока',
    minLevel: 1,
  },
  {
    command: '/kick',
    syntax: '/kick <username> <причина>',
    description: 'Принудительно отключить игрока от сервера',
    minLevel: 2,
  },
  {
    command: '/ban',
    syntax: '/ban <username> <время: 30m/2h/7d/perm> <причина>',
    description: 'Заблокировать аккаунт игрока на срок или навсегда',
    minLevel: 3,
  },
  {
    command: '/unban',
    syntax: '/unban <username>',
    description: 'Разблокировать ранее забаненный аккаунт',
    minLevel: 3,
  },
  {
    command: '/logs',
    syntax: '/logs [username]',
    description: 'Просмотр последних действий администрации и сервера',
    minLevel: 3,
  },
  {
    command: '/givemoney',
    syntax: '/givemoney <username> <сумма>',
    description: 'Выдать наличные деньги игроку',
    minLevel: 4,
  },
  {
    command: '/removemoney',
    syntax: '/removemoney <username> <сумма>',
    description: 'Списать наличные деньги у игрока',
    minLevel: 4,
  },
  {
    command: '/giveitem',
    syntax: '/giveitem <username> <item_id> [кол-во]',
    description: 'Выдать предмет в инвентарь игрока (например: wpn_ak47, wpn_deagle)',
    minLevel: 3.5,
  },
  {
    command: '/givevehicle',
    syntax: '/givevehicle <username> <vehicle_id>',
    description: 'Выдать эксклюзивный транспорт в гараж (например: veh_bmw_m5, veh_porsche_911)',
    minLevel: 3.5,
  },
  {
    command: '/setlevel',
    syntax: '/setlevel <username> <уровень>',
    description: 'Установить уровень персонажа',
    minLevel: 4,
  },
  {
    command: '/setadmin',
    syntax: '/setadmin <username> <уровень 0-5>',
    description: 'Назначить или изменить должность администратора (только Owner)',
    minLevel: 5,
  },
];

class CommandService {
  private commandHistory: string[] = [];

  public getHistory(): string[] {
    return this.commandHistory;
  }

  public getAvailableCommandsForUser(adminLevel: AdminLevel): CommandHelpItem[] {
    return ALL_COMMANDS_HELP.filter((c) => adminLevel >= c.minLevel);
  }

  public executeCommand(
    admin: UserProfile,
    rawInput: string
  ): { success: boolean; output: string | string[] } {
    const trimmed = rawInput.trim();
    if (!trimmed) return { success: false, output: 'Пустая команда' };

    this.commandHistory.push(trimmed);
    if (this.commandHistory.length > 50) {
      this.commandHistory.shift();
    }

    if (!trimmed.startsWith('/')) {
      return { success: false, output: 'Команды должны начинаться со знака "/" (например: /ahelp)' };
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 1. HELP & AHELP
    if (cmd === 'ahelp') {
      if (admin.admin_level < 1) {
        return { success: false, output: 'Вам недоступны команды администрации.' };
      }
      const available = this.getAvailableCommandsForUser(admin.admin_level);
      const lines = [
        `=== СПИСОК ДОСТУПНЫХ АДМИН-КОМАНД (Ваш уровень: ${admin.admin_level}) ===`,
        ...available.map((c) => `[LVL ${c.minLevel}] ${c.syntax} — ${c.description}`),
      ];
      return { success: true, output: lines };
    }

    if (cmd === 'help') {
      return {
        success: true,
        output: [
          '=== ИГРОВЫЕ КОМАНДЫ ===',
          '/help — список команд',
          '/ahelp — админ команды (для администрации)',
          'Ctrl+Q — быстрое открытие меню управления',
        ],
      };
    }

    // 2. /BAN <username> <time> <reason...>
    if (cmd === 'ban') {
      if (admin.admin_level < 3) {
        return { success: false, output: 'Команда /ban доступна только с 3-го уровня админки (Admin+)' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /ban Player123 30m Нарушение правил' };
      if (!args[1]) return { success: false, output: 'Укажите срок бана (например 30m, 2h, 7d, perm).' };
      if (!args[2]) return { success: false, output: 'Укажите причину блокировки.' };

      const targetUsername = args[0];
      const duration = args[1];
      const reason = args.slice(2).join(' ');

      const res = adminService.banPlayer(admin, targetUsername, duration, reason);
      return { success: res.success, output: res.message };
    }

    // 3. /UNBAN <username>
    if (cmd === 'unban') {
      if (admin.admin_level < 3) {
        return { success: false, output: 'Команда /unban доступна с 3-го уровня админки' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока для разблокировки. Пример: /unban Player123' };

      const res = adminService.unbanPlayer(admin, args[0]);
      return { success: res.success, output: res.message };
    }

    // 4. /KICK <username> <reason...>
    if (cmd === 'kick') {
      if (admin.admin_level < 2) {
        return { success: false, output: 'Команда /kick доступна с 2-го уровня админки (Moderator+)' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока для кика. Пример: /kick Player123 АФК на дороге' };
      if (!args[1]) return { success: false, output: 'Укажите причину кика.' };

      const targetUsername = args[0];
      const reason = args.slice(1).join(' ');
      const res = adminService.kickPlayer(admin, targetUsername, reason);
      return { success: res.success, output: res.message };
    }

    // 5. /WARN <username> <reason...>
    if (cmd === 'warn') {
      if (admin.admin_level < 1) {
        return { success: false, output: 'Команда /warn доступна с 1-го уровня админки' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /warn Player123 Оскорбление' };
      if (!args[1]) return { success: false, output: 'Укажите причину выдачи предупреждения.' };

      const targetUsername = args[0];
      const reason = args.slice(1).join(' ');
      const res = adminService.warnPlayer(admin, targetUsername, reason);
      return { success: res.success, output: res.message };
    }

    // 6. /MUTE <username> <minutes> <reason...>
    if (cmd === 'mute') {
      if (admin.admin_level < 1) {
        return { success: false, output: 'Команда /mute доступна с 1-го уровня админки' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /mute Player123 15 Спам в чат' };
      if (!args[1]) return { success: false, output: 'Укажите длительность мута в минутах.' };
      if (!args[2]) return { success: false, output: 'Укажите причину мута.' };

      const targetUsername = args[0];
      const minutes = parseInt(args[1]);
      if (isNaN(minutes) || minutes <= 0) return { success: false, output: 'Некорректное количество минут' };
      const reason = args.slice(2).join(' ');

      const res = adminService.mutePlayer(admin, targetUsername, minutes, reason);
      return { success: res.success, output: res.message };
    }

    // 7. /UNMUTE <username>
    if (cmd === 'unmute') {
      if (admin.admin_level < 1) {
        return { success: false, output: 'Команда доступна с 1-го уровня админки' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /unmute Player123' };

      const res = adminService.unmutePlayer(admin, args[0]);
      return { success: res.success, output: res.message };
    }

    // 8. /GIVEMONEY <username> <amount>
    if (cmd === 'givemoney') {
      if (admin.admin_level < 4) {
        return { success: false, output: 'Команда /givemoney доступна с 4-го уровня админки (Senior Admin+)' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /givemoney Player123 50000' };
      if (!args[1]) return { success: false, output: 'Укажите сумму для выдачи.' };

      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return { success: false, output: 'Некорректная сумма' };

      const res = adminService.giveMoney(admin, args[0], amount);
      return { success: res.success, output: res.message };
    }

    // 9. /REMOVEMONEY <username> <amount>
    if (cmd === 'removemoney') {
      if (admin.admin_level < 4) {
        return { success: false, output: 'Команда /removemoney доступна с 4-го уровня админки' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /removemoney Player123 20000' };
      if (!args[1]) return { success: false, output: 'Укажите сумму для списания.' };

      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return { success: false, output: 'Некорректная сумма' };

      const res = adminService.removeMoney(admin, args[0], amount);
      return { success: res.success, output: res.message };
    }

    // 10. /GIVEITEM <username> <item_id> [quantity]
    if (cmd === 'giveitem') {
      if (admin.admin_level < 3.5) {
        return { success: false, output: 'Команда /giveitem доступна с уровня 3.5 (Tech Admin+)' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /giveitem Player123 wpn_ak47 1' };
      if (!args[1]) {
        const sampleIds = INITIAL_ITEMS.map((i) => i.id).slice(0, 6).join(', ');
        return { success: false, output: `Укажите item_id. Доступные примеры: ${sampleIds}` };
      }

      const quantity = args[2] ? parseInt(args[2]) : 1;
      const res = adminService.giveItem(admin, args[0], args[1], isNaN(quantity) ? 1 : quantity);
      return { success: res.success, output: res.message };
    }

    // 11. /GIVEVEHICLE <username> <vehicle_id>
    if (cmd === 'givevehicle') {
      if (admin.admin_level < 3.5) {
        return { success: false, output: 'Команда /givevehicle доступна с уровня 3.5 (Tech Admin+)' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /givevehicle Player123 veh_bmw_m5' };
      if (!args[1]) {
        const sampleVehs = INITIAL_VEHICLES.map((v) => v.id).join(', ');
        return { success: false, output: `Укажите vehicle_id. Примеры: ${sampleVehs}` };
      }

      const res = adminService.giveVehicle(admin, args[0], args[1]);
      return { success: res.success, output: res.message };
    }

    // 12. /SETLEVEL <username> <level>
    if (cmd === 'setlevel') {
      if (admin.admin_level < 4) {
        return { success: false, output: 'Команда /setlevel доступна с 4-го уровня админки' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /setlevel Player123 10' };
      if (!args[1]) return { success: false, output: 'Укажите уровень (от 1 до 100).' };

      const lvl = parseInt(args[1]);
      if (isNaN(lvl) || lvl < 1) return { success: false, output: 'Некорректный уровень' };

      const res = adminService.setLevel(admin, args[0], lvl);
      return { success: res.success, output: res.message };
    }

    // 13. /SETADMIN <username> <level> (Owner Only)
    if (cmd === 'setadmin') {
      if (admin.admin_level !== 5) {
        return { success: false, output: 'Команда /setadmin доступна исключительно Создателю проекта (Owner Level 5)' };
      }
      if (!args[0]) return { success: false, output: 'Укажите ник игрока. Пример: /setadmin Player123 3' };
      if (!args[1]) return { success: false, output: 'Укажите уровень админки (0 - Игрок, 1 - Support, 2 - Mod, 3 - Admin, 3.5 - Tech, 4 - Senior, 5 - Owner).' };

      const targetLevel = parseFloat(args[1]) as AdminLevel;
      if (![0, 1, 2, 3, 3.5, 4, 5].includes(targetLevel)) {
        return { success: false, output: 'Недопустимый уровень. Допустимые: 0, 1, 2, 3, 3.5, 4, 5' };
      }

      const res = adminService.setAdminLevel(admin, args[0], targetLevel);
      return { success: res.success, output: res.message };
    }

    // 14. /RENAME <new_username>
    if (cmd === 'rename' || cmd === 'changename') {
      if (!args[0]) {
        return { success: false, output: 'Укажите новый никнейм. Пример: /rename Alexander_Great' };
      }
      const newName = args.join(' ');
      const res = playerService.changeUsername(admin.id, newName);
      if (res.success) {
        return { success: true, output: `Никнейм успешно изменен на «${res.username}»` };
      }
      return { success: false, output: res.error || 'Ошибка смены никнейма' };
    }

    // 15. /SETNAME <target_username> <new_username>
    if (cmd === 'setname') {
      if (admin.admin_level < 3) {
        return { success: false, output: 'Команда /setname доступна с 3-го уровня админки (Admin+)' };
      }
      if (!args[0]) {
        return { success: false, output: 'Укажите текущий ник игрока. Пример: /setname OldNick NewNick' };
      }
      if (!args[1]) {
        return { success: false, output: 'Укажите новый ник для игрока. Пример: /setname OldNick NewNick' };
      }

      const state = dbEngine.getState();
      const target = Object.values(state.profiles).find(
        (p) => p.username.toLowerCase() === args[0].toLowerCase()
      );
      if (!target) {
        return { success: false, output: `Игрок «${args[0]}» не найден в базе данных сервера.` };
      }

      const res = playerService.changeUsername(target.id, args.slice(1).join(' '));
      if (res.success) {
        return { success: true, output: `Никнейм игрока ${target.username} успешно изменен на «${res.username}»` };
      }
      return { success: false, output: res.error || 'Ошибка смены никнейма' };
    }

    // 16. /LOGS
    if (cmd === 'logs') {
      if (admin.admin_level < 3) {
        return { success: false, output: 'Просмотр логов доступен с 3-го уровня админки' };
      }
      const logs = dbEngine.getState().adminLogs.slice(0, 10);
      if (logs.length === 0) {
        return { success: true, output: 'Логи пока пусты.' };
      }
      const lines = [
        '=== ПОСЛЕДНИЕ СОБЫТИЯ АДМИНИСТРАЦИИ ===',
        ...logs.map(
          (l) =>
            `[${new Date(l.created_at).toLocaleTimeString()}] ${l.admin_name} -> ${l.target_username} | ${
              l.action
            }: ${l.details}`
        ),
      ];
      return { success: true, output: lines };
    }

    return {
      success: false,
      output: `Неизвестная команда "/${cmd}". Введите /ahelp для просмотра списка команд.`,
    };
  }
}

export const commandService = new CommandService();
