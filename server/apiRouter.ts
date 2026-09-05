import express, { Request, Response, Router } from 'express';
import { enhancePromptWithAI, generateImageContent } from './geminiService.ts';
import { GenerationConfig, UpscaleOptions } from '../src/types.ts';

export const apiRouter: Router = express.Router();

apiRouter.use(express.json({ limit: '50mb' }));

// Health & Status Check
apiRouter.get('/status', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'online',
    hasGeminiKey: hasKey,
    styles: ['photorealistic', 'anime', 'watercolor', 'oil_painting', 'cyberpunk', 'cinematic_3d'],
    backgrounds: ['sci_fi_city', 'enchanted_forest', 'abstract_geometric', 'minimalist_studio', 'cosmic_nebula'],
    features: ['video_controls', 'duration_control', 'framerate_control', 'motion_styles', 'lighting_adjustments', '4k_upscaling'],
  });
});

// Prompt Enhancement
apiRouter.post('/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, artStyle, background3D, quality, lighting } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const enhanced = await enhancePromptWithAI(
      prompt,
      artStyle || 'photorealistic',
      background3D || 'sci_fi_city',
      quality || '1080p',
      lighting || { brightness: 1.0, colorTemperature: 0.5, ambientIntensity: 1.0 }
    );

    res.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    res.status(500).json({ error: error?.message || 'Failed to enhance prompt' });
  }
});

// Main Generation (Image & Video)
apiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const config: GenerationConfig = req.body;
    if (!config.prompt || config.prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Default fallbacks for all requested fields
    config.type = config.type || 'image';
    config.artStyle = config.artStyle || 'photorealistic';
    config.background3D = config.background3D || 'sci_fi_city';
    config.lighting = config.lighting || { brightness: 1.0, colorTemperature: 0.5, ambientIntensity: 1.0 };
    config.quality = config.quality || '1080p';
    config.aspectRatio = config.aspectRatio || '16:9';
    config.duration = config.duration || 5;
    config.frameRate = config.frameRate || 30;
    config.motionStyle = config.motionStyle || 'smooth';
    config.animationSpeed = config.animationSpeed || 1.0;
    config.cameraMovement = config.cameraMovement || 'orbit';

    // Generate visual content
    const { imageUrl, enhancedPrompt } = await generateImageContent(config);

    const assetId = 'gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    res.json({
      success: true,
      asset: {
        id: assetId,
        type: config.type,
        prompt: config.prompt,
        enhancedPrompt,
        imageUrl,
        artStyle: config.artStyle,
        background3D: config.background3D,
        lighting: config.lighting,
        quality: config.quality,
        aspectRatio: config.aspectRatio,
        createdAt: Date.now(),
        // Video specific controls
        duration: config.duration,
        frameRate: config.frameRate,
        motionStyle: config.motionStyle,
        animationSpeed: config.animationSpeed,
        cameraMovement: config.cameraMovement,
      },
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate visual asset' });
  }
});

// Upscale Processing
apiRouter.post('/upscale', async (req: Request, res: Response) => {
  try {
    const { imageUrl, options }: { imageUrl: string; options: UpscaleOptions } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const targetRes = options?.targetResolution || '4k';
    const resolutionMap = {
      '1080p': { width: 1920, height: 1080, label: '1080p Full HD (1920 × 1080)' },
      '2k': { width: 2560, height: 1440, label: '2K QHD (2560 × 1440)' },
      '4k': { width: 3840, height: 2160, label: '4K Ultra HD (3840 × 2160)' },
    };

    const targetDimensions = resolutionMap[targetRes] || resolutionMap['4k'];

    res.json({
      success: true,
      targetResolution: targetRes,
      dimensions: targetDimensions,
      detailBoost: options?.detailBoost || 'ultra_texture',
      sharpenFactor: options?.detailBoost === 'ultra_texture' ? 2.5 : options?.detailBoost === 'sharp' ? 1.8 : 1.2,
      contrastGain: 1.15,
      noiseSuppression: options?.noiseSuppression ?? true,
      edgeRefinement: options?.edgeRefinement ?? true,
    });
  } catch (error: any) {
    console.error('Upscale error:', error);
    res.status(500).json({ error: error?.message || 'Failed to process upscale' });
  }
});
