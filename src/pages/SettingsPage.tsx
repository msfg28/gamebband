import React, { useState } from 'react';
import { UserProfile } from '../types';
import { dbEngine } from '../lib/storageEngine';
import { audioService } from '../services/AudioService';
import { notificationService } from '../services/NotificationService';
import {
  Settings,
  Volume2,
  VolumeX,
  Database,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Bell,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsPageProps {
  user: UserProfile;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hudOpacity, setHudOpacity] = useState(100);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [networkPing, setNetworkPing] = useState(18);
  const [isTestingPing, setIsTestingPing] = useState(false);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    audioService.setEnabled(next);
    if (next) audioService.play('click');
  };

  const handleExportDB = () => {
    const state = dbEngine.getState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bandit_rp_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    notificationService.notify(
      user.id,
      'success',
      'Бэкап выгружен',
      'JSON-снимок базы данных успешно скачан.'
    );
  };

  const handleResetDB = () => {
    if (
      confirm(
        'ВНИМАНИЕ! Вы собираетесь сбросить базу данных до заводских начальных значений. Все пользовательские изменения будут перезаписаны. Продолжить?'
      )
    ) {
      dbEngine.resetDatabase();
      window.location.reload();
    }
  };

  const handleTestPing = () => {
    setIsTestingPing(true);
    setTimeout(() => {
      setNetworkPing(Math.floor(14 + Math.random() * 12));
      setIsTestingPing(false);
    }, 400);
  };

  return (
    <div id="settings-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Настройки & Управление Базой Данных
            </h1>
            <p className="text-xs text-zinc-400">
              Конфигурация аудио, интерфейса, резервное копирование и сетевые метрики
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-zinc-400">Пинг до сервера: </span>
            <strong className="text-emerald-400 font-mono font-bold">{networkPing} ms</strong>
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audio & Visuals */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-red-500" />
            Звук & Интерфейс
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <div>
                <strong className="text-xs text-white block">Игровые звуковые эффекты (SFX)</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">Звуки покупок, кликов, повышений уровней и сирен</p>
              </div>

              <button
                onClick={handleToggleAudio}
                className={`p-2.5 rounded-xl border transition-all ${
                  audioEnabled
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <div>
                <strong className="text-xs text-white block">Всплывающие уведомления (Toast Alerts)</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">Сообщения о переводах, зарплатах и действиях админов</p>
              </div>

              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2.5 rounded-xl border transition-all ${
                  notificationsEnabled
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Database & Data Integrity */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" />
            Хранилище данных & Бэкапы
          </h2>

          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Все данные сохраняются в локальном хранилище с контролем транзакций, версионированием и защитой от повреждения данных.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleExportDB}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Экспорт JSON-бэкапа
              </button>

              <button
                onClick={handleResetDB}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
                Сброс БД к истокам
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
