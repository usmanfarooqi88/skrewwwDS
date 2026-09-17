import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";

const title = `Guard (Beta) — ${siteConfig.name}`;
const description =
  "Skrewww Guard is an offline local CLI that validates selected Skrewww canonical-contract claims. Public Beta: three consumer rules, provenance-aware checks, zero-config.";
const url = absoluteUrl("/guard");

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

export default function GuardPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Guard</h1>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          Beta
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-ink-400">v{GUARD_TOOL_VERSION}</p>
      <p className="mt-3 text-base text-ink-600">
        Skrewww Guard is an offline, local CLI that validates selected Skrewww{" "}
        <strong>canonical-contract</strong> claims — deterministically, without uploading
        source, calling an LLM, or connecting to Figma.
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Guard&rsquo;s own release stage is <strong>Beta</strong>. It does not replace TypeScript,
        accessibility review, Figma parity checks, or visual QA.
      </p>

      <Section id="install" title="Install">
        <p>Prefer the <Code>beta</Code> dist-tag until a stable release:</p>
        <CodeBlock>{`npm install --save-dev @skrewww/guard@beta`}</CodeBlock>
        <p className="mt-3 font-medium text-ink-700">Run</p>
        <CodeBlock>{`npx skrewww-guard .
npx skrewww-guard path/to/file.tsx
npx skrewww-guard path --claims claims.json`}</CodeBlock>
        <p>
          Or use the local binary after install: <Code>skrewww-guard</Code>. Zero-config happy
          path — no <Code>.guardrc</Code>, no severity overrides, no suppressions. Claims JSON is
          input data, not Guard configuration.
        </p>
        <p>
          Package:{" "}
          <a
            href="https://www.npmjs.com/package/@skrewww/guard"
            className="font-medium text-brand-600 underline underline-offset-2"
          >
            @skrewww/guard on npm
          </a>
          . Source and release notes:{" "}
          <a
            href="https://github.com/usmanfarooqi88/skrewwwDS/releases/tag/guard-v0.1.0-beta.1"
            className="font-medium text-brand-600 underline underline-offset-2"
          >
            GitHub Release guard-v0.1.0-beta.1
          </a>
          . Changelog entry:{" "}
          <Link href="/changelog" className="font-medium text-brand-600 underline underline-offset-2">
            /changelog
          </Link>
          .
        </p>
      </Section>

      <Section id="public-rules" title="Public consumer rules (exactly 3)">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Code>component/nonexistent-slug</Code> — ERROR when a Skrewww-origin claim names a
            component slug that is not in the packaged consumer facts.
          </li>
          <li>
            <Code>maturity/false-stable-claim</Code> — ERROR when structured claims say a
            component is Stable but its canonical status is not.
          </li>
          <li>
            <Code>distribution/false-installable-claim</Code> — ERROR when structured claims say a
            component is installable via the Skrewww registry but it is deliberately not
            distributed.
          </li>
        </ol>
        <p>
          The Guard engine also implements three Skrewww-repo <strong>internal</strong> invariants.
          Those are not part of this public consumer CLI.
        </p>
      </Section>

      <Section id="exit-codes" title="Exit codes">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Code>0</Code> — no ERROR findings
          </li>
          <li>
            <Code>1</Code> — one or more Guard ERROR findings
          </li>
          <li>
            <Code>2</Code> — tool / parse / input / facts failure
          </li>
        </ul>
      </Section>

      <Section id="provenance" title="Provenance">
        <p>
          Guard only treats files that carry a generated{" "}
          <Code>@skrewww-component &lt;slug&gt;</Code> origin marker (injected into Skrewww
          registry install payloads) as Skrewww-origin.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Meaning:</strong> originated from a Skrewww registry installation
          </li>
          <li>
            <strong>Not:</strong> still byte-identical to canonical Skrewww (local edits are OK)
          </li>
          <li>
            Installs created <strong>before</strong> markers shipped may be unrecognized until
            components are reinstalled or updated
          </li>
          <li>
            Unmarked local components (even named <Code>Button</Code> under{" "}
            <Code>components/ui</Code>) → unknown → <strong>no false ERROR</strong>
          </li>
        </ul>
        <p>Import path or component name alone never establishes a claim.</p>
      </Section>

      <Section id="not-validated" title="What Guard does not validate">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Arbitrary React props / TypeScript correctness</li>
          <li>Accessibility or WCAG compliance</li>
          <li>Shape or Surface mode</li>
          <li>Figma parity or visual quality</li>
          <li>Arbitrary design-system correctness beyond the three public rules</li>
        </ul>
        <p>
          Prop inventiveness (<Code>api/nonexistent-prop</Code>) remains deferred — Guard is not a
          prop-type checker.
        </p>
      </Section>

      <Section id="privacy" title="Privacy / offline">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Runs locally after install</li>
          <li>No source upload, no telemetry</li>
          <li>No LLM, Figma, or network required for validation after installation</li>
          <li>Diagnostics use project-relative paths; no source dumps</li>
        </ul>
      </Section>

      <Section id="ci" title="CI adoption">
        <p>
          Publishing Guard does <strong>not</strong> make it a required Skrewww CI gate. Adoption
          is intentional and staged: observe → optional → required only after Beta evidence.
        </p>
      </Section>

      <Section id="related" title="Related">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Link href="/agent-kit" className="font-medium text-brand-600 underline underline-offset-2">
              Agent Kit (Beta)
            </Link>{" "}
            — guides generation from current contracts; Guard validates selected claims after the
            fact
          </li>
          <li>
            <Link href="/changelog" className="font-medium text-brand-600 underline underline-offset-2">
              Changelog
            </Link>{" "}
            — public release history
          </li>
          <li>
            <a
              href="https://github.com/usmanfarooqi88/skrewwwDS/issues"
              className="font-medium text-brand-600 underline underline-offset-2"
            >
              GitHub Issues
            </a>{" "}
            — bugs and feedback
          </li>
        </ul>
      </Section>
    </div>
  );
}
