import { v2 as cloudinary } from 'cloudinary';

export const BACKGROUND_OPTIONS: Record<string, string> = {
  'Warm Gray': 'F0EEEC',
  'Studio White': 'FFFFFF',
  'Muted Blush': 'F4E2E2',
  'Deep Charcoal': '1F1F1F',
  'Soft Marble': 'EDE7E0',
};

export const DEFAULT_ASPECT_RATIO = '4:5';

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export function resolveBackgroundHex(background: string | null | undefined) {
  const normalized = (background ?? 'Warm Gray').trim();
  return BACKGROUND_OPTIONS[normalized] ?? BACKGROUND_OPTIONS['Warm Gray'];
}

export function buildEnhancementTransformation(backgroundHex: string, aspectRatio = DEFAULT_ASPECT_RATIO) {
  const safeAspectRatio = aspectRatio && aspectRatio.includes(':') ? aspectRatio : DEFAULT_ASPECT_RATIO;

  // We deliberately use the classical, deterministic Cloudinary transforms here.
  // This avoids e_gen_* features that redraw the subject and can alter identity.
  return `e_background_removal/b_rgb:${backgroundHex}/c_fill,g_face,ar_${safeAspectRatio},w_1200/e_improve/e_auto_contrast/e_auto_color/e_vibrance:20/e_sharpen:60`;
}
