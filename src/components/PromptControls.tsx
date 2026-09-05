import React, { useState } from 'react';
import { 
  OutputType, 
  ArtStyle, 
  Background3DTheme, 
  LightingConfig, 
  QualityLevel, 
  AspectRatio,
  MotionStyle,
  FrameRate,
  CameraMovement,
  GenerationConfig
} from '../types.ts';
import { 
  Sparkles, 
  Wand2, 
  SunMedium, 
  Thermometer, 
  Video, 
  Image as ImageIcon, 
  Sliders, 
  Clock, 
  Gauge, 
  Move, 
  Palette, 
  Box, 
  ChevronDown, 
  ChevronUp,
  Flame,
  Check
} from 'lucide-react';

interface PromptControlsProps {
  config: GenerationConfig;
  onChange: (newConfig: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
}

const ART_STYLES: { id: ArtStyle; label: string; desc: string; icon: string }[] = [
  { id: 'photorealistic', label: 'Photorealistic', desc: '8K optical fidelity, realistic textures & lighting', icon: '📸' },
  { id: 'anime', label: 'Anime', desc: 'Japanese animation cel-shaded aesthetic', icon: '✨' },
  { id: 'watercolor', label: 'Watercolor', desc: 'Delicate pigments, paper texture washes', icon: '🎨' },
  { id: 'oil_painting', label: 'Oil Painting', desc: 'Rich impasto brushwork, textured canvas', icon: '🖌️' },
  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'High-contrast neon, chrome reflections & rain', icon: '⚡' },
  { id: 'cinematic_3d', label: 'Cinematic 3D', desc: 'Volumetric studio octane render, deep depth of field', icon: '🎬' },
];

