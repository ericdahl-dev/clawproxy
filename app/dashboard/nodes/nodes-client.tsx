'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import posthog from 'posthog-js';

import { formatRelativeTime } from '@/app/lib/dashboard/datetime';
import {
  buildOpenClawSetupBlock,
  getNodeHealth,
  type NodeHealth,
} from '@/app/lib/dashboard/node-connect';
import { adminJson } from '@/app/lib/dashboard/admin-fetch';
import type { NodeRow } from '@/app/lib/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/app/lib/utils';

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

function WsBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        connected
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      )}
    >
      <span className={cn('size-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-zinc-400')} />
      {connected ? 'connected' : 'disconnected'}
    </span>
  );
}

type Props = {
  initialNodes: NodeRow[];
};

const modalBackdropClass =
  'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center';
const modalPanelClass =
  'border-border/80 bg-card w-full rounded-2xl border p-6 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto';

function Modal({
  children,
  maxWidthClass,
  onClose,
}: {
  children: React.ReactNode;
  maxWidthClass: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className={modalBackdropClass}
      data-testid="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`${modalPanelClass} ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

type ConnectGuideProps = {
  origin: string;
  token?: string;
  initialForwardBaseUrl?: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onClose: () => void;
};

function ConnectGuide({
  origin,
  token,
  initialForwardBaseUrl,
  copiedField,
  onCopy,
  onClose,
}: ConnectGuideProps) {
  const [forwardBaseUrl, setForwardBaseUrl] = useState(initialForwardBaseUrl ?? '');
  const wsOrigin = origin.replace(/^http/, 'ws');
  const wsUrl = `${wsOrigin}/api/nodes/ws`;
  const pullUrl = `${origin}/api/nodes/pull`;
  const ackUrl = `${origin}/api/nodes/ack`;
  const setupBlock = buildOpenClawSetupBlock(origin, token, forwardBaseUrl || undefined);

  return (
    <>
      <h3 className="text-lg font-semibold">Connect your OpenClaw node</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Install this skill on your OpenClaw node. The skill will connect to clawproxy via WebSocket
        for real-time event delivery, falling back to HTTP polling when needed.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-medium">
            WebSocket endpoint{' '}
            <span className="text-emerald-400 font-normal">— recommended (live push)</span>
          </p>
          <div className="border-border/60 bg-background/60 flex items-center gap-2 rounded-lg border px-3 py-2">
            <code className="flex-1 overflow-x-auto text-xs">{wsUrl}</code>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onCopy(wsUrl, 'ws')}
              className="shrink-0"
            >
              {copiedField === 'ws' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Events are pushed to the node the moment they arrive. Authenticate after connecting by
            sending{' '}
            <code className="bg-muted rounded px-1 py-0.5">
              {'{'}
              &quot;type&quot;:&quot;auth&quot;,&quot;token&quot;:&quot;cpn_…&quot;
              {'}'}
            </code>
            .
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium">
            Pull endpoint{' '}
            <span className="text-muted-foreground font-normal">— HTTP polling fallback</span>
          </p>
          <div className="border-border/60 bg-background/60 flex items-center gap-2 rounded-lg border px-3 py-2">
            <code className="flex-1 overflow-x-auto text-xs">{pullUrl}</code>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onCopy(pullUrl, 'pull')}
              className="shrink-0"
            >
              {copiedField === 'pull' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium">Acknowledge endpoint</p>
          <div className="border-border/60 bg-background/60 flex items-center gap-2 rounded-lg border px-3 py-2">
            <code className="flex-1 overflow-x-auto text-xs">{ackUrl}</code>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onCopy(ackUrl, 'ack')}
              className="shrink-0"
            >
              {copiedField === 'ack' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="openclaw-url" className="mb-1.5 text-xs font-medium">
            OpenClaw base URL{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="openclaw-url"
            className="mt-1.5 font-mono text-xs"
            placeholder="http://127.0.0.1:18789"
            value={forwardBaseUrl}
            onChange={(e) => setForwardBaseUrl(e.target.value)}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            The base URL of your OpenClaw instance. Used to fill in the{' '}
            <code className="bg-muted rounded px-1 py-0.5">forward.webhook_url</code> in the skill
            configuration below.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium">One-paste OpenClaw setup block</p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onCopy(setupBlock, 'setup')}
            >
              {copiedField === 'setup' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <pre className="border-border/60 bg-background/60 overflow-x-auto rounded-lg border p-3 text-xs leading-relaxed">
            {setupBlock}
          </pre>
          {!token && (
            <p className="text-muted-foreground mt-1.5 text-xs">
              Replace <code className="bg-muted rounded px-1 py-0.5">YOUR_NODE_TOKEN_HERE</code>{' '}
              with the bearer token shown when you created the node.
            </p>
          )}
        </div>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        The skill connects via WebSocket and receives events in real-time. Alternatively, it polls
        the pull endpoint with{' '}
        <code className="bg-muted rounded px-1 py-0.5">Authorization: Bearer &lt;token&gt;</code>.
        Each event&apos;s original headers and body are forwarded to your OpenClaw webhook system
        using the <code className="bg-muted rounded px-1 py-0.5">forward.webhook_url</code>{' '}
        (replacing <code className="bg-muted rounded px-1 py-0.5">{'{routeSlug}'}</code> with the
        event&apos;s route slug), then delivery is acknowledged via the ack endpoint.
      </p>

      <Button className="mt-4 w-full" onClick={onClose}>
        Done
      </Button>
    </>
  );
}

export function NodesClient({ initialNodes }: Props) {
  const DEFAULT_OPENCLAW_BASE_URL = 'http://127.0.0.1:18789';
  const OPENCLAW_URL_STORAGE_KEY = 'nodes.openclawBaseUrl';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [nodeList, setNodeList] = useState<NodeRow[]>(initialNodes);
  const [openClawBaseUrl, setOpenClawBaseUrl] = useState(DEFAULT_OPENCLAW_BASE_URL);
  const [openClawInput, setOpenClawInput] = useState(DEFAULT_OPENCLAW_BASE_URL);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [tokenModalStep, setTokenModalStep] = useState<1 | 2>(1);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [connectNode, setConnectNode] = useState<NodeRow | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<NodeRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [nodeToRegenerate, setNodeToRegenerate] = useState<NodeRow | null>(null);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [regeneratedToken, setRegeneratedToken] = useState<string | null>(null);
  const [regeneratedTokenCopied, setRegeneratedTokenCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const result = await adminJson<
        { ok: true; node: Omit<NodeRow, 'wsConnected'>; token?: string }
      >('/api/admin/nodes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: nameInput, slug: slugInput || undefined }),
      });

      if (!result.ok) {
        setCreateError(
          result.error === 'Failed to fetch'
            ? 'Could not reach the server. Check your connection and that the app is running.'
            : result.error,
        );
        return;
      }

      const { node, token } = result.data;
      if (!node) {
        setCreateError('Failed to create node.');
        return;
      }

      setNodeList((prev) => [{ ...node, wsConnected: false }, ...prev]);
      posthog.capture('node_created', { node_name: node.name, node_slug: node.slug });
      setCreatedToken(token ?? null);
      setTokenModalStep(1);
      setNameInput('');
      setSlugInput('');
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
    if (!nodeToDelete) return;
    setDeleteLoading(true);

    try {
      const result = await adminJson<{ ok: true }>(`/api/admin/nodes/${nodeToDelete.id}`, {
        method: 'DELETE',
      });

      if (result.ok) {
        posthog.capture('node_deleted', { node_id: nodeToDelete.id, node_name: nodeToDelete.name });
        setNodeList((prev) => prev.filter((n) => n.id !== nodeToDelete.id));
        setNodeToDelete(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleRegenerateToken() {
    if (!nodeToRegenerate) return;
    setRegenerateLoading(true);

    try {
      const result = await adminJson<{ ok: true; token: string }>(
        `/api/admin/nodes/${nodeToRegenerate.id}/regenerate-token`,
        { method: 'POST' },
      );

      if (result.ok && result.data.token) {
        posthog.capture('node_token_regenerated', { node_id: nodeToRegenerate.id, node_name: nodeToRegenerate.name });
        setNodeToRegenerate(null);
        setRegeneratedToken(result.data.token);
        setRegeneratedTokenCopied(false);
      }
    } finally {
      setRegenerateLoading(false);
    }
  }

  async function handleCopyRegeneratedToken() {
    if (!regeneratedToken) return;
    await navigator.clipboard.writeText(regeneratedToken);
    setRegeneratedTokenCopied(true);
    setTimeout(() => setRegeneratedTokenCopied(false), 2000);
  }

  async function handleCopyToken() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  }

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  useEffect(() => {
    const savedUrl = window.localStorage.getItem(OPENCLAW_URL_STORAGE_KEY);
    if (!savedUrl) {
      return;
    }
    setOpenClawBaseUrl(savedUrl);
    setOpenClawInput(savedUrl);
  }, [OPENCLAW_URL_STORAGE_KEY]);

  function handleSaveOpenClawBaseUrl() {
    const normalized = openClawInput.trim();
    window.localStorage.setItem(OPENCLAW_URL_STORAGE_KEY, normalized);
    setOpenClawBaseUrl(normalized);
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

      <Card size="sm" className="border-border/70 bg-background/40 ring-0">
        <CardHeader>
          <CardTitle>Connect your OpenClaw instance</CardTitle>
          <CardDescription>
            Save your OpenClaw base URL once and reuse it in node connect instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="openclaw-base-url">OpenClaw base URL</Label>
              <Input
                id="openclaw-base-url"
                placeholder="http://127.0.0.1:18789"
                value={openClawInput}
                onChange={(e) => setOpenClawInput(e.target.value)}
              />
            </div>
            <Button size="sm" type="button" onClick={handleSaveOpenClawBaseUrl}>
              Save URL
            </Button>
          </div>
          {openClawBaseUrl && (
            <p className="text-muted-foreground mt-2 text-xs">Saved: {openClawBaseUrl}</p>
          )}
        </CardContent>
      </Card>

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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/50 border-b">
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Name</th>
                <th className="text-muted-foreground hidden px-5 py-3 text-left font-medium sm:table-cell">Slug</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Health</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">WS</th>
                <th className="text-muted-foreground hidden px-5 py-3 text-left font-medium sm:table-cell">Last seen</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {nodeList.map((node) => {
                const health = getNodeHealth(node.lastSeenAt);
                return (
                  <tr key={node.id} className="border-border/30 border-b last:border-b-0">
                    <td className="px-5 py-3 font-medium">{node.name}</td>
                    <td className="text-muted-foreground hidden px-5 py-3 font-mono text-xs sm:table-cell">
                      {node.slug}
                    </td>
                    <td className="px-5 py-3">
                      <HealthBadge health={health} />
                    </td>
                    <td className="px-5 py-3">
                      <WsBadge connected={node.wsConnected} />
                    </td>
                    <td className="text-muted-foreground hidden px-5 py-3 sm:table-cell">
                      {formatRelativeTime(node.lastSeenAt, { absentLabel: 'Never' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setConnectNode(node)}
                        >
                          Connect
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setNodeToRegenerate(node)}
                        >
                          Regen token
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => setNodeToDelete(node)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {createdToken && (
        <Modal maxWidthClass="max-w-lg" onClose={() => setCreatedToken(null)}>
            {tokenModalStep === 1 ? (
              <>
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
                  <code className="bg-muted rounded px-1 py-0.5">Authorization: Bearer</code> header
                  when your OpenClaw node connects to clawproxy.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => setTokenModalStep(2)}>
                    Next: connect your node →
                  </Button>
                  <Button variant="outline" onClick={() => setCreatedToken(null)}>
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <ConnectGuide
                origin={origin}
                token={createdToken}
                initialForwardBaseUrl={openClawBaseUrl}
                copiedField={copiedField}
                onCopy={handleCopy}
                onClose={() => setCreatedToken(null)}
              />
            )}
        </Modal>
      )}

      {connectNode && (
        <Modal maxWidthClass="max-w-lg" onClose={() => setConnectNode(null)}>
          <ConnectGuide
            origin={origin}
            initialForwardBaseUrl={openClawBaseUrl}
            copiedField={copiedField}
            onCopy={handleCopy}
            onClose={() => setConnectNode(null)}
          />
        </Modal>
      )}

      {nodeToDelete && (
        <Modal maxWidthClass="max-w-sm" onClose={() => setNodeToDelete(null)}>
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
        </Modal>
      )}

      {nodeToRegenerate && (
        <Modal maxWidthClass="max-w-sm" onClose={() => setNodeToRegenerate(null)}>
            <h3 className="text-lg font-semibold">Regenerate token?</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              This will invalidate the current token for{' '}
              <span className="text-foreground font-medium">{nodeToRegenerate.name}</span>. The node
              will not be able to connect until it is updated with the new token.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                size="sm"
                disabled={regenerateLoading}
                onClick={handleRegenerateToken}
                className="flex-1"
              >
                {regenerateLoading ? 'Regenerating…' : 'Regenerate token'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNodeToRegenerate(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
        </Modal>
      )}

      {regeneratedToken && (
        <Modal maxWidthClass="max-w-lg" onClose={() => setRegeneratedToken(null)}>
            <h3 className="text-lg font-semibold">New token generated</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Copy your new bearer token now — it won&apos;t be shown again.
            </p>
            <div className="border-border/60 bg-background/60 mt-4 flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-2">
              <code className="flex-1 min-w-0 text-xs break-all">{regeneratedToken}</code>
              <Button
                size="xs"
                variant="outline"
                onClick={handleCopyRegeneratedToken}
                className="shrink-0"
              >
                {regeneratedTokenCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Update your OpenClaw node configuration with this new token.
            </p>
            <Button className="mt-4 w-full" onClick={() => setRegeneratedToken(null)}>
              Done
            </Button>
        </Modal>
      )}
    </>
  );
}
