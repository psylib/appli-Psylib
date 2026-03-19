'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function RefParamHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('psylib_ref', ref.toUpperCase());
    }
  }, [searchParams]);

  return null;
}
