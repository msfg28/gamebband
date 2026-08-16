import React from 'react';
import { CharacterAppearance } from '../../types';

interface CharacterPreviewProps {
  character: CharacterAppearance;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  character,
  className = '',
  size = 'md',
}) => {
  const heightClass = size === 'sm' ? 'h-40' : size === 'lg' ? 'h-80' : 'h-64';

  return (
    <div
      id="character-preview-canvas"
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black border border-zinc-800 p-4 shadow-inner overflow-hidden select-none ${heightClass} ${className}`}
    >
      {/* Background Cyber Grid Floor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute bottom-4 w-32 h-6 bg-red-500/10 blur-md rounded-full" />

      {/* SVG Layered Mannequin Visual */}
      <svg
        viewBox="0 0 200 320"
        className="w-full h-full max-h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
      >
        {/* Layer 1: Body Base Silhouette */}
        {/* Neck */}
        <rect
          x="92"
          y="78"
          width="16"
          height="18"
          rx="3"
          fill={character.skinColor || '#d4a373'}
        />

        {/* Head */}
        <ellipse
          cx="100"
          cy="52"
          rx="22"
          ry="26"
          fill={character.skinColor || '#d4a373'}
          stroke="#18181b"
          strokeWidth="1.5"
        />

        {/* Face Details (Eyes & Smile/Stubble) */}
        <ellipse cx="92" cy="50" rx="2" ry="2.5" fill="#18181b" />
        <ellipse cx="108" cy="50" rx="2" ry="2.5" fill="#18181b" />
        {character.faceType === 'scar' ? (
          <line x1="88" y1="42" x2="94" y2="58" stroke="#991b1b" strokeWidth="1.5" />
        ) : character.faceType === 'beard' ? (
          <path
            d="M84 56 Q100 78 116 56 Q100 84 84 56"
            fill="#27272a"
            opacity="0.8"
          />
        ) : (
          <path
            d="M94 62 Q100 66 106 62"
            stroke="#27272a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Hair Styles */}
        {character.hairStyle !== 'bald' && (
          <path
            d={
              character.hairStyle === 'slick'
                ? 'M76 46 Q100 24 124 46 Q128 32 100 24 Q72 32 76 46'
                : character.hairStyle === 'dreadlocks'
                ? 'M74 48 Q100 18 126 48 L128 65 L122 62 L120 75 L114 70 L112 80 L108 72 L100 82 L92 72 L88 80 L86 70 L80 75 L78 62 Z'
                : 'M76 48 Q100 22 124 48 Q100 32 76 48'
            }
            fill={character.hairColor || '#18181b'}
          />
        )}

        {/* Glasses */}
        {character.glasses === 'aviator' && (
          <g>
            <rect x="85" y="46" width="12" height="9" rx="2" fill="#18181b" stroke="#eab308" strokeWidth="1" />
            <rect x="103" y="46" width="12" height="9" rx="2" fill="#18181b" stroke="#eab308" strokeWidth="1" />
            <line x1="97" y1="50" x2="103" y2="50" stroke="#eab308" strokeWidth="1.5" />
          </g>
        )}
        {character.glasses === 'cyber' && (
          <rect
            x="84"
            y="46"
            width="32"
            height="8"
            rx="1"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.9"
          />
        )}

        {/* Hat */}
        {character.hat === 'cap' && (
          <path
            d="M74 38 Q100 18 126 38 L140 42 L124 42 Q100 28 74 38"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="1"
          />
        )}
        {character.hat === 'fedora' && (
          <path
            d="M66 40 Q100 34 134 40 L126 26 Q100 22 74 26 Z"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="1"
          />
        )}
        {character.hat === 'beanie' && (
          <path
            d="M76 46 Q100 16 124 46 Q100 36 76 46"
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth="1"
          />
        )}

        {/* Legs & Pants */}
        <rect
          x="78"
          y="180"
          width="18"
          height="95"
          rx="4"
          fill={character.pantsColor || '#27272a'}
          stroke="#09090b"
          strokeWidth="1"
        />
        <rect
          x="104"
          y="180"
          width="18"
          height="95"
          rx="4"
          fill={character.pantsColor || '#27272a'}
          stroke="#09090b"
          strokeWidth="1"
        />

        {/* Shoes */}
        <path
          d="M72 272 L96 272 L98 285 L70 285 Z"
          fill={character.shoesColor || '#09090b'}
          stroke="#27272a"
          strokeWidth="1"
        />
        <path
          d="M104 272 L128 272 L130 285 L102 285 Z"
          fill={character.shoesColor || '#09090b'}
          stroke="#27272a"
          strokeWidth="1"
        />

        {/* Torso & Shirt */}
        <path
          d="M72 94 L128 94 L122 186 L78 186 Z"
          fill={character.shirtColor || '#18181b'}
          stroke="#09090b"
          strokeWidth="1.5"
        />

        {/* Arms / Sleeves */}
        <rect
          x="58"
          y="96"
          width="14"
          height="75"
          rx="6"
          fill={character.jacket !== 'none' ? character.jacketColor : character.shirtColor}
        />
        <rect
          x="128"
          y="96"
          width="14"
          height="75"
          rx="6"
          fill={character.jacket !== 'none' ? character.jacketColor : character.shirtColor}
        />

        {/* Hands */}
        <circle cx="65" cy="178" r="6" fill={character.skinColor || '#d4a373'} />
        <circle cx="135" cy="178" r="6" fill={character.skinColor || '#d4a373'} />

        {/* Jacket Layer */}
        {character.jacket !== 'none' && (
          <g>
            <path
              d="M68 94 L86 94 L80 186 L68 186 Z"
              fill={character.jacketColor || '#0f172a'}
              stroke="#020617"
              strokeWidth="1"
            />
            <path
              d="M114 94 L132 94 L132 186 L120 186 Z"
              fill={character.jacketColor || '#0f172a'}
              stroke="#020617"
              strokeWidth="1"
            />
          </g>
        )}

        {/* Accessory: Gold Chain */}
        {character.accessory === 'gold_chain' || character.accessory === 'chain' ? (
          <path
            d="M88 94 Q100 120 112 94"
            fill="none"
            stroke="#eab308"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : null}
      </svg>

      {/* Level Tag Overlay */}
      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] font-bold text-zinc-400">
        3D Visual Mock
      </div>
    </div>
  );
};
