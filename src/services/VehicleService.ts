import { dbEngine } from '../lib/storageEngine';
import { PlayerVehicle, Vehicle, VehicleUpgradeLevels, Transaction } from '../types';
import { INITIAL_VEHICLES } from '../data/gameData';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class VehicleService {
  public getAllCatalogVehicles(): Vehicle[] {
    return INITIAL_VEHICLES;
  }

  public getUserVehicles(userId: string): PlayerVehicle[] {
    const state = dbEngine.getState();
    const list = state.vehicles[userId] || [];
    return list.map((pv) => {
      if (!pv.vehicle) {
        const found = INITIAL_VEHICLES.find((v) => v.id === pv.vehicle_id);
        return {
          ...pv,
          vehicle: found || INITIAL_VEHICLES[0],
        };
      }
      return pv;
    });
  }

  public buyVehicle(
    userId: string,
    vehicleId: string,
    payFrom: 'cash' | 'bank' = 'bank'
  ): { success: boolean; error?: string } {
    const vehicle = INITIAL_VEHICLES.find((v) => v.id === vehicleId);
    if (!vehicle) return { success: false, error: 'Автомобиль не найден в автосалоне' };

    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const currentBalance = payFrom === 'cash' ? profile.money : profile.bank_money;
    if (currentBalance < vehicle.price) {
      return {
        success: false,
        error: `Недостаточно средств (${payFrom === 'cash' ? 'наличных' : 'в банке'}). Требуется $${vehicle.price.toLocaleString(
          'ru'
        )}`,
      };
    }

    const randomPlate = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(
      100 + Math.random() * 900
    )}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    )}77`;

    const newPlayerVehicle: PlayerVehicle = {
      id: `pveh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      vehicle_id: vehicle.id,
      vehicle: vehicle,
      custom_name: vehicle.name,
      fuel: 100,
      durability: 100,
      license_plate: randomPlate,
      upgrades: {
        engine: 0,
        brakes: 0,
        handling: 0,
        armor: 0,
        turbo: 0,
        color: '#18181b',
      },
      is_active: false,
      purchased_at: new Date().toISOString(),
    };

    const tx: Transaction = {
      id: `tx_${Date.now()}_veh`,
      user_id: userId,
      type: 'purchase',
      amount: vehicle.price,
      currency: payFrom,
      description: `Покупка автомобиля ${vehicle.name} в гараж`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      if (payFrom === 'cash') {
        draft.profiles[userId].money -= vehicle.price;
      } else {
        draft.profiles[userId].bank_money -= vehicle.price;
      }
      draft.profiles[userId].total_spent += vehicle.price;

      if (!draft.vehicles[userId]) {
        draft.vehicles[userId] = [];
      }
      // If first vehicle, set as active
      if (draft.vehicles[userId].length === 0) {
        newPlayerVehicle.is_active = true;
        draft.profiles[userId].active_vehicle_id = newPlayerVehicle.id;
      }
      draft.vehicles[userId].push(newPlayerVehicle);
      draft.transactions.unshift(tx);
    });

    audioService.play('engine');
    notificationService.notify(
      userId,
      'reward',
      'Новый автомобиль в гараже!',
      `Вы приобрели ${vehicle.name} с гос. номером [${randomPlate}].`
    );

    return { success: true };
  }

  public sellVehicle(userId: string, playerVehicleId: string): { success: boolean; error?: string } {
    const userVehicles = this.getUserVehicles(userId);
    const target = userVehicles.find((v) => v.id === playerVehicleId);
    if (!target) return { success: false, error: 'Транспорт не найден в вашем гараже' };

    const sellPrice = Math.floor(target.vehicle.price * 0.7); // 70% buyback

    const tx: Transaction = {
      id: `tx_${Date.now()}_sell_veh`,
      user_id: userId,
      type: 'reward',
      amount: sellPrice,
      currency: 'bank',
      description: `Продажа автомобиля ${target.vehicle.name} на авторынке`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].bank_money += sellPrice;
      draft.profiles[userId].total_earned += sellPrice;

      if (draft.profiles[userId].active_vehicle_id === playerVehicleId) {
        draft.profiles[userId].active_vehicle_id = null;
      }

      draft.vehicles[userId] = (draft.vehicles[userId] || []).filter(
        (v) => v.id !== playerVehicleId
      );
      draft.transactions.unshift(tx);
    });

    audioService.play('purchase');
    notificationService.notify(
      userId,
      'success',
      'Транспорт продан',
      `Вы продали ${target.vehicle.name} за $${sellPrice.toLocaleString('ru')} (средства начислены в банк).`
    );

    return { success: true };
  }

  public setActiveVehicle(userId: string, playerVehicleId: string) {
    dbEngine.updateState((draft) => {
      const list = draft.vehicles[userId] || [];
      list.forEach((v) => {
        v.is_active = v.id === playerVehicleId;
      });
      draft.profiles[userId].active_vehicle_id = playerVehicleId;
    });

    audioService.play('engine');
    notificationService.notify(
      userId,
      'info',
      'Гараж',
      'Выбран основной автомобиль для выезда в город.'
    );
  }

  public renameVehicle(userId: string, playerVehicleId: string, customName: string) {
    const cleanName = customName.trim().substring(0, 32);
    dbEngine.updateState((draft) => {
      const list = draft.vehicles[userId] || [];
      const item = list.find((v) => v.id === playerVehicleId);
      if (item) {
        item.custom_name = cleanName;
      }
    });
    audioService.play('click');
  }

  public upgradeVehicleTuning(
    userId: string,
    playerVehicleId: string,
    upgradeKey: keyof Omit<VehicleUpgradeLevels, 'color'>
  ): { success: boolean; error?: string } {
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    const userVehicles = this.getUserVehicles(userId);
    const target = userVehicles.find((v) => v.id === playerVehicleId);
    if (!target) return { success: false, error: 'Автомобиль не найден' };

    const currentLvl = target.upgrades[upgradeKey] || 0;
    if (currentLvl >= 5) {
      return { success: false, error: 'Достигнут максимальный уровень тюнинга детали (5/5)' };
    }

    const upgradeCost = Math.floor(target.vehicle.price * 0.08 * (currentLvl + 1));
    if (profile.money < upgradeCost) {
      return {
        success: false,
        error: `Недостаточно наличных денег. Стоимость тюнинга: $${upgradeCost.toLocaleString('ru')}`,
      };
    }

    const tx: Transaction = {
      id: `tx_${Date.now()}_tune`,
      user_id: userId,
      type: 'purchase',
      amount: upgradeCost,
      currency: 'cash',
      description: `Тюнинг [${upgradeKey.toUpperCase()}] для ${target.vehicle.name}`,
      created_at: new Date().toISOString(),
    };

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= upgradeCost;
      draft.profiles[userId].total_spent += upgradeCost;

      const list = draft.vehicles[userId] || [];
      const veh = list.find((v) => v.id === playerVehicleId);
      if (veh) {
        veh.upgrades[upgradeKey] = currentLvl + 1;
      }
      draft.transactions.unshift(tx);
    });

    audioService.play('purchase');
    notificationService.notify(
      userId,
      'reward',
      'Тюнинг установлен!',
      `Деталь [${upgradeKey.toUpperCase()}] улучшена до уровня ${currentLvl + 1}/5!`
    );

    return { success: true };
  }

  public repaintVehicle(userId: string, playerVehicleId: string, colorHex: string) {
    const cost = 2500;
    const state = dbEngine.getState();
    const profile = state.profiles[userId];
    if (profile.money < cost) {
      notificationService.notify(userId, 'error', 'Ошибка', 'Недостаточно денег на покраску ($2,500)');
      return;
    }

    dbEngine.updateState((draft) => {
      draft.profiles[userId].money -= cost;
      const list = draft.vehicles[userId] || [];
      const veh = list.find((v) => v.id === playerVehicleId);
      if (veh) {
        veh.upgrades.color = colorHex;
      }
    });

    audioService.play('purchase');
    notificationService.notify(userId, 'success', 'Покраска кузова', 'Новый цвет успешно нанесен.');
  }
}

export const vehicleService = new VehicleService();
