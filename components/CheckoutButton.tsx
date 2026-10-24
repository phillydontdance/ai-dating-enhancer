"use client";

import { useState } from 'react';

type CheckoutButtonProps = {
  files: File[];
  background: string;
  cvText: string;
  email: string;
  amount?: number;
  className?: string;
  children?: React.ReactNode;
};

export function CheckoutButton({
  files,
  background,
  cvText,
  email,
  amount = 1500,
  className,
  children,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);

      if (!files.length) {
        throw new Error('Please upload at least 3 images before continuing.');
      }

      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = (await uploadResponse.json()) as {
        ok?: boolean;
        urls?: string[];
        error?: string;
      };

      if (!uploadResponse.ok || !uploadData.ok || !Array.isArray(uploadData.urls) || !uploadData.urls.length) {
        throw new Error(uploadData.error || 'Image upload failed.');
      }

      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount,
          background,
          cvText,
          imageUrls: uploadData.urls,
        }),
      });

      const checkoutData = (await checkoutResponse.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!checkoutResponse.ok || !checkoutData.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || 'Checkout creation failed.');
      }

      window.location.href = checkoutData.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start checkout.';
      alert(message);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || !files.length}
      className={className || 'rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60'}
    >
      {isLoading ? 'Uploading...' : children || 'Pay Now'}
    </button>
  );
}
