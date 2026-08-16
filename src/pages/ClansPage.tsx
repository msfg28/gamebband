import React, { useState, useEffect } from 'react';
import { UserProfile, Clan, ClanRank } from '../types';
import { clanService } from '../services/ClanService';
import {
  Users,
  Shield,
  DollarSign,
  Crown,
  UserPlus,
  LogOut,
  MapPin,
  Flame,
  Award,
  ChevronRight,
  ShieldAlert,
  UserX,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClansPageProps {
  user: UserProfile;
}

export const ClansPage: React.FC<ClansPageProps> = ({ user }) => {
  const [clans, setClans] = useState<Clan[]>([]);
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>('5000');
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);

  const refreshClans = () => {
    const list = clanService.getAllClans();
    setClans(list);
    const myClan = list.find((c) => c.id === user.clan_id);
    if (myClan) {
      setSelectedClan(myClan);
    } else if (list.length > 0 && !selectedClan) {
      setSelectedClan(list[0]);
    }
  };

  useEffect(() => {
    refreshClans();
  }, [user]);

  const handleJoin = (clanId: string) => {
    const res = clanService.joinClan(user.id, clanId);
    if (res.success) {
      refreshClans();
    }
  };

  const handleLeave = () => {
    if (confirm('Вы действительно хотите покинуть синдикат?')) {
      const res = clanService.leaveClan(user.id);
      if (res.success) {
        refreshClans();
      }
    }
  };

  const handleDonate = () => {
    const val = parseInt(donationAmount);
    if (isNaN(val) || val <= 0) return;
    const res = clanService.depositToClan(user.id, val);
    if (res.success) {
      setShowDonateModal(false);
      refreshClans();
    }
  };

  const handleRankChange = (targetUserId: string, newRank: ClanRank) => {
    clanService.changeMemberRank(user.id, targetUserId, newRank);
    refreshClans();
  };

  const handleKick = (targetUserId: string) => {
    if (confirm('Исключить этого бойца из состава синдиката?')) {
      clanService.kickMember(user.id, targetUserId);
      refreshClans();
    }
  };

  const userClan = clans.find((c) => c.id === user.clan_id);
  const isLeaderOrDeputy = Boolean(
    userClan?.members.some(
      (m) => m.user_id === user.id && (m.rank === 'Leader' || m.rank === 'Deputy')
    )
  );

  return (
    <div id="clans-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Кланы & Преступные Синдикаты
            </h1>
            <p className="text-xs text-zinc-400">
              Влияние на районы города, война за территории и общий клановый бюджет
            </p>
          </div>
        </div>

        {userClan ? (
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800 text-xs">
              <span className="text-zinc-400">Ваш клан: </span>
              <strong className="text-purple-300 font-bold">
                [{userClan.tag}] {userClan.name}
              </strong>
            </div>
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Покинуть
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-500">
            Вы не состоите ни в одном клане
          </div>
        )}
      </div>

      {/* Main Grid: Clan Selector / Cards & Clan Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Clan List */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 px-1">
            Синдикаты города ({clans.length})
          </h2>

          <div className="space-y-2">
            {clans.map((c) => {
              const isMyClan = user.clan_id === c.id;
              const isSelected = selectedClan?.id === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClan(c)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-zinc-800/90 border-purple-600 shadow-lg shadow-purple-950/30'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.tag}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{c.name}</h4>
                        {isMyClan && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[9px] font-bold">
                            ВЫ ЗДЕСЬ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {c.members.length}/{c.max_members} бойцов • {c.territories_count} территорий
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Clan Details */}
        {selectedClan && (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
              {/* Clan Header Profile */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl"
                    style={{ backgroundColor: selectedClan.color }}
                  >
                    {selectedClan.tag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{selectedClan.name}</h2>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold">
                        Уровень {selectedClan.level}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{selectedClan.description}</p>
                  </div>
                </div>

                {/* Join / Donate Actions */}
                <div className="flex items-center gap-2">
                  {user.clan_id === selectedClan.id ? (
                    <button
                      onClick={() => setShowDonateModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950 transition-all flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Пополнить общак
                    </button>
                  ) : !user.clan_id ? (
                    <button
                      onClick={() => handleJoin(selectedClan.id)}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-950 transition-all flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Вступить в синдикат
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Clan Stats Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Казна (Общак)</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ${selectedClan.balance.toLocaleString('ru')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Состав</span>
                  <span className="text-base font-black text-purple-400 font-mono">
                    {selectedClan.members.length} / {selectedClan.max_members}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Территории</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {selectedClan.territories_count} зон
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Создан</span>
                  <span className="text-xs font-bold text-zinc-300">
                    {new Date(selectedClan.created_at).toLocaleDateString('ru')}
                  </span>
                </div>
              </div>

              {/* Members Roster Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Список участников синдиката</span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {selectedClan.members.length} человек
                  </span>
                </h3>

                <div className="space-y-1.5">
                  {selectedClan.members.map((member) => {
                    const isSelf = member.user_id === user.id;

                    return (
                      <div
                        key={member.user_id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isSelf
                            ? 'bg-purple-950/20 border-purple-800/60'
                            : 'bg-zinc-950 border-zinc-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar_url}
                            alt={member.username}
                            className="w-9 h-9 rounded-xl object-cover border border-zinc-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{member.username}</span>
                              {member.rank === 'Leader' && (
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({member.level} LVL)
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Вклад в казну: <strong className="text-emerald-400 font-mono">${member.donations.toLocaleString('ru')}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Rank Badge & Management Buttons */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              member.rank === 'Leader'
                                ? 'bg-amber-950 text-amber-300 border-amber-700'
                                : member.rank === 'Deputy'
                                ? 'bg-purple-950 text-purple-300 border-purple-700'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {member.rank}
                          </span>

                          {/* Leader controls for other members */}
                          {user.clan_id === selectedClan.id && isLeaderOrDeputy && !isSelf && member.rank !== 'Leader' && (
                            <div className="flex items-center gap-1">
                              <select
                                value={member.rank}
                                onChange={(e) => handleRankChange(member.user_id, e.target.value as ClanRank)}
                                className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 font-bold focus:outline-none"
                              >
                                <option value="Recruit">Recruit</option>
                                <option value="Member">Member</option>
                                <option value="Capo">Capo</option>
                                <option value="Deputy">Deputy</option>
                              </select>

                              <button
                                onClick={() => handleKick(member.user_id)}
                                title="Исключить бойца"
                                className="p-1 rounded-lg bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Donate Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-black text-white">Взнос в общак клана</h3>
              <p className="text-xs text-zinc-400">
                Ваши наличные: <strong className="text-emerald-400">${user.money.toLocaleString('ru')}</strong>
              </p>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Сумма взноса ($)
                </label>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDonate}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950 transition-all"
                >
                  Внести
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
