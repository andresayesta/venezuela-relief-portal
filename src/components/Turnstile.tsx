'use client';

import { useEffect, useRef } from 'react';

// Lightweight Turnstile widget mount. Loads the Cloudflare script once
// per page, renders an invisible/managed challenge, and calls onToken
// with the verified token. The server then re-verifies with the secret.

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';

export function Turnstile({
  onToken,
  onExpire,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    function renderWidget() {
      if (!window.turnstile || !containerRef.current) return;
      // Avoid duplicate renders (StrictMode mount/unmount).
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: (token) => onToken(token),
        'expired-callback': () => onExpire?.(),
      });
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Script not loaded yet.
    window.onloadTurnstileCallback = renderWidget;
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/"]',
    );
    if (!existing) {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    return () => {
      // No reliable un-render API — leave the widget in place on unmount;
      // it'll be cleaned up with the container DOM node.
    };
  }, [siteKey, onToken, onExpire]);

  if (!siteKey) {
    // Dev convenience: surface a hint instead of silently rendering nothing.
    return (
      <p className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
        Turnstile no configurado (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
      </p>
    );
  }

  return <div ref={containerRef} className="mt-3" />;
}
