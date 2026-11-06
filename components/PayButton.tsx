"use client";

import { useState } from 'react';

type PayButtonProps = {
  imageUrl: string;
  background: string;
  email: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function PayButton({
  imageUrl,
  background,
  email,
  disabled = false,
  className,
  children,
}: PayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      if (!imageUrl.trim()) {
        throw new Error('Please upload an image before paying.');
      }

      setIsLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          background,
          email,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.error || 'Failed to start Stripe checkout.');
      }

      window.location.href = data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start checkout.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled || isLoading || !imageUrl.trim()}
      className={
        className ||
        'rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {isLoading ? 'Redirecting to Stripe...' : children || 'Pay $15'}
    </button>
  );
}
