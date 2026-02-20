"use client";

import { usePathname } from 'next/navigation';
import { AppHeader } from './app-header';

export function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/patient')) return null;
  if (pathname === '/register') return null;
  return <AppHeader />;
}


