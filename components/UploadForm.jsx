'use client';

import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { UploadCloud } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

export default function UploadForm() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const validFiles = Array.from(selectedFiles).filter((file) => ACCEPTED_TYPES.includes(file.type));

    if (validFiles.length < 5 || validFiles.length > 10) {
      setError('Please upload between 5 and 10 images.');
      return;
    }

    setError('');
    setIsProcessing(true);
    setStatus('Compressing images');

    try {
      await Promise.all(
        validFiles.map(async (file) => {
          await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 512,
            useWebWorker: true,
            fileType: 'image/jpeg',
          });
        }),
      );

      const compressed = await Promise.all(
        validFiles.map(async (file) => {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 512,
            useWebWorker: true,
            fileType: 'image/jpeg',
          });
          return compressedFile;
        }),
      );

      setFiles(compressed);
      setStatus('Queued for generation');
      setProgress(5);
    } catch {
      setError('Compression failed for one or more files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startGeneration = async () => {
    if (!files.length) {
      setError('Please add images before submitting.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setStatus('Processing photo 1 of 10');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: await Promise.all(files.map((file) => file.arrayBuffer().then((buffer) => ({ name: file.name, data: Array.from(new Uint8Array(buffer)) })))) }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const rawLine of lines) {
          if (!rawLine.startsWith('data:')) continue;
          const payload = rawLine.replace('data: ', '').trim();
          if (!payload) continue;

          const event = JSON.parse(payload);
          if (event.type === 'progress') {
            setStatus(event.message || 'Processing image');
            const nextProgress = Math.round(((event.current || 0) / (event.total || 1)) * 100);
            setProgress(Math.max(5, Math.min(nextProgress, 100)));
          }

          if (event.type === 'complete') {
            setStatus('Generation complete');
            setProgress(100);
          }

          if (event.type === 'error') {
            setError(event.message || 'Unexpected processing error.');
          }
        }
      }
    } catch {
      setError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)] sm:p-8">
      <div className="mb-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Upload</div>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Generate profile photo sets</h2>
      </div>

      <label className="block cursor-pointer rounded-[1.25rem] border border-dashed border-[var(--border)] bg-[var(--panel-strong)] p-6 text-center transition hover:border-[var(--accent)]">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] mx-auto">
          <UploadCloud className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <div className="text-xl font-medium text-[var(--foreground)]">Choose 5–10 selfies</div>
        <div className="mt-2 text-sm text-[var(--muted)]">JPG, PNG, and HEIC files are accepted.</div>
      </label>

      {error ? <div className="mt-4 rounded-xl border border-[#d8b3ad] bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</div> : null}

      {files.length > 0 ? (
        <div className="mt-6 rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
          <div className="mb-3 flex items-center justify-between text-sm text-[var(--muted)]">
            <span>Prepared files</span>
            <span>{files.length} ready</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2 text-center text-xs text-[var(--muted)]">
                {file.name.slice(0, 16)}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
          <span>{status}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--panel-strong)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={isProcessing || files.length === 0}
          onClick={startGeneration}
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? 'Processing...' : 'Generate photos'}
        </button>
      </div>
    </div>
  );
}
