import React from 'react';
import { GeneratedAsset } from '../types.ts';
import { Sparkles, Video, Image as ImageIcon, Clock, ArrowRight } from 'lucide-react';

interface HistoryDrawerProps {
  assets: GeneratedAsset[];
  selectedId: string | null;
  onSelect: (asset: GeneratedAsset) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  assets,
  selectedId,
  onSelect,
}) => {
  if (assets.length === 0) return null;

  return (
    <div id="gallery-history-section" className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Recent Creations ({assets.length})
        </h3>
        <span className="text-[11px] text-slate-500">Click to load into 3D stage</span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        {assets.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              id={`history-card-${item.id}`}
              type="button"
              onClick={() => onSelect(item)}
              className={`relative flex-shrink-0 w-44 rounded-xl overflow-hidden border text-left transition-all group ${
                isSelected
                  ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
              }`}
            >
              {/* Thumbnail Image */}
              <div className="w-full h-24 bg-slate-950 relative overflow-hidden">
                <img
                  src={item.upscaledUrl || item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[9px] font-bold uppercase font-mono text-cyan-400 border border-slate-800">
                  {item.quality}
                </div>
                <div className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-950/80 backdrop-blur-md text-slate-300">
                  {item.type === 'video' ? <Video className="w-3 h-3 text-purple-400" /> : <ImageIcon className="w-3 h-3 text-cyan-400" />}
                </div>
              </div>

              {/* Info Snippet */}
              <div className="p-2 flex flex-col gap-0.5 bg-slate-900/90">
                <span className="text-[11px] font-semibold text-white truncate">
                  {item.prompt}
                </span>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="capitalize">{item.artStyle.replace('_', ' ')}</span>
                  <span>{item.background3D.replace('_', ' ')}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
