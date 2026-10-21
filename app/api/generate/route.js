import { NextResponse } from 'next/server';
import { OPTIMIZED_PROMPTS, processImagesInParallel } from '@/lib/imageProcessor';

export async function POST(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const payload = body?.files || [];

        if (!payload || payload.length === 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No files provided.' })}\n\n`),
          );
          controller.close();
          return;
        }

        const files = payload.map((item) => {
          if (typeof item === 'string') {
            return item;
          }

          const binary = Uint8Array.from(item.data || []);
          const blob = new Blob([binary], { type: item.type || 'image/jpeg' });
          return new File([blob], item.name || 'upload.jpg', { type: item.type || 'image/jpeg' });
        });

        const sendEvent = (payloadData) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payloadData)}\n\n`),
          );
        };

        sendEvent({ type: 'started', total: files.length });

        const { results, errors } = await processImagesInParallel(files, {
          promptSet: OPTIMIZED_PROMPTS,
          onProgress: (progress) => {
            sendEvent({
              type: 'progress',
              ...progress,
            });
          },
        });

        sendEvent({
          type: 'complete',
          results,
          errors,
          successfulCount: results.length,
          failedCount: errors.length,
        });

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: error.message || 'Generation failed.' })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
