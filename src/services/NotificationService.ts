import { NotificationItem } from '../types';
import { dbEngine } from '../lib/storageEngine';
import { audioService } from './AudioService';

type ToastListener = (notification: NotificationItem) => void;

class NotificationService {
  private toastListeners: Set<ToastListener> = new Set();

  public subscribeToToasts(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  public notify(
    userId: string,
    type: 'success' | 'error' | 'warning' | 'info' | 'admin' | 'reward',
    title: string,
    message: string
  ) {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
      created_at: new Date().toISOString(),
      read: false,
    };

    // Store in DB for user
    dbEngine.updateState((draft) => {
      if (!draft.notifications[userId]) {
        draft.notifications[userId] = [];
      }
      draft.notifications[userId].unshift(item);
      if (draft.notifications[userId].length > 50) {
        draft.notifications[userId].pop();
      }
    });

    // Play sound based on type
    if (type === 'reward') {
      audioService.play('reward');
    } else if (type === 'error') {
      audioService.play('error');
    } else if (type === 'admin') {
      audioService.play('admin');
    } else {
      audioService.play('notification');
    }

    // Trigger active toast popups
    this.toastListeners.forEach((l) => l(item));
  }

  public getNotifications(userId: string): NotificationItem[] {
    const state = dbEngine.getState();
    return state.notifications[userId] || [];
  }

  public markAllAsRead(userId: string) {
    dbEngine.updateState((draft) => {
      if (draft.notifications[userId]) {
        draft.notifications[userId].forEach((n) => {
          n.read = true;
        });
      }
    });
  }

  public clearAll(userId: string) {
    dbEngine.updateState((draft) => {
      draft.notifications[userId] = [];
    });
  }
}

export const notificationService = new NotificationService();
