import React, { useState, useRef } from 'react';
import { UpscaleOptions, GeneratedAsset } from '../types.ts';
import { processUpscale, UpscaleResult } from '../utils/upscaleEngine.ts';
import { 
  X, 
  Sparkles, 
  Download, 
  Check, 
  Sliders, 
  Layers, 
  ZoomIn, 
  Maximize, 
  Eye, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

interface UpscalerModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: GeneratedAsset | null;
  onApplyUpscale: (upscaledUrl: string, resolution: string) => void;
}

export const UpscalerModal: React.FC<UpscalerModalProps> = ({
  isOpen,
  onClose,
  asset,
  onApplyUpscale,
}) => {
  const [options, setOptions] = useState<UpscaleOptions>({
    targetResolution: '4k',
    detailBoost: 'ultra_texture',
    edgeRefinement: true,
    noiseSuppression: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [upscaleResult, setUpscaleResult] = useState<UpscaleResult | null>(null);
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 split view
  const [isComparing, setIsComparing] = useState(false);
  const [showLoupe, setShowLoupe] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50 });

  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !asset) return null;

  const handleRunUpscale = async () => {
    setIsProcessing(true);
    try {
      const srcUrl = asset.imageUrl;
      const result = await processUpscale(srcUrl, options);
      setUpscaleResult(result);
    } catch (err) {
      console.error('Upscale failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadUpscaled = () => {
    if (!upscaleResult) return;
    const a = document.createElement('a');
    a.href = upscaleResult.upscaledDataUrl;
    a.download = `upscaled-${options.targetResolution}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleApplyTo3D = () => {
    if (!upscaleResult) return;
    onApplyUpscale(upscaleResult.upscaledDataUrl, upscaleResult.targetResolution);
    onClose();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isComparing) {
      setSliderPos(Math.max(5, Math.min(95, x)));
    }
    setLoupePos({ x, y });
  };

  return (
    <div id="upscaler-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Super-Resolution & Clarity Upscaler
              </h2>
              <p className="text-xs text-slate-400">
                Enhance micro-textures, crisp edge contours, and expand to 4K Ultra HD fidelity
              </p>
            </div>
          </div>

          <button
            id="btn-close-upscaler"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
          {/* Left Preview Stage with Split Comparison Slider */}
          <div className="flex-1 flex flex-col gap-3">
            <div
              ref={containerRef}
              className="relative w-full h-[320px] md:h-[400px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none cursor-crosshair group"
              onMouseDown={() => setIsComparing(true)}
              onMouseUp={() => setIsComparing(false)}
              onMouseLeave={() => {
                setIsComparing(false);
                setShowLoupe(false);
              }}
              onMouseEnter={() => setShowLoupe(true)}
              onMouseMove={handleMouseMove}
            >
              {/* Original Base Image */}
              <img
                src={asset.imageUrl}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Upscaled Overlay with Clip Path Slider */}
              {upscaleResult && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <img
                    src={upscaleResult.upscaledDataUrl}
                    alt="Upscaled 4K"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Split Slider Divider Bar */}
              {upscaleResult && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-lg border-2 border-white">
                    VS
                  </div>
                </div>
              )}

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-mono font-semibold text-slate-300 border border-slate-800">
                Original ({asset.quality.toUpperCase()})
              </div>

              {upscaleResult && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-950/80 backdrop-blur-md text-[11px] font-mono font-semibold text-amber-400 border border-amber-800/80">
                  {upscaleResult.targetResolution} Upscaled ({upscaleResult.upscaledWidth}×{upscaleResult.upscaledHeight})
                </div>
              )}

              {/* Loupe Detail Magnifier Badge */}
              {showLoupe && upscaleResult && (
                <div
                  className="absolute pointer-events-none w-28 h-28 rounded-full border-2 border-amber-400 overflow-hidden shadow-2xl bg-slate-950 z-30 hidden md:block"
                  style={{
                    left: `calc(${loupePos.x}% - 56px)`,
                    top: `calc(${loupePos.y}% - 56px)`,
                  }}
                >
                  <img
                    src={upscaleResult.upscaledDataUrl}
                    alt="Magnified Detail"
                    className="absolute max-w-none"
                    style={{
                      width: '400%',
                      height: '400%',
                      left: `-${loupePos.x * 4 - 56}px`,
                      top: `-${loupePos.y * 4 - 56}px`,
                    }}
                  />
                  <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 rounded">
                    4X
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-40">
                  <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <p className="text-sm font-semibold text-white">Synthesizing 4K Micro-Textures...</p>
                  <p className="text-xs text-slate-400">Adaptive sharpening & high-frequency edge restoration</p>
                </div>
              )}
            </div>

            {upscaleResult ? (
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>👈 Drag slider to compare Original vs Upscaled</span>
                <span className="text-amber-400 font-mono">
                  Scale Factor: {upscaleResult.scaleFactor}x in {upscaleResult.processingTimeMs}ms
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center">
                Select your desired resolution and options on the right, then click "Process AI Upscale"
              </div>
            )}
          </div>

          {/* Right Parameters Panel */}
          <div className="w-full md:w-72 flex flex-col gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            {/* Target Resolution */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Target Resolution
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['1080p', '2k', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    id={`target-res-${res}`}
                    type="button"
                    onClick={() => setOptions({ ...options, targetResolution: res })}
                    className={`py-2 text-xs font-bold rounded-lg uppercase font-mono transition-all ${
                      options.targetResolution === res
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {res === '4k' ? '4K UHD' : res.toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500">
                {options.targetResolution === '4k' ? '3840 × 2160 (Ultra-sharp micro-details)' : options.targetResolution === '2k' ? '2560 × 1440 (Crisp display quality)' : '1920 × 1080 (Fast Full HD)'}
              </span>
            </div>

            {/* Detail Boost */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Detail Enhancement
              </label>
              <select
                id="select-detail-boost"
                value={options.detailBoost}
                onChange={(e) => setOptions({ ...options, detailBoost: e.target.value as any })}
                className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="balanced">Balanced (Natural Clarity)</option>
                <option value="sharp">Sharp (Accentuated Contours)</option>
                <option value="ultra_texture">Ultra Texture (Deep 4K Specular & Grain)</option>
              </select>
            </div>

            {/* Toggles: Edge Refinement & Noise Suppression */}
            <div className="flex flex-col gap-2.5 pt-1">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Edge Refinement (Anti-Halo)</span>
                <input
                  type="checkbox"
                  checked={options.edgeRefinement}
                  onChange={(e) => setOptions({ ...options, edgeRefinement: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Noise Suppression Gate</span>
                <input
                  type="checkbox"
                  checked={options.noiseSuppression}
                  onChange={(e) => setOptions({ ...options, noiseSuppression: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500"
                />
              </label>
            </div>

            {/* Process Button */}
            <button
              id="btn-run-upscale-engine"
              type="button"
              onClick={handleRunUpscale}
              disabled={isProcessing}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isProcessing ? 'animate-bounce' : ''}`} />
              {isProcessing ? 'Processing Super-Resolution...' : `Process ${options.targetResolution.toUpperCase()} Upscale`}
            </button>

            {/* Action Buttons if Upscaled */}
            {upscaleResult && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <button
                  id="btn-apply-upscale-to-stage"
                  type="button"
                  onClick={handleApplyTo3D}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply 4K to 3D Stage
                </button>

                <button
                  id="btn-download-upscaled-master"
                  type="button"
                  onClick={handleDownloadUpscaled}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download Master PNG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
