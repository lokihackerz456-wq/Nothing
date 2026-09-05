export type OutputType = 'image' | 'video';

export type QualityLevel = '720p' | '1080p' | '2k' | '4k';

export type ArtStyle = 
  | 'photorealistic'
  | 'anime'
  | 'watercolor'
  | 'oil_painting'
  | 'cyberpunk'
  | 'cinematic_3d';

export type Background3DTheme = 
  | 'sci_fi_city'
  | 'enchanted_forest'
  | 'abstract_geometric'
  | 'minimalist_studio'
  | 'cosmic_nebula';

export type MotionStyle = 'smooth' | 'choppy' | 'slow-motion' | 'bouncing';

export type FrameRate = 24 | 30 | 60;

export type CameraMovement = 
  | 'orbit'
  | 'pan_left'
  | 'pan_right'
  | 'zoom_in'
  | 'zoom_out'
  | 'tilt_up'
  | 'tilt_down'
  | 'drone_fpv';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export interface LightingConfig {
  brightness: number; // 0.2 to 2.5, default 1.0
  colorTemperature: number; // 0 (warm amber 2700K) to 1 (cool ice-blue 7000K), default 0.5 (neutral white)
  ambientIntensity: number; // 0.2 to 2.0, default 1.0
}

export interface GenerationConfig {
  type: OutputType;
  prompt: string;
  artStyle: ArtStyle;
  background3D: Background3DTheme;
  lighting: LightingConfig;
  quality: QualityLevel;
  aspectRatio: AspectRatio;
  // Video specific controls
  duration: number; // 5, 10, 15 seconds
  frameRate: FrameRate; // 24, 30, 60 fps
  motionStyle: MotionStyle;
  animationSpeed: number; // 0.25 to 2.5
  cameraMovement: CameraMovement;
}

export interface GeneratedAsset {
  id: string;
  type: OutputType;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  artStyle: ArtStyle;
  background3D: Background3DTheme;
  lighting: LightingConfig;
  quality: QualityLevel;
  aspectRatio: AspectRatio;
  createdAt: number;
  // Video parameters
  duration?: number;
  frameRate?: FrameRate;
  motionStyle?: MotionStyle;
  animationSpeed?: number;
  cameraMovement?: CameraMovement;
  // Upscaling status
  isUpscaled?: boolean;
  upscaledUrl?: string;
  upscaledResolution?: string;
}

export interface UpscaleOptions {
  targetResolution: '1080p' | '2k' | '4k';
  detailBoost: 'balanced' | 'sharp' | 'ultra_texture';
  edgeRefinement: boolean;
  noiseSuppression: boolean;
}
