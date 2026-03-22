'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type RouteRow = {
  id: string;
  nodeId: string;
  nodeName: string | null;
  slug: string;
  enabled: boolean;
  createdAt: Date | string;
};

type NodeOption = {
  id: string;
  name: string;
};

type Props = {
  initialRoutes: RouteRow[];
  availableNodes: NodeOption[];
};

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        enabled
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
          : 'border-zinc-500/30 bg-zinc-500/15 text-zinc-400',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', {
          'bg-emerald-400': enabled,
          'bg-zinc-400': !enabled,
        })}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  );
}

export function RoutesClient({ initialRoutes, availableNodes }: Props) {
  const [routeList, setRouteList] = useState<RouteRow[]>(initialRoutes);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [nodeIdInput, setNodeIdInput] = useState(availableNodes[0]?.id ?? '');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<RouteRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedRouteId, setCopiedRouteId] = useState<string | null>(null);
  const [togglingRouteId, setTogglingRouteId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ nodeId: nodeIdInput, slug: slugInput }),
      });

      const text = await res.text();
      let data: { ok: boolean; error?: string; route?: RouteRow };
      try {
        data = text ? (JSON.parse(text) as typeof data) : { ok: false };
      } catch {
        setCreateError(
          text.trimStart().startsWith('<')
            ? `Got an HTML page instead of JSON (${res.status}). Try refreshing.`
            : `Invalid response from server (${res.status}).`,
        );
        return;
      }

      if (!data.ok || !data.route) {
        setCreateError(data.error ?? `Failed to create route (${res.status})`);
        return;
      }

      const node = availableNodes.find((n) => n.id === nodeIdInput);
      const newRoute: RouteRow = { ...data.route, nodeName: node?.name ?? null };
      setRouteList((prev) => [newRoute, ...prev]);
      setSlugInput('');
      setNodeIdInput(availableNodes[0]?.id ?? '');
      setShowCreateForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setCreateError(
        message === 'Failed to fetch'
          ? 'Could not reach the server. Check your connection and that the app is running.'
          : `Request failed: ${message}`,
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete() {
    if (!routeToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/routes/${routeToDelete.id}`, { method: 'DELETE' });

      let data: { ok: boolean; error?: string } | null = null;
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          data = (await res.json()) as { ok: boolean; error?: string };
        } catch {
          // ignore JSON parse errors; fall back to a generic error message
        }
      }

      if (!res.ok || !data?.ok) {
        setDeleteError(
          data?.error ?? `Failed to delete route (status ${res.status}). Please try again.`,
        );
        return;
      }

      setRouteList((prev) => prev.filter((r) => r.id !== routeToDelete.id));
      setRouteToDelete(null);
    } catch {
      setDeleteError('Failed to delete route due to a network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleEnabled(route: RouteRow) {
    setTogglingRouteId(route.id);
    setToggleError(null);

    try {
      const res = await fetch(`/api/admin/routes/${route.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ enabled: !route.enabled }),
      });

      let data: { ok: boolean; route?: { enabled: boolean }; error?: string } | null = null;
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          data = (await res.json()) as typeof data;
        } catch {
          // ignore JSON parse errors; fall back to error state
        }
      }

      if (!res.ok || !data?.ok) {
        setToggleError(
          data?.error ?? `Failed to update route (status ${res.status}). Please try again.`,
        );
        return;
      }

      if (data.route) {
        setRouteList((prev) =>
          prev.map((r) => (r.id === route.id ? { ...r, enabled: data!.route!.enabled } : r)),
        );
      }
    } catch {
      setToggleError('Failed to update route due to a network error. Please try again.');
    } finally {
      setTogglingRouteId(null);
    }
  }

  async function handleCopyUrl(slug: string, routeId: string) {
    const url = `${window.location.origin}/api/ingress/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedRouteId(routeId);
    setTimeout(() => setCopiedRouteId(null), 2000);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span />
        {!showCreateForm && (
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            disabled={availableNodes.length === 0}
          >
            Add route
          </Button>
        )}
      </div>

      {availableNodes.length === 0 && !showCreateForm && (
        <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
          <p className="text-muted-foreground text-sm">
            No nodes available. Register a node first before creating routes.
          </p>
        </div>
      )}

      {showCreateForm && (
        <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
          <p className="mb-4 text-sm font-medium">New route</p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="route-slug">Slug</Label>
              <Input
                id="route-slug"
                placeholder="my-webhook"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="route-node">Node</Label>
              <select
                id="route-node"
                value={nodeIdInput}
                onChange={(e) => setNodeIdInput(e.target.value)}
                required
                className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                {availableNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
            {createError && <p className="text-destructive text-sm">{createError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createLoading}>
                {createLoading ? 'Creating…' : 'Create route'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                  setSlugInput('');
                  setNodeIdInput(availableNodes[0]?.id ?? '');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {routeList.length === 0 ? (
        availableNodes.length > 0 && (
          <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
            <p className="text-muted-foreground text-sm">No routes have been configured yet.</p>
          </div>
        )
      ) : (
        <div className="border-border/70 bg-background/40 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/50 border-b">
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Slug</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Node</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Status</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">
                  Public URL
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {routeList.map((route) => (
                <tr key={route.id} className="border-border/30 border-b last:border-b-0">
                  <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                    {route.slug}
                  </td>
                  <td className="px-5 py-3 font-medium">{route.nodeName ?? '—'}</td>
                  <td className="px-5 py-3">
                    <EnabledBadge enabled={route.enabled} />
                  </td>
                  <td className="px-5 py-3">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleCopyUrl(route.slug, route.id)}
                    >
                      {copiedRouteId === route.id ? 'Copied!' : 'Copy URL'}
                    </Button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={togglingRouteId === route.id}
                        onClick={() => handleToggleEnabled(route)}
                      >
                        {route.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => { setRouteToDelete(route); setDeleteError(null); }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toggleError && (
        <p className="text-destructive text-sm">{toggleError}</p>
      )}

      {routeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="border-border/80 bg-card w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Delete route?</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              This will permanently delete the route{' '}
              <span className="text-foreground font-mono font-medium">{routeToDelete.slug}</span>{' '}
              and all its events. This action cannot be undone.
            </p>
            {deleteError && <p className="text-destructive mt-3 text-sm">{deleteError}</p>}
            <div className="mt-5 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1"
              >
                {deleteLoading ? 'Deleting…' : 'Delete route'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRouteToDelete(null); setDeleteError(null); }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
