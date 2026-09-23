import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

async function hermesHtml() {
  const hermesPage = await import("@/app/hermes/page");
  return renderToStaticMarkup(hermesPage.default());
}

describe("Hermes landing page", () => {
  test("targets Hermes agent webhook relay workflows", async () => {
    const html = await hermesHtml();
    expect(html).toContain("Webhook relay for Hermes agent workflows");
    expect(html).toContain("Route GitHub, Stripe, Slack, or custom webhooks into Hermes");
    expect(html).toContain("configured with an outbound connection");
  });

  test("includes a setup snippet and relevant CTAs", async () => {
    const html = await hermesHtml();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const snippet = document.querySelector("pre code")?.textContent ?? "";
    expect(snippet).toContain("hermes plugins install ericdahl-dev/clawproxy-hermes");
    expect(snippet).toContain("CLAWPROXY_NODE_TOKEN=cpn_your_node_token");
    expect(snippet).toContain("CLAWPROXY_HERMES_WEBHOOK_SECRET=");
    expect(snippet).toContain("clawproxy.io/api/ingress/<userId>/<routeSlug>");
    expect(snippet).not.toContain("/api/ingress/hermes");
    expect(snippet).not.toContain("webhooks.relay_url");
    expect(document.querySelector("a[href=\"/dashboard\"]")?.textContent).toContain("Create a route");
    expect(document.querySelector("a[href=\"https://github.com/ericdahl-dev/clawproxy-hermes\"]")?.textContent).toContain("Hermes plugin");
  });

  test("shows the Hermes-specific delivery path", async () => {
    const html = await hermesHtml();
    expect(html).toContain("Provider webhook");
    expect(html).toContain("clawproxy route");
    expect(html).toContain("Hermes agent run");
  });
});
