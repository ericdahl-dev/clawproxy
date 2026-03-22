'use client';

import { useEffect } from 'react';

export function useRedirect127ToLocalhost() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (window.location.hostname !== '127.0.0.1') {
      return;
    }

    const redirectedUrl = new URL(window.location.href);
    redirectedUrl.hostname = 'localhost';
    window.location.replace(redirectedUrl.toString());
  }, []);
}
