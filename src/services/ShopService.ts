import { dbEngine } from '../lib/storageEngine';
import { Item, Transaction } from '../types';
import { INITIAL_ITEMS } from '../data/gameData';
import { inventoryService } from './InventoryService';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class ShopService {
  public getCatalogItems(category?: string): Item[] {
    if (!category || category === 'all') {
      return INITIAL_ITEMS;
    }
    return INITIAL_ITEMS.filter((i) => i.category === category);
  }

  public buyItem(
    userId: string,
    itemId: string,
    quantity: number = 1
  ): { success: boolean; error?: string } {
    if (quantity <= 0) return { success: false, error: 'Некорректное количество' };

    const item = INITIAL_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, error: 'Товар не найден' };

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const totalPrice = item.price * quantity;
    if (profile.money < totalPrice) {
      return {
        success: false,
        error: `Недостаточно наличных средств. Требуется $${totalPrice.toLocaleString(
          'ru'
        )} (в наличии $${profile.money.toLocaleString('ru')})`,
      };
    }

    // Check inventory weight
    const curWeight = inventoryService.getCurrentWeight(userId);
    const maxWeight = inventoryService.getMaxWeight(userId);
    const addedWeight = item.weight * quantity;

    if (curWeight + addedWeight > maxWeight) {
      return {
        success: false,
        error: `Недостаточно места в рюкзаке по весу. Свободно ${(maxWeight - curWeight).toFixed(
          1
        )} кг, требуется ${addedWeight.toFixed(1)} кг`,
      };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_shop`,
      user_id: userId,
      type: 'purchase',
      amount: totalPrice,
      currency: 'cash',
      description: `Покупка товара "${item.name}" x${quantity}`,
      created_at: new Date().toISOString(),
    };

    // Deduct money & add to inventory
    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= totalPrice;
      draft.profiles[userId].total_spent += totalPrice;
      draft.transactions.unshift(tx);
    });

    inventoryService.addItem(userId, itemId, quantity);

    audioService.play('purchase');
    notificationService.notify(
      userId,
      'success',
      'Магазин BANDIT',
      `Вы приобрели "${item.name}" (x${quantity}) за $${totalPrice.toLocaleString('ru')}.`
    );

    return { success: true };
  }
}

export const shopService = new ShopService();
