import { dbEngine } from '../lib/storageEngine';
import { InventoryItem, Item } from '../types';
import { INITIAL_ITEMS } from '../data/gameData';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class InventoryService {
  public getMaxWeight(userId: string): number {
    const state = dbEngine.getState();
    const upgrades = state.statUpgrades[userId] || [];
    const invUpgrade = upgrades.find((u) => u.id === 'upg_inventory_cap');
    const bonus = (invUpgrade?.current_level || 0) * 5;
    return 30 + bonus; // 30kg default + upgrades
  }

  public getCurrentWeight(userId: string): number {
    const inventory = this.getUserInventory(userId);
    return Number(
      inventory
        .reduce((sum, item) => sum + (item.item?.weight || 0.5) * item.quantity, 0)
        .toFixed(2)
    );
  }

  public getUserInventory(userId: string): InventoryItem[] {
    const state = dbEngine.getState();
    const list = state.inventory[userId] || [];
    // Ensure nested item object is populated if missing
    return list.map((inv) => {
      if (!inv.item) {
        const found = INITIAL_ITEMS.find((i) => i.id === inv.item_id);
        return {
          ...inv,
          item: found || {
            id: inv.item_id,
            name: 'Неизвестный предмет',
            description: 'Информация отсутствует',
            icon: 'HelpCircle',
            category: 'special',
            rarity: 'COMMON',
            price: 100,
            weight: 0.5,
            max_stack: 10,
          },
        };
      }
      return inv;
    });
  }

  public addItem(
    userId: string,
    itemId: string,
    quantity: number = 1
  ): { success: boolean; error?: string } {
    if (quantity <= 0) return { success: false, error: 'Количество должно быть больше 0' };

    const itemDef = INITIAL_ITEMS.find((i) => i.id === itemId);
    if (!itemDef) return { success: false, error: 'Предмет не найден в каталоге' };

    const maxWeight = this.getMaxWeight(userId);
    const curWeight = this.getCurrentWeight(userId);
    const addedWeight = itemDef.weight * quantity;

    if (curWeight + addedWeight > maxWeight) {
      return {
        success: false,
        error: `Превышен максимальный вес инвентаря (${(curWeight + addedWeight).toFixed(
          1
        )}/${maxWeight} кг)`,
      };
    }

    dbEngine.updateState((draft) => {
      if (!draft.inventory[userId]) {
        draft.inventory[userId] = [];
      }
      const existing = draft.inventory[userId].find((i) => i.item_id === itemId);
      if (existing && itemDef.max_stack > 1) {
        existing.quantity += quantity;
      } else {
        draft.inventory[userId].push({
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          item_id: itemId,
          item: itemDef,
          quantity,
          is_equipped: false,
          created_at: new Date().toISOString(),
        });
      }
    });

    return { success: true };
  }

  public useItem(userId: string, inventoryItemId: string): { success: boolean; message: string } {
    const inventory = this.getUserInventory(userId);
    const itemEntry = inventory.find((i) => i.id === inventoryItemId);
    if (!itemEntry) return { success: false, message: 'Предмет не найден в вашем инвентаре' };

    const itemName = itemEntry.item.name;

    // Use effects based on category / id
    let effectMessage = `Вы использовали "${itemName}".`;
    if (itemEntry.item.category === 'medical') {
      effectMessage = `Вы использовали ${itemName}. Здоровье и показатели выносливости полностью восстановлены!`;
    } else if (itemEntry.item.category === 'food') {
      effectMessage = `Вы употребили ${itemName}. Энергия восполнена на максимум!`;
    } else if (itemEntry.item.category === 'tools') {
      effectMessage = `Инструмент ${itemName} подготовлен к работе в полевых условиях.`;
    }

    // Decrement item quantity or remove if 1
    dbEngine.updateState((draft) => {
      const userInv = draft.inventory[userId] || [];
      const idx = userInv.findIndex((i) => i.id === inventoryItemId);
      if (idx !== -1) {
        if (userInv[idx].quantity > 1) {
          userInv[idx].quantity -= 1;
        } else {
          userInv.splice(idx, 1);
        }
      }
    });

    audioService.play('reward');
    notificationService.notify(userId, 'info', 'Использование предмета', effectMessage);

    return { success: true, message: effectMessage };
  }

  public toggleEquipItem(userId: string, inventoryItemId: string) {
    dbEngine.updateState((draft) => {
      const userInv = draft.inventory[userId] || [];
      const item = userInv.find((i) => i.id === inventoryItemId);
      if (item) {
        item.is_equipped = !item.is_equipped;
      }
    });
    audioService.play('click');
  }

  public dropItem(userId: string, inventoryItemId: string, quantityToDrop: number = 1) {
    dbEngine.updateState((draft) => {
      const userInv = draft.inventory[userId] || [];
      const idx = userInv.findIndex((i) => i.id === inventoryItemId);
      if (idx !== -1) {
        if (userInv[idx].quantity > quantityToDrop) {
          userInv[idx].quantity -= quantityToDrop;
        } else {
          userInv.splice(idx, 1);
        }
      }
    });
    audioService.play('click');
  }
}

export const inventoryService = new InventoryService();