const BACKGROUND_THEMES: { id: Background3DTheme; label: string; desc: string; badgeColor: string }[] = [
  { id: 'sci_fi_city', label: 'Sci-Fi City', desc: 'Neon skyscrapers, light streams, cyber horizon', badgeColor: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30' },
  { id: 'enchanted_forest', label: 'Enchanted Forest', desc: 'Bioluminescent canopies, glowing fireflies', badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' },
  { id: 'abstract_geometric', label: 'Abstract Geometric', desc: 'Floating Platonic solids, neon wireframes', badgeColor: 'border-purple-500/50 text-purple-400 bg-purple-950/30' },
  { id: 'minimalist_studio', label: 'Minimalist Studio', desc: 'Museum pedestal, soft horizon curve, clean light', badgeColor: 'border-amber-500/50 text-amber-400 bg-amber-950/30' },
  { id: 'cosmic_nebula', label: 'Cosmic Nebula', desc: 'Deep space stardust, swirling galaxy ring', badgeColor: 'border-blue-500/50 text-blue-400 bg-blue-950/30' },
];

const MOTION_STYLES: { id: MotionStyle; label: string; desc: string }[] = [
  { id: 'smooth', label: 'Smooth', desc: 'Cinematic fluid ease curve' },
  { id: 'choppy', label: 'Choppy', desc: 'Stepped stop-motion 10fps animation' },
  { id: 'slow-motion', label: 'Slow-Motion', desc: 'Deep viscous high-speed camera sway' },
  { id: 'bouncing', label: 'Bouncing', desc: 'Harmonic spring physics with recoil' },
];

const CAMERA_MOVEMENTS: { id: CameraMovement; label: string }[] = [
  { id: 'orbit', label: 'Orbit 360°' },
  { id: 'pan_left', label: 'Pan Left' },
  { id: 'pan_right', label: 'Pan Right' },
  { id: 'zoom_in', label: 'Zoom In' },
  { id: 'zoom_out', label: 'Zoom Out' },
  { id: 'tilt_up', label: 'Tilt Up' },
  { id: 'tilt_down', label: 'Tilt Down' },
  { id: 'drone_fpv', label: 'Drone FPV' },
];

const PROMPT_SUGGESTIONS = [
  'Futuristic cybernetic samurai standing on a skyscraper ledge in the rain',
  'Mystical glowing crystal phoenix rising from an ancient temple altar',
  'Hypercar with holographic light trails speeding through a quantum tunnel',
  'Golden astronaut holding a glowing bioluminescent lotus blossom',
  'Vibrant neon jellyfish swimming through a dark alien nebula',
];

export const PromptControls: React.FC<PromptControlsProps> = ({
  config,
  onChange,
  onGenerate,
  isGenerating,
  onEnhancePrompt,
  isEnhancing,
}) => {
  const [showAdvancedLighting, setShowAdvancedLighting] = useState(false);

  const handleUpdate = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleLightingUpdate = <K extends keyof LightingConfig>(key: K, value: LightingConfig[K]) => {
    onChange({
      ...config,
      lighting: {
        ...config.lighting,
        [key]: value,
      },
    });
  };

  return (
    <div id="prompt-controls-panel" className="flex flex-col gap-5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-xl">
      {/* 1. Mode Switcher & Quality Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        {/* Output Type: Image vs Video */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            id="tab-output-image"
            type="button"
            onClick={() => handleUpdate('type', 'image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              config.type === 'image'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Text to Image
          </button>
          <button
            id="tab-output-video"
            type="button"
            onClick={() => handleUpdate('type', 'video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              config.type === 'video'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Text to Video
          </button>
        </div>

        {/* Quality Resolution Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['720p', '1080p', '2k', '4k'] as QualityLevel[]).map((q) => (
            <button
              key={q}
              id={`quality-pill-${q}`}
              type="button"
              onClick={() => handleUpdate('quality', q)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                config.quality === q
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {q === '4k' ? '4K Ultra' : q.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Text Prompt Input Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="main-prompt-input" className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Describe Your Scene / Subject
          </label>
          <button
            id="btn-enhance-prompt-ai"
            type="button"
            onClick={onEnhancePrompt}
            disabled={isEnhancing || !config.prompt.trim()}
            title="Use Gemini AI to enrich your prompt with cinematic lighting, materials & 3D cues"
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
            {isEnhancing ? 'Enhancing...' : 'AI Enhance Prompt'}
          </button>
        </div>

        <div className="relative">
          <textarea
            id="main-prompt-input"
            rows={3}
            value={config.prompt}
            onChange={(e) => handleUpdate('prompt', e.target.value)}
            placeholder="E.g., A sleek cybernetic panther with glowing blue neon circuitry prowling through a misty bamboo grove..."
            className="w-full bg-slate-950/90 text-slate-100 placeholder:text-slate-500 rounded-xl p-3.5 text-sm border border-slate-700/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none shadow-inner"
          />
        </div>

        {/* Prompt Inspiration Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
          <span className="text-slate-500 text-[11px] font-medium whitespace-nowrap flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" /> Ideas:
          </span>
          {PROMPT_SUGGESTIONS.map((idea, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleUpdate('prompt', idea)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-all text-[11px]"
            >
              {idea.slice(0, 32)}...
            </button>
          ))}
        </div>
      </div>

      {/* 3. Art Styles (Photorealistic, Anime, Watercolor, Oil Painting, Cyberpunk) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-pink-400" />
          Predefined Art Styles
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {ART_STYLES.map((style) => {
            const isSelected = config.artStyle === style.id;
            return (
              <button
                key={style.id}
                id={`art-style-btn-${style.id}`}
                type="button"
                onClick={() => handleUpdate('artStyle', style.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-lg mb-1">{style.icon}</span>
                <span className="text-xs font-semibold leading-tight">{style.label}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{style.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 3D Background Customization & Lighting */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            3D Background Theme
          </label>
          <button
            id="toggle-lighting-controls"
            type="button"
            onClick={() => setShowAdvancedLighting(!showAdvancedLighting)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            <Sliders className="w-3 h-3" />
            {showAdvancedLighting ? 'Hide Lighting' : 'Adjust Lighting'}
            {showAdvancedLighting ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* 3D Background Theme Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {BACKGROUND_THEMES.map((theme) => {
            const isSelected = config.background3D === theme.id;
            return (
              <button
                key={theme.id}
                id={`bg-theme-btn-${theme.id}`}
                type="button"
                onClick={() => handleUpdate('background3D', theme.id)}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `${theme.badgeColor} ring-1 ring-cyan-500/40 font-semibold shadow-sm`
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold">{theme.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">{theme.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Lighting Controls: Brightness & Color Temperature */}
        {showAdvancedLighting && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 mt-2 border-t border-slate-800/80 animate-fade-in">
            {/* Brightness Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <SunMedium className="w-3.5 h-3.5 text-amber-400" /> Brightness
                </span>
                <span className="font-mono text-cyan-400 font-semibold">{config.lighting.brightness.toFixed(1)}x</span>
              </div>
              <input
                id="slider-brightness"
                type="range"
                min="0.3"
                max="2.2"
                step="0.1"
                value={config.lighting.brightness}
                onChange={(e) => handleLightingUpdate('brightness', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Moody Dark</span>
                <span>Vibrant HD</span>
              </div>
            </div>

            {/* Color Temperature Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Color Temp
                </span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {config.lighting.colorTemperature < 0.35 ? 'Warm Amber' : config.lighting.colorTemperature > 0.65 ? 'Cool Ice' : 'Neutral White'}
                </span>
              </div>
              <input
                id="slider-color-temp"
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.lighting.colorTemperature}
                onChange={(e) => handleLightingUpdate('colorTemperature', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gradient-to-r from-amber-500 via-slate-200 to-cyan-400 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>2700K Warm</span>
                <span>7000K Cool</span>
              </div>
            </div>

            {/* Ambient Intensity Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Ambient Shadow Fill</span>
                <span className="font-mono text-cyan-400 font-semibold">{config.lighting.ambientIntensity.toFixed(1)}x</span>
              </div>
              <input
                id="slider-ambient"
                type="range"
                min="0.2"
                max="1.8"
                step="0.1"
                value={config.lighting.ambientIntensity}
                onChange={(e) => handleLightingUpdate('ambientIntensity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Dramatic Contrast</span>
                <span>Soft Fill</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Video Generation Controls (Shown when Output Type is Video) */}
      {config.type === 'video' && (
        <div id="video-generation-controls-box" className="flex flex-col gap-3.5 p-4 rounded-xl bg-purple-950/20 border border-purple-800/40">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wider text-purple-300 uppercase flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              Video Generation & Animation Parameters
            </label>
            <span className="text-[11px] text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-700/50">
              3D Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Duration (5s, 10s, 15s) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[5, 10, 15].map((d) => (
                  <button
                    key={d}
                    id={`btn-duration-${d}s`}
                    type="button"
                    onClick={() => handleUpdate('duration', d)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      config.duration === d
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate (24fps, 30fps, 60fps) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Frame Rate
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {([24, 30, 60] as FrameRate[]).map((fps) => (
                  <button
                    key={fps}
                    id={`btn-fps-${fps}`}
                    type="button"
                    onClick={() => handleUpdate('frameRate', fps)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      config.frameRate === fps
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fps} fps
                  </button>
                ))}
              </div>
            </div>

            {/* Motion Style (Smooth, Choppy, Slow-Motion, Bouncing) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-pink-400" /> Motion Style
              </span>
              <select
                id="select-motion-style"
                value={config.motionStyle}
                onChange={(e) => handleUpdate('motionStyle', e.target.value as MotionStyle)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
              >
                {MOTION_STYLES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Movement */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-cyan-400" /> Camera Movement
              </span>
              <select
                id="select-camera-movement"
                value={config.cameraMovement}
                onChange={(e) => handleUpdate('cameraMovement', e.target.value as CameraMovement)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
              >
                {CAMERA_MOVEMENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 6. Aspect Ratio & Generate Master Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Aspect Ratio:</span>
          {(['16:9', '9:16', '1:1', '4:3'] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              id={`aspect-btn-${ratio.replace(':', '-')}`}
              type="button"
              onClick={() => handleUpdate('aspectRatio', ratio)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                config.aspectRatio === ratio
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* Main Generate Button */}
        <button
          id="btn-generate-master"
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !config.prompt.trim()}
          className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? `Generating ${config.type === 'video' ? 'Video' : 'Image'} (${config.quality.toUpperCase()})...` : `Generate ${config.type === 'video' ? 'HD Video' : 'HD Image'}`}
        </button>
      </div>
    </div>
  );
};
