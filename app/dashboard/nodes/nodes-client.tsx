'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type NodeRow = {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'disabled';
  lastSeenAt: Date | string | null;
  createdAt: Date | string;
};

type NodeHealth = 'active' | 'stale' | 'offline';

function getNodeHealth(lastSeenAt: Date | string | null): NodeHealth {
  if (!lastSeenAt) return 'offline';
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < 5 * 60 * 1000) return 'active';
  if (ms < 60 * 60 * 1000) return 'stale';
  return 'offline';
}

function HealthBadge({ health }: { health: NodeHealth }) {
  const styles: Record<NodeHealth, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    stale: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    offline: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        styles[health],
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', {
          'bg-emerald-400': health === 'active',
          'bg-amber-400': health === 'stale',
          'bg-zinc-400': health === 'offline',
        })}
      />
      {health}
    </span>
  );
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never';
  const ms = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  initialNodes: NodeRow[];
};

export function NodesClient({ initialNodes }: Props) {
  const [nodeList, setNodeList] = useState<NodeRow[]>(initialNodes);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<NodeRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/nodes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: nameInput, slug: slugInput || undefined }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        node?: NodeRow;
        token?: string;
      };

      if (!data.ok || !data.node) {
        setCreateError(data.error ?? 'Failed to create node');
        return;
      }

      setNodeList((prev) => [data.node!, ...prev]);
      setCreatedToken(data.token ?? null);
      setNameInput('');
      setSlugInput('');
      setShowCreateForm(false);
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete() {
    if (!nodeToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/nodes/${nodeToDelete.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { ok: boolean; error?: string };

      if (data.ok) {
        setNodeList((prev) => prev.filter((n) => n.id !== nodeToDelete.id));
        setNodeToDelete(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCopyToken() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span />
        {!showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            Add node
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
          <p className="mb-4 text-sm font-medium">New node</p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="node-name">Name</Label>
              <Input
                id="node-name"
                placeholder="My private node"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="node-slug">
                Slug <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="node-slug"
                placeholder="auto-generated from name"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
              />
            </div>
            {createError && <p className="text-destructive text-sm">{createError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createLoading}>
                {createLoading ? 'Creating…' : 'Create node'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                  setNameInput('');
                  setSlugInput('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {nodeList.length === 0 ? (
        <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
          <p className="text-muted-foreground text-sm">No nodes have been registered yet.</p>
        </div>
      ) : (
        <div className="border-border/70 bg-background/40 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/50 border-b">
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Name</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Slug</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Health</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Last seen</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {nodeList.map((node) => {
                const health = getNodeHealth(node.lastSeenAt);
                return (
                  <tr key={node.id} className="border-border/30 border-b last:border-b-0">
                    <td className="px-5 py-3 font-medium">{node.name}</td>
                    <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                      {node.slug}
                    </td>
                    <td className="px-5 py-3">
                      <HealthBadge health={health} />
                    </td>
                    <td className="text-muted-foreground px-5 py-3">
                      {formatRelativeTime(node.lastSeenAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => setNodeToDelete(node)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {createdToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="border-border/80 bg-card w-full max-w-md rounded-2xl border p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Node created</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Copy your bearer token now — it won&apos;t be shown again.
            </p>
            <div className="border-border/60 bg-background/60 mt-4 flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-2">
              <code className="flex-1 overflow-x-auto text-xs break-words">{createdToken}</code>
              <Button size="xs" variant="outline" onClick={handleCopyToken} className="shrink-0">
                {tokenCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Use this token as the{' '}
              <code className="bg-muted rounded px-1 py-0.5">Authorization: Bearer</code> header in
              your OpenClaw node configuration.
            </p>
            <Button className="mt-4 w-full" onClick={() => setCreatedToken(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="border-border/80 bg-card w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Delete node?</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              This will permanently delete{' '}
              <span className="text-foreground font-medium">{nodeToDelete.name}</span> and all its
              routes and events. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1"
              >
                {deleteLoading ? 'Deleting…' : 'Delete node'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNodeToDelete(null)}
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
