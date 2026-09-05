import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Sparkles, 
  SlidersHorizontal 
} from 'lucide-react';
import { GeneratedAsset } from '../types.ts';

interface VideoPlayerProps {
  asset: GeneratedAsset | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onOpenUpscaler: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  asset,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  onOpenUpscaler,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * duration;
    onSeek(newTime);
  };

  const handleStep = (delta: number) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + delta));
    onSeek(nextTime);
  };

  return (
    <div id="video-player-hud" className="w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-xl">
      {/* Scrubber Timeline */}
      <div className="flex flex-col gap-1">
        <div className="relative flex items-center group">
          <input
            id="video-timeline-scrubber"
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent}
            onChange={handleScrubChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:h-2.5 transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">|</span>
            <span>Duration: {formatTime(duration)}</span>
            {asset?.frameRate && (
              <span className="text-purple-400 font-bold">@{asset.frameRate}fps</span>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Step Back (0.5s) */}
          <button
            id="btn-step-back"
            type="button"
            onClick={() => handleStep(-0.5)}
            title="Step Back 0.5s"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            id="btn-toggle-play"
            type="button"
            onClick={onTogglePlay}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md transition-all"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          {/* Step Forward (0.5s) */}
          <button
            id="btn-step-forward"
            type="button"
            onClick={() => handleStep(0.5)}
            title="Step Forward 0.5s"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Restart */}
          <button
            id="btn-restart-video"
            type="button"
            onClick={() => onSeek(0)}
            title="Restart to 00:00"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">Speed:</span>
            {[0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                id={`speed-btn-${s}`}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                  playbackSpeed === s
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Action: Launch AI Upscaler */}
        <div className="flex items-center gap-2">
          <button
            id="btn-open-upscaler"
            type="button"
            onClick={onOpenUpscaler}
            disabled={!asset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            AI 4K Upscaler
          </button>
        </div>
      </div>
    </div>
  );
};
