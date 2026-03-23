'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/app/lib/utils';

const navigation = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/nodes', label: 'Nodes' },
  { href: '/dashboard/routes', label: 'Routes' },
  { href: '/dashboard/events', label: 'Events' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation">
      <ul className="flex flex-wrap gap-2">
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'border-border/80 rounded-full border px-4 py-2 text-sm transition',
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-foreground/85 hover:bg-muted/60',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
