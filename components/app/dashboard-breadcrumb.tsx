'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routes: { prefix: string; label: string }[] = [
  { prefix: '/dashboard/events', label: 'Events' },
  { prefix: '/dashboard/routes', label: 'Routes' },
  { prefix: '/dashboard/nodes', label: 'Nodes' },
  { prefix: '/dashboard', label: 'Overview' },
];

function pageLabel(pathname: string) {
  for (const { prefix, label } of routes) {
    if (prefix === '/dashboard') {
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        return label;
      }
      continue;
    }
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return label;
    }
  }
  return 'Dashboard';
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const current = pageLabel(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
