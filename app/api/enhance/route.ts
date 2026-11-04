import { NextResponse } from 'next/server';
import {
  buildEnhancementTransformation,
  configureCloudinary,
  resolveBackgroundHex,
} from '@/lib/cloudinary';

export const runtime = 'nodejs';

export function isMissingAddOnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /background_removal|background removal|add-on|addon|not enabled|not available|plan/i.test(message);
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return error ? String(error) : 'Image enhancement failed.';
  }

  const maybeCloudinaryError = error as {
    error?: unknown;
    http_code?: number;
    message?: unknown;
    [key: string]: unknown;
  };

  const nestedError =
    maybeCloudinaryError.error && typeof maybeCloudinaryError.error === 'object' ? maybeCloudinaryError.error : null;

  const nestedMessage =
    nestedError && typeof nestedError === 'object' && 'message' in nestedError ? String((nestedError as { message?: unknown }).message ?? '') : '';

  const directMessage = typeof maybeCloudinaryError.message === 'string' ? maybeCloudinaryError.message : '';
  const stringError = typeof maybeCloudinaryError.error === 'string' ? maybeCloudinaryError.error : '';

  const chosenMessage = nestedMessage || directMessage || stringError;
  if (chosenMessage.trim()) {
    if (typeof maybeCloudinaryError.http_code === 'number') {
      return `${chosenMessage} (Cloudinary HTTP ${maybeCloudinaryError.http_code})`;
    }

    return chosenMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Image enhancement failed.';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll('images')
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!files.length) {
      return NextResponse.json({ ok: false, error: 'No image files were uploaded.' }, { status: 400 });
    }

    const background = String(formData.get('background') ?? 'Warm Gray');
    const aspectRatio = String(formData.get('aspectRatio') ?? '4:5');

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Cloudinary credentials are missing. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before using /api/enhance.',
        },
        { status: 500 },
      );
    }

    const cloudinary = configureCloudinary();
    const backgroundHex = resolveBackgroundHex(background);
    const transformation = buildEnhancementTransformation(backgroundHex, aspectRatio);

    const enhancedUrls = await Promise.all(
      files.map(async (file) => {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const uploadDataUrl = `data:${file.type || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;

        const uploaded = await cloudinary.uploader.upload(uploadDataUrl, {
          folder: 'headshotly/enhanced',
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          eager: [transformation],
          eager_async: false,
          overwrite: false,
        });

        const eagerUrl = uploaded.eager?.[0]?.secure_url;
        if (eagerUrl) {
          return eagerUrl;
        }

        return cloudinary.url(uploaded.public_id, {
          secure: true,
          transformation: [transformation],
        });
      }),
    );

    return NextResponse.json({
      ok: true,
      success: true,
      images: enhancedUrls,
      count: enhancedUrls.length,
    });
  } catch (error) {
    console.error('Image enhancement failed:', error);

    const errorMessage = getErrorMessage(error);

    if (isMissingAddOnError(error)) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error:
            'Cloudinary background removal is not enabled for this account. In the Cloudinary dashboard, enable the e_background_removal add-on before using this pipeline.',
        },
        { status: 402 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
