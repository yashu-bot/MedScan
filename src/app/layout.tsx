import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppProviders from '@/components/layout/app-providers';
import { ConditionalHeader } from '@/components/layout/conditional-header';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MedScan360 - Emergency Medical Assistant',
  description: 'Streamlining emergency patient care with MedScan360.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${openSans.variable} font-sans antialiased`}>
        <AppProviders>
          <SidebarProvider defaultOpen={false}>
            <Sidebar variant="inset" collapsible="icon" className="hidden md:block">
              {/* Sidebar can be populated with navigation items later if needed */}
            </Sidebar>
            <div className="flex flex-col flex-1 min-h-screen">
              <ConditionalHeader />
              <SidebarInset className="flex-1">
                <main className="p-4 md:p-6 lg:p-8">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
