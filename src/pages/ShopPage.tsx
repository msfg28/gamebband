import React, { useState } from 'react';
import { UserProfile, Item, ItemRarity } from '../types';
import { shopService } from '../services/ShopService';
import { inventoryService } from '../services/InventoryService';
import {
  ShoppingBag,
  Search,
  Crosshair,
  Shield,
  Heart,
  Wrench,
  Coffee,
  Package,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ShopPageProps {
  user: UserProfile;
}

export const ShopPage: React.FC<ShopPageProps> = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const items = shopService.getCatalogItems(selectedCategory);
  const curWeight = inventoryService.getCurrentWeight(user.id);
  const maxWeight = inventoryService.getMaxWeight(user.id);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: 'all', label: 'Все товары' },
    { id: 'weapon', label: 'Оружие & Амуниция' },
    { id: 'armor', label: 'Броня & Защита' },
    { id: 'medical', label: 'Медикаменты' },
    { id: 'tools', label: 'Спецоборудование' },
    { id: 'food', label: 'Продукты & Энергетики' },
  ];

  const getRarityBadge = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'border-yellow-500/80 bg-yellow-950/80 text-yellow-300';
      case 'EPIC':
        return 'border-purple-500/80 bg-purple-950/80 text-purple-300';
      case 'RARE':
        return 'border-blue-500/80 bg-blue-950/80 text-blue-300';
      case 'UNCOMMON':
        return 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
    }
  };

  const getQty = (itemId: string) => quantities[itemId] || 1;
  const setQty = (itemId: string, val: number) => {
    setQuantities({ ...quantities, [itemId]: Math.max(1, Math.min(20, val)) });
  };

  const handleBuy = (itemId: string) => {
    const qty = getQty(itemId);
    shopService.buyItem(user.id, itemId, qty);
  };

  return (
    <div id="shop-page" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Оружейный арсенал & Магазин
            </h1>
            <p className="text-xs text-zinc-400">
              Лицензионное и теневое снаряжение штата BANDIT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Наличные: </span>
            <strong className="text-emerald-400 font-mono">${user.money.toLocaleString('ru')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Рюкзак: </span>
            <strong className="text-zinc-200">
              {curWeight} / {maxWeight} кг
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="shop-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по арсеналу..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-md shadow-red-950'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const qty = getQty(item.id);
          const total = item.price * qty;
          const canAfford = user.money >= total;
          const addedWeight = item.weight * qty;
          const fitsWeight = curWeight + addedWeight <= maxWeight;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getRarityBadge(
                      item.rarity
                    )}`}
                  >
                    {item.rarity}
                  </span>
                  <span className="text-xs text-zinc-400">{item.weight} кг / шт.</span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{item.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Specs & Pricing */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-500 uppercase block">Цена</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      ${total.toLocaleString('ru')}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  {item.max_stack > 1 && (
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      <button
                        onClick={() => setQty(item.id, qty - 1)}
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold text-white">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(item.id, qty + 1)}
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={!canAfford || !fitsWeight}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canAfford && fitsWeight
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {!canAfford
                    ? 'Недостаточно денег'
                    : !fitsWeight
                    ? 'Перегруз рюкзака'
                    : `Купить (${qty} шт.)`}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
