import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export const REPLICATE_MODEL = 'black-forest-labs/flux-pro';

export async function generateHeadshots(imageUrl: string, background: string): Promise<string[]> {
  const backgrounds: Record<string, string> = {
    'Warm Gray': 'warm gray studio backdrop, professional photography',
    'Studio White': 'pure white seamless background, clean studio look',
    'Muted Blush': 'soft beige pink backdrop, elegant professional',
    'Deep Charcoal': 'dark gray charcoal backdrop, dramatic corporate',
    'Soft Marble': 'light marble texture backdrop, luxury executive',
  };

  const bgPrompt = backgrounds[background] || backgrounds['Warm Gray'];

  const prompts = [
    `professional corporate headshot portrait, ${bgPrompt}, studio lighting, sharp focus, 8k resolution, photorealistic, business professional attire, confident expression, linkedin profile photo, corporate photography, highly detailed`,
    `executive portrait, ${bgPrompt}, soft studio lighting, professional look, photorealistic, 8k uhd, corporate headshot, business attire, sharp focus, high quality photography`,
    `business headshot, ${bgPrompt}, professional studio photography, natural lighting, photorealistic, corporate style, 8k, detailed texture, professional attire, confident posture`,
    `corporate profile photo, ${bgPrompt}, studio quality, professional lighting, photorealistic, business professional, high resolution, sharp focus, executive style`,
    `professional linkedin photo, ${bgPrompt}, corporate headshot, studio lighting, photorealistic, 8k quality, business attire, professional expression, high detail`,
  ];

  const results = await Promise.all(
    prompts.map(async (prompt, index) => {
      try {
        console.log(`Generating with FLUX Pro: ${prompt.substring(0, 50)}...`);

        const output = await replicate.run(REPLICATE_MODEL, {
          input: {
            image: imageUrl,
            prompt,
            guidance: 3.5,
            steps: 25,
            strength: 0.75,
            aspect_ratio: '1:1',
          },
        });

        console.log(`FLUX output ${index}:`, output);

        if (Array.isArray(output) && output.length > 0) {
          return typeof output[0] === 'string' ? output[0] : output[0]?.url ?? null;
        }

        if (output && typeof output === 'object') {
          const objectOutput = output as { url?: unknown; output?: unknown };
          return objectOutput.url || objectOutput.output || null;
        }

        return typeof output === 'string' ? output : null;
      } catch (e) {
        console.error(`FLUX generation ${index} failed:`, e);
        return null;
      }
    }),
  );

  const validResults = results.filter((url): url is string => typeof url === 'string' && Boolean(url.trim()));
  console.log(`Generated ${validResults.length}/5 headshots successfully`);

  return validResults;
}
