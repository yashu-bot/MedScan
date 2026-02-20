
"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PatientDataProvider } from '@/context/PatientDataContext';
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const queryClient = new QueryClient();

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider> {/* Add AuthProvider here */}
          <PatientDataProvider>
            {children}
          </PatientDataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
