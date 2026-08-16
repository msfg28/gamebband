import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { economyService } from '../../services/EconomyService';
import { Building2, ArrowDownRight, ArrowUpRight, Send, X, Wallet, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

interface BankModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const BankModal: React.FC<BankModalProps> = ({ user, isOpen, onClose }) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [targetUsername, setTargetUsername] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const num = parseInt(amount);
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Введите корректную сумму');
      return;
    }

    if (tab === 'deposit') {
      const res = economyService.depositMoney(user.id, num);
      if (!res.success) {
        setErrorMsg(res.error || 'Ошибка депозита');
      } else {
        setAmount('');
        onClose();
      }
    } else if (tab === 'withdraw') {
      const res = economyService.withdrawMoney(user.id, num);
      if (!res.success) {
        setErrorMsg(res.error || 'Ошибка снятия');
      } else {
        setAmount('');
        onClose();
      }
    } else if (tab === 'transfer') {
      if (!targetUsername.trim()) {
        setErrorMsg('Укажите ник получателя');
        return;
      }
      const res = economyService.transferMoney(user.id, targetUsername.trim(), num);
      if (!res.success) {
        setErrorMsg(res.error || 'Ошибка перевода');
      } else {
        setAmount('');
        setTargetUsername('');
        onClose();
      }
    }
  };

  const quickAmounts = [1000, 5000, 25000, 100000];

  return (
    <div id="bank-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Банк BANDIT FINANCIAL</h3>
              <p className="text-xs text-zinc-400">Управление счетами и безналичные переводы</p>
            </div>
          </div>
          <button
            id="close-bank-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status Card */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 uppercase font-semibold">Наличные</p>
                <p className="text-sm font-bold text-emerald-400">${user.money.toLocaleString('ru')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 uppercase font-semibold">Счет в банке</p>
                <p className="text-sm font-bold text-cyan-400">${user.bank_money.toLocaleString('ru')}</p>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 mt-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <button
              id="bank-tab-deposit"
              type="button"
              onClick={() => {
                setTab('deposit');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                tab === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Депозит
            </button>
            <button
              id="bank-tab-withdraw"
              type="button"
              onClick={() => {
                setTab('withdraw');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                tab === 'withdraw'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Снятие
            </button>
            <button
              id="bank-tab-transfer"
              type="button"
              onClick={() => {
                setTab('transfer');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                tab === 'transfer'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Перевод
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAction} className="p-6 pt-3 space-y-4">
          {tab === 'transfer' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Никнейм получателя</label>
              <input
                id="transfer-username-input"
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="Например: Kenji_Sato"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {tab === 'deposit'
                  ? 'Сумма для внесения'
                  : tab === 'withdraw'
                  ? 'Сумма для снятия'
                  : 'Сумма перевода'}
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(tab === 'deposit' ? user.money : user.bank_money))}
                className="text-[11px] font-bold text-red-400 hover:underline"
              >
                Все ({tab === 'deposit' ? `$${user.money.toLocaleString('ru')}` : `$${user.bank_money.toLocaleString('ru')}`})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">$</span>
              <input
                id="bank-amount-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex items-center gap-1.5">
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                +${q >= 1000 ? `${q / 1000}k` : q}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <button
            id="bank-submit-btn"
            type="submit"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2"
          >
            {tab === 'deposit' && 'Внести на счет'}
            {tab === 'withdraw' && 'Снять наличные'}
            {tab === 'transfer' && 'Отправить перевод'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
