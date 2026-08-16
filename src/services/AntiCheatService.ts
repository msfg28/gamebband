import { dbEngine } from '../lib/storageEngine';
import { AntiCheatEvent } from '../types';

interface ActionLogEntry {
  timestamp: number;
  action: string;
}

class AntiCheatService {
  private userRecentActions: Map<string, ActionLogEntry[]> = new Map();

  public recordAction(
    userId: string,
    action: string,
    metadata?: { minIntervalMs?: number; amount?: number; maxAllowed?: number }
  ): { isAllowed: boolean; reason?: string } {
    const now = Date.now();
    const history = this.userRecentActions.get(userId) || [];

    // Filter out actions older than 10 seconds
    const recent = history.filter((e) => now - e.timestamp < 10000);
    recent.push({ timestamp: now, action });
    this.userRecentActions.set(userId, recent);

    // 1. Burst Action Check (> 15 actions in 3 seconds)
    const veryRecent = recent.filter((e) => now - e.timestamp < 3000);
    if (veryRecent.length > 15) {
      this.flagViolation(
        userId,
        'abnormal_burst',
        'high',
        `Слишком высокая частота действий (${veryRecent.length} за 3 сек). Возможен автокликер или бот.`,
        15
      );
      return { isAllowed: false, reason: 'Слишком частые действия. Подождите пару секунд.' };
    }

    // 2. Cooldown Bypass Check
    if (metadata?.minIntervalMs) {
      const sameActions = recent.filter((e) => e.action === action);
      if (sameActions.length >= 2) {
        const lastAction = sameActions[sameActions.length - 2];
        const elapsed = now - lastAction.timestamp;
        if (elapsed < metadata.minIntervalMs) {
          this.flagViolation(
            userId,
            'rapid_clicks',
            'medium',
            `Попытка обойти кулдаун действия ${action}: интервал ${elapsed}ms < положенных ${metadata.minIntervalMs}ms`,
            8
          );
          return { isAllowed: false, reason: 'Действие на перезарядке. Соблюдайте таймер.' };
        }
      }
    }

    // 3. Impossible values check
    if (metadata?.amount !== undefined && metadata?.maxAllowed !== undefined) {
      if (metadata.amount > metadata.maxAllowed || metadata.amount < 0) {
        this.flagViolation(
          userId,
          'suspicious_balance',
          'critical',
          `Попытка передачи невозможного значения: ${metadata.amount} при лимите ${metadata.maxAllowed}`,
          25
        );
        return { isAllowed: false, reason: 'Некорректная сумма операции' };
      }
    }

    return { isAllowed: true };
  }

  public flagViolation(
    userId: string,
    eventType: AntiCheatEvent['event_type'],
    severity: AntiCheatEvent['severity'],
    details: string,
    suspicionPoints: number
  ) {
    const state = dbEngine.getState();
    const user = state.profiles[userId];
    const username = user ? user.username : 'Unknown';

    const event: AntiCheatEvent = {
      id: `ac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      username,
      event_type: eventType,
      severity,
      details,
      created_at: new Date().toISOString(),
      suspicion_added: suspicionPoints,
    };

    dbEngine.updateState((draft) => {
      draft.antiCheatEvents.unshift(event);
      if (draft.antiCheatEvents.length > 200) {
        draft.antiCheatEvents.pop();
      }

      if (draft.profiles[userId]) {
        const currentScore = draft.profiles[userId].suspicion_score || 0;
        draft.profiles[userId].suspicion_score = Math.min(100, currentScore + suspicionPoints);
      }
    });
  }

  public getEvents(): AntiCheatEvent[] {
    return dbEngine.getState().antiCheatEvents;
  }

  public resetUserScore(userId: string) {
    dbEngine.updateState((draft) => {
      if (draft.profiles[userId]) {
        draft.profiles[userId].suspicion_score = 0;
      }
    });
  }
}

export const antiCheatService = new AntiCheatService();
