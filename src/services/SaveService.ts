import { dbEngine, GameDatabaseState } from '../lib/storageEngine';
import { notificationService } from './NotificationService';
import { audioService } from './AudioService';

class SaveService {
  public exportDatabaseJson(): string {
    const state = dbEngine.getState();
    return JSON.stringify(state, null, 2);
  }

  public importDatabaseJson(userId: string, jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString) as GameDatabaseState;
      if (!parsed || parsed.version !== 2 || !parsed.profiles || !parsed.users) {
        return { success: false, error: 'Некорректная структура файла резервной копии базы данных (версия != 2)' };
      }

      dbEngine.updateState((draft) => {
        Object.assign(draft, parsed);
      });

      audioService.play('reward');
      notificationService.notify(
        userId,
        'success',
        'Восстановление БД',
        'Резервная копия успешно загружена. Все данные синхронизированы.'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Ошибка парсинга JSON: ${err.message || 'Синтаксическая ошибка'}` };
    }
  }

  public downloadBackupFile() {
    const data = this.exportDatabaseJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bandit_game_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public resetAllData(userId: string) {
    dbEngine.resetDatabase();
    audioService.play('click');
    notificationService.notify(
      userId,
      'warning',
      'Сброс базы данных',
      'База данных сброшена к заводским настройкам RP-сервера.'
    );
  }
}

export const saveService = new SaveService();
