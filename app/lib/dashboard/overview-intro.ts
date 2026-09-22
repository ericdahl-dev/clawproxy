export type OverviewIntro = {
  title: string;
  description: string;
  isFirstRun: boolean;
  showMetrics: boolean;
  cta: { href: string; label: string } | null;
};

/**
 * What the dashboard home should say. A new account has no nodes, so greeting it with
 * "Welcome back" above eight zeroed metrics tells it nothing; point it at the first step instead.
 */
export function overviewIntro(nodeCount: number): OverviewIntro {
  if (nodeCount === 0) {
    return {
      title: 'Set up your first node',
      description:
        'A node is the agent that receives your webhooks. Create one, connect it, then point a provider at the route URL clawproxy gives you.',
      isFirstRun: true,
      showMetrics: false,
      cta: { href: '/dashboard/nodes', label: 'Create your first node' },
    };
  }

  return {
    title: 'Welcome back',
    description:
      'Manage the nodes, routes and events behind your public ingress and private agent delivery.',
    isFirstRun: false,
    showMetrics: true,
    cta: null,
  };
}
