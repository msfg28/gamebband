import React, { useState, useEffect } from 'react';
import { UserProfile, CharacterAppearance } from '../types';
import { playerService } from '../services/PlayerService';
import { CharacterPreview } from '../components/common/CharacterPreview';
import {
  User,
  Shield,
  Clock,
  Award,
  AlertTriangle,
  Sparkles,
  Save,
  Check,
  Palette,
  Shirt,
  Scissors,
  Glasses,
  Crown,
  Edit3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfilePageProps {
  user: UserProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [status, setStatus] = useState(user.status || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [nicknameInput, setNicknameInput] = useState(user.username);
  const [nickFeedback, setNickFeedback] = useState<{ success?: boolean; message?: string } | null>(
    null
  );
  const [character, setCharacter] = useState<CharacterAppearance>({
    skinColor: user.character?.skinColor || '#d4a373',
    hairStyle: user.character?.hairStyle || 'slick',
    hairColor: user.character?.hairColor || '#18181b',
    faceType: user.character?.faceType || 'beard',
    shirtColor: user.character?.shirtColor || '#18181b',
    pantsColor: user.character?.pantsColor || '#27272a',
    shoesColor: user.character?.shoesColor || '#09090b',
    jacket: user.character?.jacket || 'leather',
    jacketColor: user.character?.jacketColor || '#09090b',
    hat: user.character?.hat || 'none',
    glasses: user.character?.glasses || 'aviator',
    accessory: user.character?.accessory || 'gold_chain',
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setNicknameInput(user.username);
  }, [user.username]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    playerService.updateStatus(user.id, status);
    playerService.updateAvatar(user.id, avatarUrl);
    playerService.updateCharacterAppearance(user.id, character);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleChangeNickname = (e: React.FormEvent) => {
    e.preventDefault();
    setNickFeedback(null);
    const res = playerService.changeUsername(user.id, nicknameInput);
    if (res.success) {
      setNickFeedback({
        success: true,
        message: `Никнейм успешно изменен на «${res.username}»!`,
      });
      setTimeout(() => setNickFeedback(null), 4000);
    } else {
      setNickFeedback({
        success: false,
        message: res.error || 'Не удалось сменить никнейм',
      });
    }
  };

  const hairStyles = [
    { id: 'slick', label: 'Уложенные' },
    { id: 'buzzcut', label: 'Короткая' },
    { id: 'dreadlocks', label: 'Дреды' },
    { id: 'bald', label: 'Налысо' },
  ];

  const faceTypes = [
    { id: 'clean', label: 'Гладко выбрит' },
    { id: 'beard', label: 'Борода & Щетина' },
    { id: 'scar', label: 'Боевой шрам' },
  ];

  const hats = [
    { id: 'none', label: 'Без головного убора' },
    { id: 'cap', label: 'Красная кепка' },
    { id: 'fedora', label: 'Шляпа Синдиката' },
    { id: 'beanie', label: 'Шапка бини' },
  ];

  const glassesList = [
    { id: 'none', label: 'Без очков' },
    { id: 'aviator', label: 'Авиаторы' },
    { id: 'cyber', label: 'Кибервизор' },
  ];

  const accessoriesList = [
    { id: 'none', label: 'Без аксессуаров' },
    { id: 'gold_chain', label: 'Золотая цепь' },
    { id: 'chain', label: 'Серебряная цепь' },
  ];

  const skinColors = ['#f8d5c2', '#d4a373', '#aa7c54', '#603813', '#ffdbac'];
  const paletteColors = ['#18181b', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#fafafa'];

  return (
    <div id="profile-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user.username}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-red-500 shadow-lg shadow-red-950"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white">{user.username}</h1>
              {user.admin_level > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-800 text-xs font-bold uppercase">
                  Администратор [{user.admin_level}]
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">UUID: {user.id}</p>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950 transition-all shrink-0"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Сохранено!' : 'Сохранить профиль'}</span>
        </button>
      </div>

      {/* Grid: Character Studio & Detailed Lifetime Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 2D Mannequin Preview & Quick Config */}
        <div className="lg:col-span-5 space-y-4">
          {/* Nickname Changer Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-red-500" />
                Смена никнейма аккаунта
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Ник в игре</span>
            </div>

            <form onSubmit={handleChangeNickname} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Игровой никнейм (3-24 символа)
                </label>
                <div className="flex gap-2">
                  <input
                    id="profile-nickname-input"
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="Введите новый ник..."
                    maxLength={24}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    id="profile-nickname-submit-btn"
                    type="submit"
                    disabled={!nicknameInput || nicknameInput.trim() === user.username}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-red-950 shrink-0"
                  >
                    Сменить
                  </button>
                </div>
              </div>

              {nickFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    nickFeedback.success
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-red-950/40 border-red-800/80 text-red-300'
                  }`}
                >
                  {nickFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{nickFeedback.message}</span>
                </motion.div>
              )}

              <p className="text-[10px] text-zinc-500 leading-tight">
                Разрешены буквы (латиница и кириллица), цифры, пробел, дефис и знак подчеркивания.
              </p>
            </form>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-red-500" />
                Визуальный манекен (3D RP)
              </h3>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Слои скина</span>
            </div>

            <CharacterPreview character={character} size="lg" />

            {/* General Status Input */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Статус персонажа</label>
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Ваш криминальный статус в городе..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">URL Аватарки</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Account Metrics & Safety Status */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Личное дело & Репутация</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Предупреждения</span>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    user.warnings_count > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {user.warnings_count} / 3
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Время в игре</span>
                <p className="text-sm font-bold text-zinc-200 mt-0.5">{user.play_time_minutes} мин.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: In-Depth Character Customizer Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Scissors className="w-4 h-4 text-red-500" />
              Гардероб & Внешность (Кастомизация)
            </h3>

            {/* 1. Head & Face */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Голова & Лицо</h4>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Прическа</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hairStyles.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setCharacter({ ...character, hairStyle: h.id as any })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        character.hairStyle === h.id
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Тип лица & Борода</label>
                <div className="grid grid-cols-3 gap-2">
                  {faceTypes.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCharacter({ ...character, faceType: f.id as any })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        character.faceType === f.id
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Оттенок кожи</label>
                <div className="flex items-center gap-2">
                  {skinColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCharacter({ ...character, skinColor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        character.skinColor === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Clothing & Layers */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Одежда & Цветовая палитра</h4>

              {/* Upper Layer: Jacket & Shirt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Цвет куртки / Пиджака</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paletteColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCharacter({ ...character, jacketColor: col })}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          character.jacketColor === col ? 'scale-110 border-white' : 'border-zinc-800'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Цвет футболки / Рубашки</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paletteColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCharacter({ ...character, shirtColor: col })}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          character.shirtColor === col ? 'scale-110 border-white' : 'border-zinc-800'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Lower Layer: Pants & Shoes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Цвет брюк / Джинсов</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paletteColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCharacter({ ...character, pantsColor: col })}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          character.pantsColor === col ? 'scale-110 border-white' : 'border-zinc-800'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Цвет обуви / Кроссовок</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paletteColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCharacter({ ...character, shoesColor: col })}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          character.shoesColor === col ? 'scale-110 border-white' : 'border-zinc-800'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Hats, Glasses & Accessories */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Головные уборы & Аксессуары</h4>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Головной убор</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hats.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setCharacter({ ...character, hat: h.id as any })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        character.hat === h.id
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Очки</label>
                  <div className="space-y-1.5">
                    {glassesList.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setCharacter({ ...character, glasses: g.id as any })}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold border text-left transition-all ${
                          character.glasses === g.id
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Ювелирные украшения</label>
                  <div className="space-y-1.5">
                    {accessoriesList.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setCharacter({ ...character, accessory: a.id as any })}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold border text-left transition-all ${
                          character.accessory === a.id
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
