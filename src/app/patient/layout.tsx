"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Back' },
    { href: '/patient/dashboard', label: 'Home' },
    { href: '/patient/ai', label: 'MedScan AI' },
    { href: '/patient/orders', label: 'Orders' },
    { href: '/patient/appointments', label: 'Appointments' },
    { href: '/patient/profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background">
        <div className="container mx-auto h-12 flex items-center gap-4">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm px-3 py-1 rounded-md hover:text-primary hover:bg-primary/10',
                pathname === item.href ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}


