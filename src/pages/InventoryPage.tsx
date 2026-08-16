import React, { useState, useEffect } from 'react';
import { UserProfile, InventoryItem, ItemRarity } from '../types';
import { inventoryService } from '../services/InventoryService';
import {
  Backpack,
  Search,
  Filter,
  Shield,
  Zap,
  Trash2,
  CheckCircle,
  Crosshair,
  Heart,
  Wrench,
  Coffee,
  Package,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryPageProps {
  user: UserProfile;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ user }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInvItem, setSelectedInvItem] = useState<InventoryItem | null>(null);
  const [dropQuantity, setDropQuantity] = useState<number>(1);

  const refreshInventory = () => {
    const list = inventoryService.getUserInventory(user.id);
    setInventory(list);
    if (selectedInvItem) {
      const stillExists = list.find((i) => i.id === selectedInvItem.id);
      setSelectedInvItem(stillExists || null);
    }
  };

  useEffect(() => {
    refreshInventory();
  }, [user.id]);

  const curWeight = inventoryService.getCurrentWeight(user.id);
  const maxWeight = inventoryService.getMaxWeight(user.id);
  const weightPercent = Math.min(100, Math.round((curWeight / maxWeight) * 100));

  const categories = [
    { id: 'all', label: 'Все предметы' },
    { id: 'weapon', label: 'Оружие' },
    { id: 'armor', label: 'Броня' },
    { id: 'medical', label: 'Медикаменты' },
    { id: 'tools', label: 'Инструменты' },
    { id: 'food', label: 'Провизия' },
    { id: 'special', label: 'Особое' },
  ];

  const filteredItems = inventory.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.item.category === selectedCategory;
    const matchesSearch = item.item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const handleUse = (invId: string) => {
    inventoryService.useItem(user.id, invId);
    refreshInventory();
  };

  const handleEquip = (invId: string) => {
    inventoryService.toggleEquipItem(user.id, invId);
    refreshInventory();
  };

  const handleDrop = (invId: string) => {
    inventoryService.dropItem(user.id, invId, dropQuantity);
    refreshInventory();
  };

  return (
    <div id="inventory-page" className="space-y-6 pb-12">
      {/* Top Banner & Weight Bar */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/30">
            <Backpack className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Инвентарь & Снаряжение
            </h1>
            <p className="text-xs text-zinc-400">
              Управление предметами, оружием и экипировкой
            </p>
          </div>
        </div>

        {/* Backpack Weight Capacity */}
        <div className="w-full md:w-72 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Вместимость рюкзака</span>
            <span className={weightPercent > 90 ? 'text-red-400' : 'text-zinc-200'}>
              {curWeight} / {maxWeight} кг ({weightPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                weightPercent > 90
                  ? 'bg-red-500'
                  : weightPercent > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${weightPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="inv-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию предмета..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Category Pills */}
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

      {/* Main Grid: Inventory Items & Item Detail Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Items Grid */}
        <div className="lg:col-span-8">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-dashed border-zinc-800">
              <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-300">Инвентарь пуст</h3>
              <p className="text-xs text-zinc-500 mt-1">
                В этой категории нет предметов. Купите что-нибудь в оружейном магазине.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((inv) => {
                const isSelected = selectedInvItem?.id === inv.id;
                const item = inv.item;
                return (
                  <motion.div
                    key={inv.id}
                    onClick={() => setSelectedInvItem(inv)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`cursor-pointer relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between h-36 select-none ${
                      isSelected
                        ? 'border-red-500 bg-red-950/30 shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    {/* Top Row: Rarity badge & Quantity */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${getRarityBadge(
                          item.rarity
                        )}`}
                      >
                        {item.rarity}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-950/90 text-zinc-200 font-mono text-[10px] font-bold">
                        x{inv.quantity}
                      </span>
                    </div>

                    {/* Middle: Name & Category Icon */}
                    <div className="my-auto py-1">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block capitalize">
                        {item.category}
                      </span>
                    </div>

                    {/* Bottom: Weight & Equipped indicator */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-1.5">
                      <span>{(item.weight * inv.quantity).toFixed(1)} кг</span>
                      {inv.is_equipped && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                          Надето
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Inspection Detail Card */}
        <div className="lg:col-span-4">
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl sticky top-20 space-y-5">
            {selectedInvItem ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getRarityBadge(
                        selectedInvItem.item.rarity
                      )}`}
                    >
                      {selectedInvItem.item.rarity}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      Вес: {selectedInvItem.item.weight} кг / шт.
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{selectedInvItem.item.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {selectedInvItem.item.description}
                  </p>
                </div>

                {/* Specific Stats */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Базовая стоимость:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      ${selectedInvItem.item.price.toLocaleString('ru')}
                    </span>
                  </div>
                  {selectedInvItem.item.damage && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Урон / Калибр:</span>
                      <span className="font-bold text-red-400">+{selectedInvItem.item.damage} DMG</span>
                    </div>
                  )}
                  {selectedInvItem.item.armor && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Защита брони:</span>
                      <span className="font-bold text-cyan-400">+{selectedInvItem.item.armor} DEF</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">В наличии:</span>
                    <span className="font-bold text-white">{selectedInvItem.quantity} шт.</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {selectedInvItem.item.category === 'weapon' ||
                  selectedInvItem.item.category === 'clothing' ||
                  selectedInvItem.item.category === 'armor' ? (
                    <button
                      onClick={() => handleEquip(selectedInvItem.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        selectedInvItem.is_equipped
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-950'
                      }`}
                    >
                      <Crosshair className="w-4 h-4" />
                      {selectedInvItem.is_equipped ? 'Снять экипировку' : 'Надеть / Экипировать'}
                    </button>
                  ) : null}

                  {selectedInvItem.item.category === 'medical' ||
                  selectedInvItem.item.category === 'food' ||
                  selectedInvItem.item.category === 'tools' ? (
                    <button
                      onClick={() => handleUse(selectedInvItem.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Использовать предмет
                    </button>
                  ) : null}

                  {/* Drop Section */}
                  <div className="pt-3 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={selectedInvItem.quantity}
                        value={dropQuantity}
                        onChange={(e) =>
                          setDropQuantity(
                            Math.min(
                              selectedInvItem.quantity,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-mono text-center"
                      />
                      <button
                        onClick={() => handleDrop(selectedInvItem.id)}
                        className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Выбросить ({dropQuantity})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Выберите предмет из сетки для просмотра характеристик и действий.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
