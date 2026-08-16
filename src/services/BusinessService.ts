import { dbEngine } from '../lib/storageEngine';
import { Business, Transaction } from '../types';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class BusinessService {
  public getAllBusinesses(): Business[] {
    const list = dbEngine.getState().businesses;
    // Calculate passive profit accumulation
    const now = Date.now();
    return list.map((b) => {
      if (b.owner_id) {
        const lastCollected = new Date(b.last_collected_at).getTime();
        const hoursPassed = (now - lastCollected) / (1000 * 3600);
        const netHourly = Math.max(0, b.hourly_profit - b.hourly_expenses);
        const newAccumulated = Math.min(
          b.max_storage,
          Math.floor(b.current_storage + hoursPassed * netHourly)
        );
        return {
          ...b,
          current_storage: newAccumulated,
        };
      }
      return b;
    });
  }

  public buyBusiness(userId: string, businessId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const business = state.businesses.find((b) => b.id === businessId);
    if (!business) return { success: false, error: 'Бизнес не найден' };

    if (business.owner_id) {
      return { success: false, error: 'Этот бизнес уже имеет владельца!' };
    }

    if (profile.bank_money < business.price) {
      return {
        success: false,
        error: `Недостаточно денег на банковском счете. Требуется $${business.price.toLocaleString(
          'ru'
        )}`,
      };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_biz_buy`,
      user_id: userId,
      type: 'purchase',
      amount: business.price,
      currency: 'bank',
      description: `Приобретение бизнеса: ${business.name}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].bank_money -= business.price;
      draft.profiles[userId].total_spent += business.price;

      const targetBiz = draft.businesses.find((b) => b.id === businessId);
      if (targetBiz) {
        targetBiz.owner_id = userId;
        targetBiz.owner_name = profile.username;
        targetBiz.last_collected_at = new Date().toISOString();
        targetBiz.current_storage = 0;
      }
      draft.transactions.unshift(tx);
    });

    audioService.play('purchase');
    notificationService.notify(
      userId,
      'reward',
      'Бизнес приобретен!',
      `Поздравляем! Вы стали полноправным владельцем "${business.name}".`
    );

    return { success: true };
  }

  public upgradeBusiness(userId: string, businessId: string): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const business = state.businesses.find((b) => b.id === businessId);
    if (!business || business.owner_id !== userId) {
      return { success: false, error: 'Вы не являетесь владельцем этого бизнеса' };
    }

    if (business.level >= 5) {
      return { success: false, error: 'Достигнут максимальный уровень предприятия (5/5)' };
    }

    const upgradeCost = Math.floor(business.price * 0.35 * business.level);
    if (profile.bank_money < upgradeCost) {
      return {
        success: false,
        error: `Недостаточно средств в банке. Стоимость улучшения: $${upgradeCost.toLocaleString(
          'ru'
        )}`,
      };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_biz_upg`,
      user_id: userId,
      type: 'purchase',
      amount: upgradeCost,
      currency: 'bank',
      description: `Модернизация бизнеса ${business.name} до уровня ${business.level + 1}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].bank_money -= upgradeCost;
      draft.profiles[userId].total_spent += upgradeCost;

      const targetBiz = draft.businesses.find((b) => b.id === businessId);
      if (targetBiz) {
        targetBiz.level += 1;
        targetBiz.hourly_profit = Math.round(targetBiz.hourly_profit * 1.45);
        targetBiz.max_storage = Math.round(targetBiz.max_storage * 1.5);
        targetBiz.employees_count += 3;
      }
      draft.transactions.unshift(tx);
    });

    audioService.play('reward');
    notificationService.notify(
      userId,
      'reward',
      'Бизнес улучшен!',
      `Предприятие "${business.name}" расширено до ${business.level + 1}-го уровня!`
    );

    return { success: true };
  }

  public collectProfit(userId: string, businessId: string): { success: boolean; error?: string; collected?: number } {
    const list = this.getAllBusinesses();
    const business = list.find((b) => b.id === businessId);
    if (!business || business.owner_id !== userId) {
      return { success: false, error: 'Вы не являетесь владельцем этого бизнеса' };
    }

    const amount = business.current_storage || 0;
    if (amount <= 0) {
      return { success: false, error: 'В кассе предприятия пока нет накопленной прибыли' };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_biz_collect`,
      user_id: userId,
      type: 'business',
      amount,
      currency: 'bank',
      description: `Инкассация выручки предприятия: ${business.name}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].bank_money += amount;
      draft.profiles[userId].total_earned += amount;

      const targetBiz = draft.businesses.find((b) => b.id === businessId);
      if (targetBiz) {
        targetBiz.current_storage = 0;
        targetBiz.last_collected_at = new Date().toISOString();
      }
      draft.transactions.unshift(tx);
    });

    audioService.play('deposit');
    notificationService.notify(
      userId,
      'success',
      'Выручка инкассирована',
      `Сумма $${amount.toLocaleString('ru')} перечислена на ваш банковский счет.`
    );

    return { success: true, collected: amount };
  }
}

export const businessService = new BusinessService();
