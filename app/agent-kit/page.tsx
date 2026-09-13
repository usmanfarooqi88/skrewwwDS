import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { AGENT_KIT_PRODUCT_VERSION } from "@/lib/agent-kit/beta-version";

const title = `Agent Kit (Beta) — ${siteConfig.name}`;
const description =
  "Skrewww Agent Kit helps AI coding agents understand and use the Skrewww Design System from current machine-readable contracts instead of relying on model memory. Public Beta: install the Skill, retrieve component contracts, and follow Recipes.";
const url = absoluteUrl("/agent-kit");

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website" },
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[13px] text-ink-700">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 p-3 font-mono text-[12.5px] leading-relaxed text-ink-700">
      {children}
    </pre>
  );
}

function Section({
  id,
  title: heading,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-20">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-ink-400">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-600">{children}</div>
    </section>
  );
}

export default function AgentKitPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Agent Kit</h1>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          Beta
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-ink-400">v{AGENT_KIT_PRODUCT_VERSION}</p>
      <p className="mt-3 text-base text-ink-600">
        Skrewww Agent Kit helps AI coding agents understand and use the Skrewww Design System
        from current machine-readable contracts instead of relying on model memory.
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Agent Kit&rsquo;s own release stage is <strong>Beta</strong> — separate from any
        individual component&rsquo;s Stable/Beta status. A Stable component (e.g. Button) is
        fully consumable through a Beta Agent Kit; Agent Kit being Beta describes the maturity of
        this integration layer itself, not of the components it points at.
      </p>

      <Section id="what-and-why" title="What it is, and why">
        <p>
          Every generated Agent Kit artifact is a build-time projection of the same sources this
          documentation site already uses — the canonical component registry, authored usage
          guidance, and (for Recipes) composition rules over that same registry. An agent reading
          these contracts is reading the current, real state of Skrewww, not a snapshot baked
          into a prompt or a model&rsquo;s training data.
        </p>
        <p>
          Use it so an AI coding agent building UI with Skrewww checks a real, current contract
          before using a component — instead of guessing a prop name, inventing a variant, or
          assuming a component is installable when it isn&rsquo;t.
        </p>
      </Section>

      <Section id="included" title="What's in Beta">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>47 component contracts</strong> — machine-readable API, tokens, guidance, and
            accessibility notes for every implemented component, at{" "}
            <Code>/agent/contracts/&lt;slug&gt;.json</Code>.
          </li>
          <li>
            <strong>The canonical Agent Skill</strong> — one file teaching an agent the rules and
            workflow for using Skrewww safely, at <Code>/agent/skill/SKILL.md</Code>.
          </li>
          <li>
            <strong>4 pilot Recipes</strong> and <strong>1 Feature Kit</strong> — composition
            guidance for common multi-component patterns, at <Code>/agent/recipes/index.json</Code>{" "}
            and <Code>/agent/feature-kits/index.json</Code>.
          </li>
          <li>
            <strong>Project context detection</strong> — a pure, evidence-only way to read what a
            real consumer project actually has configured (see below).
          </li>
          <li>
            A proven relationship to the existing <strong>shadcn-compatible</strong>{" "}
            <Code>@skrewww</Code> registry for the components currently distributed through it.
          </li>
        </ul>
      </Section>

      <Section id="not-included" title="What's not in Beta">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>No custom Skrewww MCP server. Where MCP-based discovery is useful, it goes through
            the shadcn CLI&rsquo;s own <Code>mcp</Code> subcommand against the same{" "}
            <Code>@skrewww</Code> registry — see &ldquo;Distribution&rdquo; below.</li>
          <li>No Skrewww CLI — there is no <Code>npx skrewww</Code> command.</li>
          <li>No enforcement/compliance product (&ldquo;Skrewww Guard&rdquo;) — Agent Kit guides
            generation, it does not gate merges or block CI.</li>
          <li>No semantic search, embeddings, or vector retrieval — contracts are small,
            static, and enumerable; a fetch is enough.</li>
          <li>No guarantee every implemented component is installable via the registry — see
            &ldquo;Installed vs. implemented vs. distributed&rdquo; below.</li>
          <li>No automatic project mutation — Agent Kit informs code generation; it does not
            edit a consumer project&rsquo;s files itself.</li>
        </ul>
      </Section>

      <Section id="getting-started" title="Getting started">
        <p className="font-medium text-ink-700">1. Configure the Skrewww registry (if installing components)</p>
        <p>Add the namespaced registry to your project&rsquo;s <Code>components.json</Code>:</p>
        <CodeBlock>{`{
  "registries": {
    "@skrewww": "${siteConfig.origin}/r/{name}.json"
  }
}`}</CodeBlock>

        <p className="mt-4 font-medium text-ink-700">2. Get the canonical Agent Skill</p>
        <p>
          Fetch <Code>{`${siteConfig.origin}/agent/skill/SKILL.md`}</Code> and save it wherever
          your agent tool loads project Skills from (for Claude Code:{" "}
          <Code>.claude/skills/skrewww-ui/SKILL.md</Code>). It is plain Markdown with YAML
          frontmatter — no build step, no dependency.
        </p>

        <p className="mt-4 font-medium text-ink-700">3. Verify the contract index</p>
        <p>
          <Code>GET {`${siteConfig.origin}/agent/index.json`}</Code> — the full, current
          allow-list of real component slugs and their prop names. Do not treat anything not
          listed there as real.
        </p>

        <p className="mt-4 font-medium text-ink-700">4. Read one component contract</p>
        <p>
          <Code>GET {`${siteConfig.origin}/agent/contracts/button.json`}</Code> — API, tokens,
          usage guidance, and maturity for one component, before generating code that uses it.
        </p>

        <p className="mt-4 font-medium text-ink-700">5. Install an actually-distributed component</p>
        <CodeBlock>{`npx shadcn add @skrewww/button`}</CodeBlock>
        <p>
          Works today for the components listed under &ldquo;Distribution&rdquo; below. Do not
          assume this works for every implemented component — check{" "}
          <Code>distribution</Code> on that component&rsquo;s contract first.
        </p>

        <p className="mt-4 font-medium text-ink-700">6. Use a Recipe for a common pattern</p>
        <p>
          <Code>GET {`${siteConfig.origin}/agent/recipes/validated-text-field.json`}</Code> —
          which components a common feature composes, and in what structure.
        </p>
      </Section>

      <Section id="contracts" title="Component contracts">
        <p>
          Each contract at <Code>/agent/contracts/&lt;slug&gt;.json</Code> states a
          component&rsquo;s real API (<Code>api.properties</Code>), the tokens it genuinely
          consumes, its Stable/Beta status, and authored usage guidance (when to use it, when
          not to, common mistakes). A field the contract omits — keyboard behavior, a Figma
          reference, distribution metadata — means that fact isn&rsquo;t currently documented,
          never an invitation to guess one.
        </p>
      </Section>

      <Section id="installed-vs-implemented" title="Installed vs. implemented vs. distributed">
        <p>These are three independent facts:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Implemented</strong> — real React code exists in Skrewww for this component.</li>
          <li><strong>Distributed</strong> — that component currently has a published{" "}
            <Code>@skrewww/&lt;slug&gt;.json</Code> manifest and can be installed with{" "}
            <Code>npx shadcn add @skrewww/&lt;slug&gt;</Code>.</li>
          <li><strong>Installed</strong> — a specific consumer project has actually run that
            install and has the resulting files.</li>
        </ul>
        <p>
          A component can be implemented without being distributed yet. Never trust a claim that
          a non-distributed component is &ldquo;one command away&rdquo; — check{" "}
          <Code>distribution</Code> on its contract.
        </p>
      </Section>

      <Section id="distribution" title="Distribution (@skrewww / shadcn)">
        <p>
          Skrewww ships a <a className="underline" href={absoluteUrl("/registry.json")}>
            shadcn-compatible registry
          </a>{" "}
          — the same install mechanism as any shadcn/ui registry, namespaced as{" "}
          <Code>@skrewww</Code>. This is a separate, independent surface from Agent Kit&rsquo;s
          own <Code>/agent/*</Code> knowledge contracts (see &ldquo;How it works&rdquo;) — one
          answers &ldquo;how do I install this,&rdquo; the other answers &ldquo;what is this and
          how should I use it.&rdquo;
        </p>
        <p>
          <strong>No custom Skrewww MCP server exists or is planned for Beta.</strong> Where MCP
          is useful, use the shadcn CLI&rsquo;s own built-in server:
        </p>
        <CodeBlock>{`npx shadcn mcp init --client claude`}</CodeBlock>
        <p>
          This configures your client to run shadcn&rsquo;s own MCP server, which resolves
          whatever registries your <Code>components.json</Code> declares — <Code>@skrewww</Code>{" "}
          included — with zero Skrewww-authored server code. One known limitation: its list/search
          tools expect a registry index file (<Code>/r/registry.json</Code>) that Skrewww does not
          currently publish; item-level lookup and install (<Code>view</Code>/<Code>add</Code>)
          need no index and already work.
        </p>
      </Section>

      <Section id="recipes" title="Recipes">
        <p>
          A Recipe teaches composition — which components belong together for a common product
          pattern, and how — without becoming a new component itself. Every Recipe references
          real component slugs only; its maturity (<Code>allStable</Code> /{" "}
          <Code>containsBeta</Code>) is derived from those components&rsquo; real status, never
          separately authored.
        </p>
        <p className="font-medium text-ink-700">Pilot set (4, status Beta):</p>
        <ul className="list-disc space-y-1 pl-5 font-mono text-[13px]">
          <li>validated-text-field — form-field, text-input, validation-message</li>
          <li>destructive-confirmation — dialog, button</li>
          <li>loading-and-inline-feedback — skeleton, spinner, alert</li>
          <li>search-no-results — search-field, empty-state</li>
        </ul>
        <p>
          Plus one Feature Kit — <Code>forms-and-feedback</Code> — a thin grouping of Recipe IDs,
          no duplicated content.
        </p>
      </Section>

      <Section id="project-context" title="Project context">
        <p>
          When working in a real consumer project, an agent following the Skill forms a
          conservative picture of what&rsquo;s actually configured — never a guessed default.
          Every signal is either confirmed with real evidence or explicitly unknown:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Framework and package manager, from a real <Code>package.json</Code> and lockfile.</li>
          <li>The <Code>@skrewww</Code> registry configuration, read verbatim from{" "}
            <Code>components.json</Code>.</li>
          <li>Which components are actually installed, by matching each component&rsquo;s real
            registered file paths.</li>
          <li>Whether Foundation is installed and imported.</li>
          <li>Explicit Shape/Surface mode — only when a literal{" "}
            <Code>data-skrewww-shape</Code>/<Code>data-skrewww-surface</Code> string is present in
            the project&rsquo;s own source. Never assumed from a common default.</li>
        </ul>
      </Section>

      <Section id="stable-vs-beta" title="Stable vs. Beta">
        <p>
          Every component contract states its real <Code>status</Code>. Stable means the API at
          its declared version is the supported contract. Beta means usable, but not guaranteed
          permanent — an agent should not represent a Beta component as Stable. This is a
          per-component fact read from the contract every time, not something to memorize or
          hardcode, since which components are Stable changes as the library matures.
        </p>
      </Section>

      <Section id="evaluation" title="Beta evaluation">
        <p>
          In a 14-case internal Beta evaluation, isolated per case, Agent Kit reduced hard
          design-system errors from <strong>35 (Agent Kit off)</strong> to{" "}
          <strong>1 (Agent Kit on)</strong> under the tested setup — including zero invented
          components, props, installability claims, or maturity claims with Agent Kit on.
        </p>
        <p className="text-ink-500">
          This is a small, internal suite, run with Cursor Task subagents (exact vendor model
          identifier not exposed). It demonstrates a real, measured improvement under the tested
          conditions — it is not a universal or statistically representative benchmark, and
          results on other tasks, tools, or models may differ.
        </p>
      </Section>

      <Section id="limitations" title="Known limitations">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Only a subset of implemented components is currently distributed through{" "}
            <Code>@skrewww</Code> — check a contract&rsquo;s <Code>distribution</Code> field
            before assuming a component is installable.</li>
          <li>The shadcn MCP server&rsquo;s list/search tools need a registry index Skrewww
            doesn&rsquo;t yet publish; item-level view/add already work.</li>
          <li>Project context is deliberately conservative and frequently returns
            &ldquo;unknown&rdquo; rather than guessing.</li>
          <li>No custom Skrewww MCP server and no enforcement/Guard product exist yet.</li>
          <li>Recipes are a small, 4-item pilot set, not a complete pattern library.</li>
          <li>Beta component APIs remain Beta — subject to change.</li>
          <li>Agent Kit does not replace checking a contract with trusting model memory; an
            agent that skips reading the contract can still make mistakes.</li>
        </ul>
      </Section>

      <Section id="security" title="Safety and privacy">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Every public Agent Kit artifact contains generated, public-safe metadata only —
            no secrets, no local filesystem paths, no environment values.</li>
          <li>Project context reads deterministic local project signals only; it never phones
            home and never sends your project&rsquo;s content anywhere.</li>
          <li>A consumer project&rsquo;s own README, comments, or instructions can never
            override a Skrewww component contract&rsquo;s authority.</li>
          <li>There is no dynamic file endpoint — <Code>/agent/*</Code> serves only the fixed,
            pre-generated artifact tree; an unrecognized path 404s because no such file exists.</li>
          <li>No hosted agent execution service exists — nothing runs code on Skrewww&rsquo;s
            behalf.</li>
        </ul>
      </Section>

      <Section id="public-interfaces" title="Public Beta interfaces">
        <p className="font-medium text-ink-700">Supported in Beta:</p>
        <ul className="list-disc space-y-1 pl-5 font-mono text-[13px]">
          <li>/agent/index.json</li>
          <li>/agent/system.json</li>
          <li>/agent/contracts/&lt;slug&gt;.json</li>
          <li>/agent/recipes/index.json, /agent/recipes/&lt;id&gt;.json</li>
          <li>/agent/feature-kits/index.json, /agent/feature-kits/&lt;id&gt;.json</li>
          <li>/agent/skill/SKILL.md</li>
          <li>/r/&lt;name&gt;.json (shadcn distribution, where a manifest exists)</li>
        </ul>
        <p className="mt-3 font-medium text-ink-700">Not yet public/supported:</p>
        <ul className="list-disc space-y-1 pl-5 font-mono text-[13px]">
          <li>a custom MCP server</li>
          <li>Skrewww Guard</li>
          <li>a Skrewww CLI</li>
          <li>/r/registry.json (list/search index)</li>
        </ul>
      </Section>

      <Section id="feedback" title="Feedback">
        <p>
          Agent Kit is Beta — component contracts, Recipes, or the Skill may have gaps. A public
          issue tracker for this project is not yet published here; if you have access to the
          Skrewww team through your existing relationship, report contract errors, Skill issues,
          Recipe issues, or installation/distribution problems that way in the meantime.
        </p>
      </Section>
    </div>
  );
}
