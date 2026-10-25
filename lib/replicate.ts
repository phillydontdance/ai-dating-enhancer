import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export const REPLICATE_MODEL =
  'zsxkib/instant-id:1e773f9e1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c';

export async function generateHeadshots(imageUrl: string, background: string): Promise<string[]> {
  const backgrounds: Record<string, string> = {
    'Warm Gray': 'warm gray studio backdrop',
    'Studio White': 'pure white studio background',
    'Muted Blush': 'soft pink beige background',
    'Deep Charcoal': 'dark charcoal gray background',
    'Soft Marble': 'elegant marble texture background',
  };

  const bgPrompt = backgrounds[background] || backgrounds['Warm Gray'];

  const prompts = [
    `professional headshot portrait, ${bgPrompt}, studio lighting, business professional, photorealistic, 8k quality, sharp focus`,
    `corporate headshot, ${bgPrompt}, soft studio lighting, confident expression, high quality, photorealistic`,
    `business portrait, ${bgPrompt}, professional attire, studio photography, detailed, 8k uhd`,
    `executive headshot, ${bgPrompt}, natural lighting, professional look, photorealistic, high resolution`,
    `linkedin profile photo, ${bgPrompt}, studio quality, professional, uhd, sharp focus`,
  ];

  const results = await Promise.all(
    prompts.map(async (prompt, index) => {
      try {
        const output = await replicate.run(REPLICATE_MODEL, {
          input: {
            image: imageUrl,
            prompt,
            negative_prompt: 'blurry, low quality, distorted, cartoon, anime, deformed',
            num_inference_steps: 20,
            guidance_scale: 7.5,
            strength: 0.7,
          },
        });

        console.log(`InstantID output ${index}:`, output);

        const outputValue = output as unknown;

        if (typeof outputValue === 'string' && outputValue.trim()) {
          return outputValue;
        }

        if (Array.isArray(outputValue) && outputValue.length > 0) {
          const first = outputValue[0];
          if (typeof first === 'string' && first.trim()) {
            return first;
          }

          if (first && typeof first === 'object') {
            const objectOutput = first as { url?: unknown; output?: unknown; image?: unknown; images?: unknown[] };
            if (typeof objectOutput.url === 'string' && objectOutput.url.trim()) {
              return objectOutput.url;
            }
            if (typeof objectOutput.output === 'string' && objectOutput.output.trim()) {
              return objectOutput.output;
            }
            if (typeof objectOutput.image === 'string' && objectOutput.image.trim()) {
              return objectOutput.image;
            }
            if (Array.isArray(objectOutput.images) && objectOutput.images.length > 0) {
              const firstImage = objectOutput.images[0];
              if (typeof firstImage === 'string' && firstImage.trim()) {
                return firstImage;
              }
            }
          }
        }

        if (outputValue && typeof outputValue === 'object') {
          const objectOutput = outputValue as { output?: unknown; url?: unknown; image?: unknown; images?: unknown[] };
          if (typeof objectOutput.output === 'string' && objectOutput.output.trim()) {
            return objectOutput.output;
          }
          if (typeof objectOutput.url === 'string' && objectOutput.url.trim()) {
            return objectOutput.url;
          }
          if (typeof objectOutput.image === 'string' && objectOutput.image.trim()) {
            return objectOutput.image;
          }
          if (Array.isArray(objectOutput.images) && objectOutput.images.length > 0) {
            const firstImage = objectOutput.images[0];
            if (typeof firstImage === 'string' && firstImage.trim()) {
              return firstImage;
            }
          }
        }

        return null;
      } catch (e) {
        console.error(`Generation ${index} failed:`, e);
        return null;
      }
    }),
  );

  return results.filter((url): url is string => typeof url === 'string' && Boolean(url.trim()));
}
