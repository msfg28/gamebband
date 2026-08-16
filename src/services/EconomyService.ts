import { dbEngine } from '../lib/storageEngine';
import { Transaction } from '../types';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';
import { antiCheatService } from './AntiCheatService';

class EconomyService {
  public depositMoney(userId: string, amount: number): { success: boolean; error?: string } {
    if (amount <= 0) {
      return { success: false, error: 'Сумма должна быть больше $0' };
    }

    const check = antiCheatService.recordAction(userId, 'bank_deposit', {
      amount,
      maxAllowed: 50000000,
    });
    if (!check.isAllowed) {
      return { success: false, error: check.reason };
    }

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    if (profile.money < amount) {
      return { success: false, error: 'Недостаточно наличных средств для депозита' };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      type: 'deposit',
      amount,
      currency: 'bank',
      description: `Пополнение банковского счета на $${amount.toLocaleString('ru')}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= amount;
      draft.profiles[userId].bank_money += amount;
      draft.transactions.unshift(tx);
    });

    audioService.play('deposit');
    notificationService.notify(
      userId,
      'success',
      'Банк BANDIT',
      `Вы успешно внесли $${amount.toLocaleString('ru')} на банковский счет.`
    );

    return { success: true };
  }

  public withdrawMoney(userId: string, amount: number): { success: boolean; error?: string } {
    if (amount <= 0) {
      return { success: false, error: 'Сумма должна быть больше $0' };
    }

    const check = antiCheatService.recordAction(userId, 'bank_withdraw', {
      amount,
      maxAllowed: 50000000,
    });
    if (!check.isAllowed) {
      return { success: false, error: check.reason };
    }

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    if (profile.bank_money < amount) {
      return { success: false, error: 'Недостаточно средств на банковском счете' };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      type: 'withdraw',
      amount,
      currency: 'cash',
      description: `Снятие с банковского счета $${amount.toLocaleString('ru')}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].bank_money -= amount;
      draft.profiles[userId].money += amount;
      draft.transactions.unshift(tx);
    });

    audioService.play('purchase');
    notificationService.notify(
      userId,
      'success',
      'Банкомат',
      `Вы сняли со счета $${amount.toLocaleString('ru')} наличными.`
    );

    return { success: true };
  }

  public transferMoney(
    fromUserId: string,
    toUsername: string,
    amount: number
  ): { success: boolean; error?: string } {
    if (amount <= 0) {
      return { success: false, error: 'Сумма перевода должна быть больше $0' };
    }

    const cleanUsername = toUsername.trim();
    const state = dbEngine.getState();
    const sender = state.profiles[fromUserId];
    if (!sender) return { success: false, error: 'Отправитель не найден' };

    if (sender.username.toLowerCase() === cleanUsername.toLowerCase()) {
      return { success: false, error: 'Нельзя переводить деньги самому себе' };
    }

    if (sender.bank_money < amount) {
      return { success: false, error: 'Недостаточно денег на банковском счете' };
    }

    const recipient = Object.values(state.profiles).find(
      (p) => p.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (!recipient) {
      return { success: false, error: `Игрок с никнеймом "${cleanUsername}" не найден` };
    }

    const txSender: Transaction = {
      id: `tx_${Date.now()}_send`,
      user_id: fromUserId,
      type: 'transfer',
      amount,
      currency: 'bank',
      description: `Перевод игроку ${recipient.username} ($${amount.toLocaleString('ru')})`,
      created_at: new Date().toISOString(),
    };

    const txRecipient: Transaction = {
      id: `tx_${Date.now()}_recv`,
      user_id: recipient.id,
      type: 'transfer',
      amount,
      currency: 'bank',
      description: `Входящий перевод от ${sender.username} ($${amount.toLocaleString('ru')})`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[fromUserId].bank_money -= amount;
      draft.profiles[recipient.id].bank_money += amount;
      draft.profiles[recipient.id].total_earned += amount;
      draft.transactions.unshift(txSender, txRecipient);
    });

    audioService.play('deposit');
    notificationService.notify(
      fromUserId,
      'success',
      'Перевод выполнен',
      `Вы успешно перевели $${amount.toLocaleString('ru')} игроку ${recipient.username}.`
    );
    notificationService.notify(
      recipient.id,
      'reward',
      'Входящий перевод',
      `Игрок ${sender.username} перевел вам $${amount.toLocaleString('ru')} на банковский счет!`
    );

    return { success: true };
  }

  public getTransactions(userId?: string): Transaction[] {
    const all = dbEngine.getState().transactions;
    if (!userId) return all;
    return all.filter((t) => t.user_id === userId);
  }
}

export const economyService = new EconomyService();
