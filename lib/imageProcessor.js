import imageCompression from 'browser-image-compression';
import cloudinary from 'cloudinary';
import Replicate from 'replicate';

export const OPTIMIZED_PROMPTS = [
  'professional headshot, golden hour lighting, blurred cafe background, photorealistic, high quality',
  'professional portrait, studio lighting, neutral gray background, confident smile, sharp focus',
  'candid photo, natural lighting, outdoor park background, casual smart outfit, photorealistic',
  'professional headshot, softbox lighting, office background, business casual, high detail',
  'portrait photography, sunset lighting, rooftop bar background, stylish outfit, 4k quality',
];

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function compressImageForUpload(file) {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: 'image/jpeg',
    maxIteration: 8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error(`Compression failed for ${file.name}`);
  }
}

export async function compressImagesInParallel(files) {
  const compressed = await Promise.all(
    files.map(async (file) => {
      try {
        const compressedFile = await compressImageForUpload(file);
        return {
          originalName: file.name,
          file: compressedFile,
          success: true,
        };
      } catch (error) {
        return {
          originalName: file.name,
          file: null,
          success: false,
          error: error.message,
        };
      }
    }),
  );

  return compressed;
}

async function runReplicateGeneration(imageFile, prompt, signal) {
  return replicate.run('stability-ai/sdxl', {
    input: {
      image: imageFile,
      prompt,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    },
    timeout: 30000,
    signal,
  });
}

export async function processImagesInParallel(files, options = {}) {
  const { promptSet = OPTIMIZED_PROMPTS, onProgress, signal } = options;

  const results = [];
  const errors = [];

  const queue = files.map((file, index) => ({
    file,
    prompt: promptSet[index % promptSet.length],
    index,
  }));

  await Promise.all(
    queue.map(async ({ file, prompt, index }) => {
      try {
        onProgress?.({
          type: 'status',
          message: `Processing photo ${index + 1} of ${files.length}...`,
          current: index + 1,
          total: files.length,
        });

        let response;
        let retryCount = 0;

        while (retryCount < 2) {
          try {
            response = await runReplicateGeneration(file, prompt, signal);
            break;
          } catch (error) {
            retryCount += 1;
            if (retryCount >= 2) {
              throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        results.push({
          index,
          fileName: file.name,
          output: response,
          status: 'success',
        });

        onProgress?.({
          type: 'progress',
          message: `Photo ${index + 1} complete`,
          current: index + 1,
          total: files.length,
        });
      } catch (error) {
        const failure = {
          index,
          fileName: file.name,
          error: error.message,
          status: 'failed',
        };

        errors.push(failure);

        onProgress?.({
          type: 'error',
          message: `Failed to process ${file.name}. Retrying or skipping failed image.`,
          current: index + 1,
          total: files.length,
          error: error.message,
        });
      }
    }),
  );

  return {
    results,
    errors,
    successfulCount: results.length,
    failedCount: errors.length,
  };
}

export async function uploadResultsToCloudinary(results) {
  const uploaded = await Promise.all(
    results.map(async (result) => {
      try {
        const uploadedImage = await cloudinary.v2.uploader.upload(result.output, {
          folder: 'headshotly/generated',
          resource_type: 'image',
        });

        return {
          ...result,
          cloudinaryUrl: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        };
      } catch (error) {
        console.error('Cloudinary upload failed for result:', result.fileName, error);
        return {
          ...result,
          cloudinaryUrl: null,
          publicId: null,
          error: error.message,
        };
      }
    }),
  );

  return uploaded;
}

export function getSignedDownloadUrls(publicIds) {
  return publicIds.map((publicId) => ({
    publicId,
    signedUrl: cloudinary.v2.url(publicId, {
      sign_url: true,
      resource_type: 'image',
      fetch_format: 'auto',
      quality: 'auto',
    }),
  }));
}
