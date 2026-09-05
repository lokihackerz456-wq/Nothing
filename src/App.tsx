/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GenerationConfig, 
  GeneratedAsset, 
  ArtStyle, 
  Background3DTheme, 
  QualityLevel 
} from './types.ts';
import { ThreeCanvas } from './components/ThreeCanvas.tsx';
import { PromptControls } from './components/PromptControls.tsx';
import { VideoPlayer } from './components/VideoPlayer.tsx';
import { UpscalerModal } from './components/UpscalerModal.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { 
  Sparkles, 
  Box, 
  Video, 
  Image as ImageIcon, 
  Zap, 
  Sliders, 
  Layers, 
  ShieldCheck,
  Palette
} from 'lucide-react';

export default function App() {
  // Generation Configuration State
  const [config, setConfig] = useState<GenerationConfig>({
    type: 'video',
    prompt: 'Futuristic cybernetic samurai standing on a skyscraper rooftop in a neon metropolis during rain',
    artStyle: 'cyberpunk',
    background3D: 'sci_fi_city',
    lighting: {
      brightness: 1.1,
      colorTemperature: 0.75, // Cool neon blue
      ambientIntensity: 1.0,
    },
    quality: '1080p',
    aspectRatio: '16:9',
    duration: 5,
    frameRate: 30,
    motionStyle: 'smooth',
    animationSpeed: 1.0,
    cameraMovement: 'orbit',
  });

  // Assets & History
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [history, setHistory] = useState<GeneratedAsset[]>([]);

  // Video playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Status flags
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isUpscalerOpen, setIsUpscalerOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Initial load: generate initial starter creation so the user sees a working studio immediately!
  useEffect(() => {
    handleGenerate();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Main Generation Handler
  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error(`Generation failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.asset) {
        const newAsset: GeneratedAsset = data.asset;
        setCurrentAsset(newAsset);
        setHistory((prev) => [newAsset, ...prev.filter((a) => a.id !== newAsset.id)].slice(0, 15));
        setCurrentTime(0);
        setSeekTime(0);
        setIsPlaying(true);
        showToast(`✨ Generated ${newAsset.type === 'video' ? '3D Animated Video' : 'HD Image'} in ${newAsset.artStyle.replace('_', ' ')} style!`);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      showToast('⚠️ Generation error, please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (!config.prompt.trim()) return;

    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: config.prompt,
          artStyle: config.artStyle,
          background3D: config.background3D,
          quality: config.quality,
          lighting: config.lighting,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enhancedPrompt) {
          setConfig((prev) => ({ ...prev, prompt: data.enhancedPrompt }));
          showToast('🪄 Prompt enhanced with cinematic 3D detail!');
        }
      }
    } catch (err) {
      console.warn('Enhance prompt failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Apply 4K Upscale to the current active asset & 3D stage
  const handleApplyUpscale = (upscaledUrl: string, resolution: string) => {
    if (!currentAsset) return;
    const updated: GeneratedAsset = {
      ...currentAsset,
      upscaledUrl,
      upscaledResolution: resolution,
      isUpscaled: true,
    };
    setCurrentAsset(updated);
    setHistory((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    showToast(`💎 Applied ${resolution} Ultra-Resolution texture to 3D Stage!`);
  };

  const handleSelectHistoryAsset = (asset: GeneratedAsset) => {
    setCurrentAsset(asset);
    setConfig((prev) => ({
      ...prev,
      type: asset.type,
      prompt: asset.prompt,
      artStyle: asset.artStyle,
      background3D: asset.background3D,
      lighting: asset.lighting || prev.lighting,
      quality: asset.quality,
      aspectRatio: asset.aspectRatio,
      duration: asset.duration || prev.duration,
      frameRate: asset.frameRate || prev.frameRate,
      motionStyle: asset.motionStyle || prev.motionStyle,
      animationSpeed: asset.animationSpeed || prev.animationSpeed,
      cameraMovement: asset.cameraMovement || prev.cameraMovement,
    }));
    setCurrentTime(0);
    setSeekTime(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Studio Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Text to Image & Video 3D Studio
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              HD Clarity • 3D Backgrounds • Animation & Camera Controls • 4K Upscaler
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">Gemini 2.5 + WebGL 3D</span>
          </div>

          <button
            id="btn-nav-upscaler"
            type="button"
            onClick={() => setIsUpscalerOpen(true)}
            disabled={!currentAsset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            4K Upscaler
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-cyan-500/50 text-cyan-200 px-4 py-2 rounded-full text-xs font-medium shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero Section: Interactive 3D Canvas Stage */}
        <section className="flex flex-col gap-3">
          <div className="w-full h-[440px] sm:h-[500px] lg:h-[560px]">
            <ThreeCanvas
              asset={currentAsset}
              background3D={config.background3D}
              lighting={config.lighting}
              motionStyle={config.motionStyle}
              animationSpeed={playbackSpeed * config.animationSpeed}
              cameraMovement={config.cameraMovement}
              duration={config.duration}
              frameRate={config.frameRate}
              isPlaying={isPlaying}
              onTimeUpdate={(t) => setCurrentTime(t)}
              seekTime={seekTime}
              aspectRatio={config.aspectRatio}
            />
          </div>

          {/* Video Timeline & Playback Bar */}
          <VideoPlayer
            asset={currentAsset}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            currentTime={currentTime}
            duration={config.duration}
            onSeek={(t) => {
              setSeekTime(t);
              setCurrentTime(t);
            }}
            playbackSpeed={playbackSpeed}
            onChangeSpeed={(s) => setPlaybackSpeed(s)}
            onOpenUpscaler={() => setIsUpscalerOpen(true)}
          />
        </section>

        {/* Prompt & Generation Controls */}
        <section>
          <PromptControls
            config={config}
            onChange={(newConfig) => setConfig(newConfig)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onEnhancePrompt={handleEnhancePrompt}
            isEnhancing={isEnhancing}
          />
        </section>

        {/* Gallery / History Carousel */}
        {history.length > 0 && (
          <section>
            <HistoryDrawer
              assets={history}
              selectedId={currentAsset?.id || null}
              onSelect={handleSelectHistoryAsset}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>Text to Image & Video 3D Studio • Powered by Google Gemini AI & Three.js WebGL</p>
      </footer>

      {/* 4K Super-Resolution Upscaler Modal */}
      <UpscalerModal
        isOpen={isUpscalerOpen}
        onClose={() => setIsUpscalerOpen(false)}
        asset={currentAsset}
        onApplyUpscale={handleApplyUpscale}
      />
    </div>
  );
}
