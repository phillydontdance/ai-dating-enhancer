import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    const validFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
    if (!validFiles.length) {
      return NextResponse.json({ error: 'No valid image files were provided.' }, { status: 400 });
    }

    if (validFiles.length < 3 || validFiles.length > 5) {
      return NextResponse.json({ error: 'Please upload between 3 and 5 images.' }, { status: 400 });
    }

    const uploaded = await Promise.all(
      validFiles.map((file) =>
        put(`headshots/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
          access: 'public',
          contentType: file.type || 'image/jpeg',
        }),
      ),
    );

    return NextResponse.json({ ok: true, urls: uploaded.map((entry) => entry.url) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { blobs } = await list();
    return NextResponse.json({ ok: true, blobs: blobs.map((blob) => blob.url) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Listing uploads failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
