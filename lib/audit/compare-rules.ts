import type {
  AuditCategory,
  AuditEvidence,
  AuditFinding,
  AuditReasonCode,
  AuditStatus,
  FigmaPropertyMapping,
  IntentionalDifferenceRecord,
  NotApplicableRecord,
  PilotPropertyMap,
  PilotTokenRoleMap,
  TokenRoleMapping,
} from "@/lib/audit/audit-types";
import type { GuardEvaluationFact, RepoFacts, RuntimeDeclaration } from "@/lib/audit/repo-facts-types";
import type { FigmaSnapshot, SnapshotBinding, SnapshotVariable } from "@/lib/figma-snapshot/schema";

/**
 * AG-1D — small deterministic comparison rules. Each rule reads structured
 * inputs and returns findings; none mutates its inputs, reads a file, calls
 * another authority or uses model reasoning. Classification safety (basis,
 * confidence, severity, the unknown/fail boundary, intentional-difference)
 * lives in the shared helpers below so every rule follows the same semantics.
 */

export type RuleContext = {
  slug: string;
  facts: RepoFacts;
  snapshot: FigmaSnapshot;
  map: PilotPropertyMap | null;
  /** Explicit token-role calibration map; `null` when the pilot has none (role parity is then not compared). */
  roleMap: PilotTokenRoleMap | null;
  intentionalDifferences: readonly IntentionalDifferenceRecord[];
  notApplicable: readonly NotApplicableRecord[];
};

// ── shared classification ───────────────────────────────────────────────────

/** Unknowns whose resolution needs interpretation rather than more observation. */
const INFERRED_REASONS: ReadonlySet<AuditReasonCode> = new Set<AuditReasonCode>([
  "unmapped",
  "mapping-unknown",
  "alias-target-only",
  "prose-only",
  "free-form-api-name",
  "registry-subset-allowed",
]);

const HUMAN_DECISION_REASONS: ReadonlySet<AuditReasonCode> = new Set<AuditReasonCode>(["unmapped", "mapping-unknown", "alias-target-only", "not-applicable-record-contradicted"]);

function severityFor(category: AuditCategory, status: AuditStatus): AuditFinding["severity"] {
  if (status !== "fail") return "info";
  if (category === "identity") return "blocker";
  if (category === "figma-structure" || category === "documentation") return "minor";
  return "major";
}

export type FindingInput = {
  category: AuditCategory;
  claimKey: string;
  claim: string;
  status: AuditStatus;
  reasonCode: AuditReasonCode;
  expected?: string;
  actual?: string;
  /** The side the claim is checked against (Figma, or the authority being compared to). */
  expectedEvidence: AuditEvidence[];
  /** The side being checked (the repo, or the observation). */
  actualEvidence: AuditEvidence[];
};

/** Builds a finding; enforces that every pass/fail carries both compared sides. */
export function makeFinding(slug: string, input: FindingInput): AuditFinding {
  if ((input.status === "pass" || input.status === "fail") && (input.expectedEvidence.length === 0 || input.actualEvidence.length === 0)) {
    throw new Error(`${slug}:${input.category}:${input.claimKey}: a ${input.status} must cite both compared sides`);
  }
  if (input.status === "unknown" && input.expectedEvidence.length + input.actualEvidence.length === 0) {
    throw new Error(`${slug}:${input.category}:${input.claimKey}: an unknown must cite the observed side`);
  }
  const inferred = input.status === "unknown" && INFERRED_REASONS.has(input.reasonCode);
  const finding: AuditFinding = {
    findingId: `${slug}:${input.category}:${input.claimKey}`,
    componentSlug: slug,
    category: input.category,
    claimKey: input.claimKey,
    claim: input.claim,
    status: input.status,
    reasonCode: input.reasonCode,
    evidence: [...input.expectedEvidence, ...input.actualEvidence],
    basis: inferred ? "inferred" : "deterministic",
    confidence: inferred ? "medium" : "high",
    severity: severityFor(input.category, input.status),
    requiresHumanDecision: HUMAN_DECISION_REASONS.has(input.reasonCode),
  };
  if (input.expected !== undefined) finding.expected = input.expected;
  if (input.actual !== undefined) finding.actual = input.actual;
  return finding;
}

/**
 * The only path from a deterministic difference to a status: `fail`, unless an
 * exact structured record (same slug AND claimKey) marks it intentional. No
 * label, prose or tone can reach `intentional-difference`.
 */
export function differenceFinding(ctx: RuleContext, input: Omit<FindingInput, "status">): AuditFinding {
  const record = ctx.intentionalDifferences.find((candidate) => candidate.componentSlug === ctx.slug && candidate.claimKey === input.claimKey);
  if (!record) return makeFinding(ctx.slug, { ...input, status: "fail" });
  return makeFinding(ctx.slug, {
    ...input,
    status: "intentional-difference",
    reasonCode: "recorded-intentional-difference",
    actualEvidence: [...input.actualEvidence, { sourceType: "docs", sourceRef: record.sourceRef, observed: record.statement }],
  });
}

export function claimKeyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function figmaRef(ctx: RuleContext, path: string): string {
  return `figma:${ctx.snapshot.identity.fileKey}/${ctx.snapshot.identity.nodeId}/${path}`;
}

function figmaEvidence(ctx: RuleContext, path: string, observed: string): AuditEvidence {
  return { sourceType: "figma", sourceRef: figmaRef(ctx, path), observed, capturedAt: ctx.snapshot.capturedAt };
}

function repoEvidence(ctx: RuleContext, sourceType: AuditEvidence["sourceType"], sourceRef: string, observed: string): AuditEvidence {
  return { sourceType, sourceRef, observed, capturedAt: ctx.facts.provenance.gitSha };
}

function mapEvidence(ctx: RuleContext, mapping: FigmaPropertyMapping): AuditEvidence {
  const detail =
    mapping.kind === "react-prop" || mapping.kind === "presence"
      ? `${mapping.kind} → ${mapping.reactProperty}`
      : mapping.kind === "compound-child"
        ? `compound-child → ${mapping.exportName}`
        : mapping.kind === "css-state"
          ? `css-state: ${mapping.states}`
          : mapping.kind;
  return {
    sourceType: "audit-map",
    sourceRef: `audit-map:${ctx.slug}/${claimKeyPart(mapping.figmaProperty)}@${ctx.map?.version ?? "none"}`,
    observed: `${mapping.figmaProperty}: ${detail} — ${mapping.rationale}`,
  };
}

// ── identity ────────────────────────────────────────────────────────────────

export function compareIdentity(ctx: RuleContext): AuditFinding[] {
  const { facts, snapshot, slug } = ctx;
  const identity = facts.registry.figmaIdentity!;
  const findings: AuditFinding[] = [];
  findings.push(
    makeFinding(slug, {
      category: "identity",
      claimKey: "canonical-slug",
      claim: "The canonical slug resolves to one registry entry and its compiled contract",
      status: "pass",
      reasonCode: "equal",
      expected: slug,
      actual: facts.component.slug,
      expectedEvidence: [repoEvidence(ctx, "registry", `registry:${slug}`, `slug ${facts.component.slug}`)],
      actualEvidence: [repoEvidence(ctx, "contract", `contract:${slug}`, `contract compiled for ${facts.component.slug} at ${facts.contract.provenance.sourceGitSha}`)],
    }),
  );
  findings.push(
    makeFinding(slug, {
      category: "identity",
      claimKey: "figma-node",
      claim: "The snapshot describes the Figma node recorded as this component's identity (identity, not parity)",
      status: "pass",
      reasonCode: "equal",
      expected: `${identity.fileKey}/${identity.nodeId}`,
      actual: `${snapshot.identity.fileKey}/${snapshot.observed.node.id}`,
      expectedEvidence: [repoEvidence(ctx, "registry", `registry:${slug}/figmaIdentity`, `${identity.fileKey} ${identity.nodeId} ${identity.nodeType} ${identity.role}`)],
      actualEvidence: [figmaEvidence(ctx, "node", `${snapshot.observed.node.id} "${snapshot.observed.node.name}"`)],
    }),
  );
  findings.push(
    makeFinding(slug, {
      category: "identity",
      claimKey: "figma-node-type",
      claim: "The snapshot node type equals the recorded identity node type",
      status: "pass",
      reasonCode: "equal",
      expected: identity.nodeType,
      actual: snapshot.observed.node.type,
      expectedEvidence: [repoEvidence(ctx, "registry", `registry:${slug}/figmaIdentity/nodeType`, identity.nodeType)],
      actualEvidence: [figmaEvidence(ctx, "node/type", snapshot.observed.node.type)],
    }),
  );
  const contractNode = facts.contract.figma.nodeId;
  const contractInput = {
    category: "identity" as const,
    claimKey: "contract-figma-node",
    claim: "The compiled contract records the same Figma node as the registry identity",
    expected: identity.nodeId,
    actual: contractNode ?? "(none)",
    expectedEvidence: [repoEvidence(ctx, "registry", `registry:${slug}/figmaIdentity/nodeId`, identity.nodeId)],
    actualEvidence: [repoEvidence(ctx, "contract", `contract:${slug}/figma`, `verified=${facts.contract.figma.verified} nodeId=${contractNode ?? "(none)"}`)],
  };
  if (!contractNode) findings.push(makeFinding(slug, { ...contractInput, status: "unknown", reasonCode: "missing-repo-side" }));
  else if (contractNode === identity.nodeId) findings.push(makeFinding(slug, { ...contractInput, status: "pass", reasonCode: "equal" }));
  else findings.push(differenceFinding(ctx, { ...contractInput, reasonCode: "different" }));
  return findings;
}

// ── guard ───────────────────────────────────────────────────────────────────

const GUARD_STATUS: Record<GuardEvaluationFact["status"], { status: AuditStatus; reasonCode: AuditReasonCode }> = {
  pass: { status: "pass", reasonCode: "guard-pass" },
  violation: { status: "fail", reasonCode: "guard-violation" },
  unknown: { status: "unknown", reasonCode: "guard-unknown" },
  "not-applicable": { status: "not-applicable", reasonCode: "guard-not-applicable" },
};

function guardSubjectRef(slug: string, subject: GuardEvaluationFact["subject"]): string {
  if (!subject) return `registry:${slug}`;
  if (subject.kind === "manifest") return `manifest:${subject.id} (generated in memory)`;
  if (subject.kind === "contract") return `contract:${subject.id} (compiled in memory)`;
  if (subject.kind === "token") return `registry:${slug}/cssTokens`;
  return `registry:${subject.id}`;
}

/** Mechanical: pass→pass, violation→fail, unknown→unknown, not-applicable→not-applicable. One finding per evaluation. */
export function compareGuard(ctx: RuleContext): AuditFinding[] {
  return ctx.facts.guard.evaluations.map((evaluation) => {
    const { status, reasonCode } = GUARD_STATUS[evaluation.status];
    const subjectPart = evaluation.subject ? `${evaluation.subject.kind}-${claimKeyPart(evaluation.subject.id)}` : "scope";
    const observed =
      evaluation.status === "violation"
        ? `${evaluation.status}: ${evaluation.finding?.canonicalEvidence ?? ""}`
        : `${evaluation.status}${evaluation.reason ? `: ${evaluation.reason}` : ""}`;
    const finding = makeFinding(ctx.slug, {
      category: "guard",
      claimKey: `${claimKeyPart(evaluation.ruleId)}-${subjectPart}`,
      claim: `Guard rule ${evaluation.ruleId} for ${evaluation.subject ? `${evaluation.subject.kind} ${evaluation.subject.id}` : ctx.slug}`,
      status,
      reasonCode,
      expectedEvidence: [repoEvidence(ctx, "registry", guardSubjectRef(ctx.slug, evaluation.subject), `subject attributed by ${evaluation.attribution}`)],
      actualEvidence: [
        {
          sourceType: "guard",
          sourceRef: `guard:${evaluation.ruleId}`,
          observed: observed.slice(0, 400),
          capturedAt: ctx.facts.guard.evidenceSourceGitSha,
        },
      ],
    });
    if (evaluation.status === "violation" && evaluation.finding?.severity === "error") finding.severity = "major";
    return finding;
  });
}

// ── token dependencies (Figma-name domain) ──────────────────────────────────

type BindingIndex = {
  byName: Map<string, SnapshotBinding[]>;
  direct: Set<string>;
  nested: Set<string>;
  /** Variables that are an alias target (any hop) of a bound or closure variable → the variables that alias them. */
  aliasTargets: Map<string, string[]>;
  /** True when some alias target could not be resolved, so absence from the graph is not provable. */
  aliasChainsOpen: boolean;
  boundCount: number;
  closureCount: number;
  closureCaptured: boolean;
  unresolvedAliasIds: string[];
};

function indexBindings(snapshot: FigmaSnapshot): BindingIndex {
  const closure = snapshot.observed.aliasClosure;
  const graph = [...snapshot.observed.variables, ...(closure?.variables ?? [])];
  const nameById = new Map(snapshot.observed.variables.map((variable) => [variable.id, variable.name]));
  const capturedNames = new Set(graph.map((variable) => variable.name));
  const byName = new Map<string, SnapshotBinding[]>();
  const direct = new Set<string>();
  const nested = new Set<string>();
  for (const binding of snapshot.observed.variableBindings) {
    const name = nameById.get(binding.variableId);
    if (!name) continue;
    const list = byName.get(name) ?? [];
    list.push(binding);
    byName.set(name, list);
    (binding.withinInstance === null ? direct : nested).add(name);
  }
  const aliasTargets = new Map<string, string[]>();
  let aliasChainsOpen = (closure?.unresolvedIds.length ?? 0) > 0;
  for (const variable of graph) {
    for (const value of Object.values(variable.valuesByMode)) {
      if (value && typeof value === "object" && "alias" in value) {
        if (!value.alias || !capturedNames.has(value.alias)) {
          aliasChainsOpen = true;
          continue;
        }
        const sources = aliasTargets.get(value.alias) ?? [];
        if (!sources.includes(variable.name)) sources.push(variable.name);
        aliasTargets.set(value.alias, sources.sort());
      }
    }
  }
  return {
    byName,
    direct,
    nested,
    aliasTargets,
    aliasChainsOpen,
    boundCount: snapshot.observed.variables.length,
    closureCount: closure?.variables.length ?? 0,
    closureCaptured: closure !== undefined,
    unresolvedAliasIds: closure?.unresolvedIds ?? [],
  };
}

function describeBinding(binding: SnapshotBinding): string {
  const scope = binding.scope === "all" ? "all variants" : `${binding.scope.length} variant(s)`;
  return `${binding.path || "(root)"} ${binding.property} (${scope}${binding.withinInstance ? `, within instance ${binding.withinInstance}` : ""})`;
}

/**
 * Registry `tokensUsed` is the canonical Figma-named token dependency set (R1:
 * `content ⊆ registry`; the registry may be NARROWER than what is rendered, so
 * it is not expected to list every binding). The comparable direction is
 * registry → Figma: is each registry token a binding of this master?
 *
 * - bound in the master subtree                 → pass
 * - only an alias target (any hop)               → unknown (dependency set vs resolution chain is not specified)
 * - not observed, alias chains unresolved        → unknown (absence is not provable)
 * - not observed, alias closure fully captured   → fail (the token is absent from the master's whole dependency graph)
 *
 * Figma bindings missing from `tokensUsed` are reported once as unknown — R1
 * allows a narrower registry, so omission is not a violation. Nothing here
 * touches CSS custom-property names.
 */
export function compareFigmaTokenDependencies(ctx: RuleContext): AuditFinding[] {
  const index = indexBindings(ctx.snapshot);
  const registryTokens = ctx.facts.registry.tokensUsed;
  const findings: AuditFinding[] = [];
  for (const token of registryTokens) {
    const base = {
      category: "tokens" as const,
      claimKey: `figma-binding-${claimKeyPart(token)}`,
      claim: `Registry tokensUsed entry ${token} is a variable binding of the Figma master`,
      expected: token,
      actualEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/tokensUsed`, token)],
    };
    const bindings = (index.byName.get(token) ?? []).slice().sort((a, b) => describeBinding(a).localeCompare(describeBinding(b)));
    if (index.direct.has(token) || index.nested.has(token)) {
      const viaInstance = !index.direct.has(token);
      findings.push(
        makeFinding(ctx.slug, {
          ...base,
          status: "pass",
          reasonCode: viaInstance ? "bound-within-instance" : "bound-directly",
          actual: token,
          expectedEvidence: [figmaEvidence(ctx, "variableBindings", `${token} bound ${bindings.length}× e.g. ${describeBinding(bindings[0])}`)],
        }),
      );
      continue;
    }
    const aliasSources = index.aliasTargets.get(token);
    if (aliasSources) {
      findings.push(
        makeFinding(ctx.slug, {
          ...base,
          status: "unknown",
          reasonCode: "alias-target-only",
          actual: "not bound; reached as an alias target",
          expectedEvidence: [figmaEvidence(ctx, "variables", `${token} is the alias target of ${aliasSources.join(", ")}`)],
        }),
      );
      continue;
    }
    const absence = index.closureCaptured
      ? figmaEvidence(
          ctx,
          "aliasClosure",
          `${token} is not among the ${index.boundCount} bound variables nor the ${index.closureCount} variables reachable through their alias chains${
            index.aliasChainsOpen ? " (closure incomplete)" : " (closure complete)"
          }`,
        )
      : figmaEvidence(
          ctx,
          "variableBindings",
          `${token} is not among ${index.direct.size} directly bound and ${index.nested.size} nested-only variables, nor a captured alias target`,
        );
    if (index.aliasChainsOpen) {
      findings.push(
        makeFinding(ctx.slug, {
          ...base,
          status: "unknown",
          reasonCode: "not-observed-alias-chain-truncated",
          actual: "not observed in the captured binding graph",
          expectedEvidence: [
            absence,
            index.closureCaptured
              ? figmaEvidence(ctx, "aliasClosure/unresolvedIds", `${index.unresolvedAliasIds.length} alias target(s) could not be resolved: ${index.unresolvedAliasIds.join(", ") || "(unnamed)"}`)
              : figmaEvidence(ctx, "unknowns/renderedValues", "no alias closure was captured (schema 1.0.0); alias chains past one hop are not resolved"),
          ],
        }),
      );
    } else {
      findings.push(differenceFinding(ctx, { ...base, reasonCode: "not-observed", actual: "not bound in the Figma master and not in its alias closure", expectedEvidence: [absence] }));
    }
  }
  const registrySet = new Set(registryTokens);
  const outside = Array.from(index.direct)
    .filter((name) => !registrySet.has(name))
    .sort();
  if (outside.length > 0) {
    findings.push(
      makeFinding(ctx.slug, {
        category: "tokens",
        claimKey: "figma-bindings-outside-registry",
        claim: "Variables bound directly on the Figma master that registry tokensUsed does not list",
        status: "unknown",
        reasonCode: "registry-subset-allowed",
        actual: outside.join(", "),
        expectedEvidence: [figmaEvidence(ctx, "variableBindings", `directly bound, not in tokensUsed: ${outside.join(", ")}`)],
        actualEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/tokensUsed`, `${registryTokens.length} tokens; R1 permits a narrower registry set`)],
      }),
    );
  }
  return findings;
}

// ── mapped properties, options, states ──────────────────────────────────────

function documentedNames(ctx: RuleContext): Set<string> {
  return new Set(ctx.facts.registry.documentedApiProperties.filter((prop) => prop.nameKind === "identifier").map((prop) => prop.name));
}

function documentedRepresentation(ctx: RuleContext, mapping: FigmaPropertyMapping, reactName: string): AuditFinding {
  const documented = documentedNames(ctx).has(reactName);
  return makeFinding(ctx.slug, {
    category: "api",
    claimKey: `figma-property-${claimKeyPart(mapping.figmaProperty)}`,
    claim: `Figma property ${mapping.figmaProperty} is represented by documented React ${mapping.kind === "children" ? "children" : `prop ${reactName}`}`,
    status: documented ? "pass" : "unknown",
    reasonCode: documented ? "equal" : "undocumented-representation",
    expected: reactName,
    actual: documented ? reactName : `${reactName} not in the documented API (truth deferred to TypeScript)`,
    expectedEvidence: [mapEvidence(ctx, mapping)],
    actualEvidence: [
      repoEvidence(
        ctx,
        "registry",
        `registry:${ctx.slug}/apiProps`,
        `documented: ${Array.from(documentedNames(ctx)).sort().join(", ") || "(none)"}`,
      ),
    ],
  });
}

export function compareMappedProperties(ctx: RuleContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const properties = ctx.snapshot.observed.componentProperties;
  const mappings = ctx.map?.mappings ?? [];

  if (properties.length === 0 && mappings.length === 0) {
    const reference = ctx.facts.registry.figmaReference;
    findings.push(
      makeFinding(ctx.slug, {
        category: "figma-structure",
        claimKey: "component-properties",
        claim: "Figma master component properties",
        status: "not-applicable",
        reasonCode: "not-applicable-observed",
        actual: "the Figma master exposes no component properties",
        expectedEvidence: [figmaEvidence(ctx, "componentProperties", "[] (no component properties)")],
        actualEvidence: reference ? [repoEvidence(ctx, "registry", `registry:${ctx.slug}/figmaReference`, reference.slice(0, 300))] : [],
      }),
    );
    return findings;
  }

  for (const property of properties) {
    if (mappings.some((mapping) => mapping.figmaProperty === property.name)) continue;
    findings.push(
      makeFinding(ctx.slug, {
        category: "api",
        claimKey: `figma-property-${claimKeyPart(property.name)}`,
        claim: `Figma property ${property.name} has a React representation`,
        status: "unknown",
        reasonCode: "unmapped",
        actual: "no audit property-map entry",
        expectedEvidence: [figmaEvidence(ctx, `componentProperties/${property.name}`, `${property.name} (${property.type})`)],
        actualEvidence: [],
      }),
    );
  }

  for (const mapping of mappings) {
    const property = properties.find((candidate) => candidate.name === mapping.figmaProperty);
    const structureInput = {
      category: "figma-structure" as const,
      claimKey: `mapped-property-${claimKeyPart(mapping.figmaProperty)}`,
      claim: `Figma property ${mapping.figmaProperty} named by the audit map exists on the master`,
      expected: mapping.figmaProperty,
      expectedEvidence: [mapEvidence(ctx, mapping)],
    };
    if (!property) {
      findings.push(
        differenceFinding(ctx, {
          ...structureInput,
          reasonCode: "different",
          actual: "absent",
          actualEvidence: [figmaEvidence(ctx, "componentProperties", `present: ${properties.map((p) => p.name).join(", ") || "(none)"}`)],
        }),
      );
      continue;
    }
    findings.push(
      makeFinding(ctx.slug, {
        ...structureInput,
        status: "pass",
        reasonCode: "equal",
        actual: `${property.name} (${property.type})`,
        actualEvidence: [figmaEvidence(ctx, `componentProperties/${property.name}`, `${property.name} (${property.type})`)],
      }),
    );

    switch (mapping.kind) {
      case "react-prop":
      case "presence":
        findings.push(documentedRepresentation(ctx, mapping, mapping.reactProperty));
        break;
      case "children":
        findings.push(documentedRepresentation(ctx, mapping, "children"));
        break;
      case "compound-child": {
        const exported = ctx.facts.react.publicExports.values.includes(mapping.exportName);
        const input = {
          category: "api" as const,
          claimKey: `figma-property-${claimKeyPart(mapping.figmaProperty)}`,
          claim: `Figma property ${mapping.figmaProperty} is represented by the public compound export ${mapping.exportName}`,
          expected: mapping.exportName,
          expectedEvidence: [mapEvidence(ctx, mapping)],
          actualEvidence: [
            repoEvidence(ctx, "tsx", `tsx:${ctx.facts.react.publicBarrel}`, `public values: ${ctx.facts.react.publicExports.values.join(", ")}`),
          ],
        };
        findings.push(
          exported
            ? makeFinding(ctx.slug, { ...input, status: "pass", reasonCode: "equal", actual: mapping.exportName })
            : differenceFinding(ctx, { ...input, reasonCode: "different", actual: "not publicly exported" }),
        );
        break;
      }
      case "css-state":
        findings.push(
          makeFinding(ctx.slug, {
            category: "states",
            claimKey: `figma-property-${claimKeyPart(mapping.figmaProperty)}`,
            claim: `Figma ${mapping.figmaProperty} options render the same as the React CSS states`,
            status: "unknown",
            reasonCode: "requires-rendering",
            expected: (property.variantOptions ?? []).join("|"),
            actual: mapping.states,
            expectedEvidence: [figmaEvidence(ctx, `componentProperties/${property.name}`, `options ${(property.variantOptions ?? []).join(", ")}`)],
            actualEvidence: [mapEvidence(ctx, mapping)],
          }),
        );
        break;
      case "unsupported":
        findings.push(
          makeFinding(ctx.slug, {
            category: "api",
            claimKey: `figma-property-${claimKeyPart(mapping.figmaProperty)}`,
            claim: `Figma property ${mapping.figmaProperty} has a React representation`,
            status: "not-applicable",
            reasonCode: "not-applicable-recorded",
            expectedEvidence: [figmaEvidence(ctx, `componentProperties/${property.name}`, `${property.name} (${property.type})`)],
            actualEvidence: [mapEvidence(ctx, mapping), { sourceType: "docs", sourceRef: mapping.sourceRef, observed: mapping.rationale }],
          }),
        );
        break;
      case "unknown":
        findings.push(
          makeFinding(ctx.slug, {
            category: "api",
            claimKey: `figma-property-${claimKeyPart(mapping.figmaProperty)}`,
            claim: `Figma property ${mapping.figmaProperty} has a React representation`,
            status: "unknown",
            reasonCode: "mapping-unknown",
            expectedEvidence: [figmaEvidence(ctx, `componentProperties/${property.name}`, `${property.name} (${property.type})`)],
            actualEvidence: [mapEvidence(ctx, mapping)],
          }),
        );
        break;
    }

    if (mapping.kind === "react-prop" && mapping.registryOptionSet && mapping.optionMap) {
      findings.push(compareOptionSet(ctx, mapping, property.variantOptions ?? null));
    }
  }
  return findings;
}

function compareOptionSet(
  ctx: RuleContext,
  mapping: Extract<FigmaPropertyMapping, { kind: "react-prop" }>,
  figmaOptions: string[] | null,
): AuditFinding {
  const optionSet = mapping.registryOptionSet!;
  const optionMap = mapping.optionMap!;
  const registryValues = [...ctx.facts.registry[optionSet]].sort();
  const base = {
    category: "api" as const,
    claimKey: `figma-options-${claimKeyPart(mapping.figmaProperty)}`,
    claim: `Figma ${mapping.figmaProperty} options equal registry ${optionSet} through the explicit option map`,
    actualEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/${optionSet}`, registryValues.join(", ") || "(none)")],
  };
  if (!figmaOptions || figmaOptions.length === 0) {
    return makeFinding(ctx.slug, {
      ...base,
      status: "unknown",
      reasonCode: "missing-figma-side",
      expectedEvidence: [figmaEvidence(ctx, `componentProperties/${mapping.figmaProperty}`, "no variant options")],
    });
  }
  const figmaEvidenceEntry = figmaEvidence(ctx, `componentProperties/${mapping.figmaProperty}/variantOptions`, figmaOptions.join(", "));
  const unmappedOptions = figmaOptions.filter((option) => !(option in optionMap));
  if (unmappedOptions.length > 0) {
    return makeFinding(ctx.slug, {
      ...base,
      status: "unknown",
      reasonCode: "unmapped",
      actual: `no option-map entry for ${unmappedOptions.join(", ")}`,
      expectedEvidence: [figmaEvidenceEntry, mapEvidence(ctx, mapping)],
    });
  }
  const mapped = Array.from(new Set(figmaOptions.map((option) => optionMap[option]))).sort();
  const input = {
    ...base,
    expected: mapped.join("|"),
    actual: registryValues.join("|"),
    expectedEvidence: [figmaEvidenceEntry, mapEvidence(ctx, mapping)],
  };
  return mapped.join("|") === registryValues.join("|")
    ? makeFinding(ctx.slug, { ...input, status: "pass", reasonCode: "equal" })
    : differenceFinding(ctx, { ...input, reasonCode: "different" });
}

// ── modes ───────────────────────────────────────────────────────────────────

/**
 * Dark mode: `not-applicable` only when (1) the Figma master binds a collection
 * with a Dark mode, (2) a recorded architecture source says React has no Dark
 * theme, and (3) RepoFacts shows no dark-context declaration for the observed
 * properties. If (3) is contradicted the record cannot be trusted → unknown.
 */
export function compareDarkMode(ctx: RuleContext): AuditFinding[] {
  const record = ctx.notApplicable.find((candidate) => candidate.claimKey === "dark-mode" && (candidate.componentSlug === "*" || candidate.componentSlug === ctx.slug));
  const bound = new Set(ctx.snapshot.derived.boundCollections);
  const darkCollections = ctx.snapshot.observed.collections.filter((collection) => bound.has(collection.name) && collection.modes.includes("Dark"));
  if (!record || darkCollections.length === 0) return [];
  const darkDeclarations = ctx.facts.tokens.runtimeDeclarations
    .flatMap((token) => token.declarations)
    .filter((declaration) => /dark/i.test(declaration.context));
  const figmaSide = figmaEvidence(
    ctx,
    "collections",
    darkCollections.map((collection) => `${collection.name}: ${collection.modes.join("/")}`).join("; "),
  );
  const recordEvidence: AuditEvidence = { sourceType: "docs", sourceRef: record.sourceRef, observed: record.statement };
  if (darkDeclarations.length > 0) {
    const first = darkDeclarations[0];
    return [
      makeFinding(ctx.slug, {
        category: "states",
        claimKey: "dark-mode",
        claim: "Figma Dark mode has a React counterpart",
        status: "unknown",
        reasonCode: "not-applicable-record-contradicted",
        expectedEvidence: [figmaSide, recordEvidence],
        actualEvidence: [repoEvidence(ctx, "css", `css:${first.file}:${first.line}`, `${first.context} ${first.value}`)],
      }),
    ];
  }
  return [
    makeFinding(ctx.slug, {
      category: "states",
      claimKey: "dark-mode",
      claim: "Figma Dark mode has a React counterpart",
      status: "not-applicable",
      reasonCode: "not-applicable-recorded",
      actual: "no dark-context declaration among the observed custom properties",
      expectedEvidence: [figmaSide],
      actualEvidence: [recordEvidence, repoEvidence(ctx, "css", "css:styles/tokens.css", "no dark-context declaration for observed properties")],
    }),
  ];
}

// ── repo implementation evidence (CSS) ──────────────────────────────────────

/**
 * CSS-side parity has no Figma-variable ↔ CSS-custom-property map, so it is
 * `unknown` by construction. The finding still carries the repo evidence —
 * parity-labelled declarations and alias chains — for the explanation layer
 * and calibration. Labels are evidence: VERIFIED never yields pass, TEMPORARY
 * never yields intentional-difference, EXPERIMENTAL never yields fail.
 */
export function compareImplementationEvidence(ctx: RuleContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const used = ctx.facts.css.customPropertiesUsed;
  if (used.length === 0) return findings;
  const labelled: AuditEvidence[] = [];
  for (const token of ctx.facts.tokens.runtimeDeclarations) {
    for (const declaration of token.declarations) {
      if (!declaration.parityLabel || declaration.parityLabel === "VERIFIED" || declaration.parityLabel === "ALIASED") continue;
      labelled.push(
        repoEvidence(
          ctx,
          "css",
          `css:${declaration.file}:${declaration.line}`,
          `${token.name} [${declaration.context}] = ${declaration.value} [${declaration.parityLabel}, ${declaration.labelSource}]${
            token.aliasChain.length > 1 ? ` chain ${token.aliasChain.map((hop) => hop.name).join(" → ")}` : ""
          }`,
        ),
      );
    }
  }
  const cssFiles = Array.from(new Set(used.flatMap((use) => use.usedIn.map((source) => `${source.file} (${source.origin})`)))).sort();
  findings.push(
    makeFinding(ctx.slug, {
      category: "tokens",
      claimKey: "css-implementation-parity",
      claim: "Figma variable values match the CSS custom properties the implementation renders",
      status: "unknown",
      reasonCode: "no-figma-css-map",
      actual: `${used.length} custom properties observed; no Figma-variable ↔ CSS-custom-property map exists`,
      expectedEvidence: [figmaEvidence(ctx, "variableBindings", `${ctx.snapshot.observed.variables.length} Figma variables bound (Figma-name domain)`)],
      actualEvidence: [repoEvidence(ctx, "css", "css:implementation-graph", cssFiles.join(", ")), ...labelled],
    }),
  );
  if (ctx.facts.tokens.unresolved.length > 0) {
    findings.push(
      makeFinding(ctx.slug, {
        category: "tokens",
        claimKey: "css-unresolved-properties",
        claim: "Every custom property the implementation uses resolves to a declaration",
        status: "unknown",
        reasonCode: "missing-repo-side",
        actual: ctx.facts.tokens.unresolved.join(", "),
        expectedEvidence: [],
        actualEvidence: [repoEvidence(ctx, "css", "css:styles/tokens.css", `unresolved: ${ctx.facts.tokens.unresolved.join(", ")}`)],
      }),
    );
  }
  return findings;
}

// ── documentation evidence ──────────────────────────────────────────────────

/** Prose is evidence, never compared and never "fixed": stale prose stays visible as unknown. */
export function compareDocumentationEvidence(ctx: RuleContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const reference = ctx.facts.registry.figmaReference;
  const identity = ctx.facts.registry.figmaIdentity!;
  if (reference) {
    findings.push(
      makeFinding(ctx.slug, {
        category: "documentation",
        claimKey: "figma-reference-prose",
        claim: "Registry figmaReference prose agrees with the recorded Figma identity",
        status: "unknown",
        reasonCode: "prose-only",
        expected: `${identity.nodeType} ${identity.nodeId} (${identity.role})`,
        actual: reference.slice(0, 300),
        expectedEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/figmaIdentity`, `${identity.nodeType} ${identity.nodeId} ${identity.role}`)],
        actualEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/figmaReference`, reference.slice(0, 300))],
      }),
    );
  }
  const freeForm = ctx.facts.registry.documentedApiProperties.filter((prop) => prop.nameKind !== "identifier").map((prop) => prop.name);
  if (freeForm.length > 0) {
    findings.push(
      makeFinding(ctx.slug, {
        category: "api",
        claimKey: "documented-free-form-names",
        claim: "Documented API names that are not prop identifiers",
        status: "unknown",
        reasonCode: "free-form-api-name",
        actual: freeForm.join(", "),
        expectedEvidence: [],
        actualEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/apiProps`, `free-form: ${freeForm.join(", ")}`)],
      }),
    );
  }
  return findings;
}

// ── token roles (explicit calibration map) ──────────────────────────────────

const LENGTH = /^(-?\d+(?:\.\d+)?)(?:px)?$/;
const RESOLUTION_DEPTH = 8;

function roleMapEvidence(ctx: RuleContext, role: TokenRoleMapping): AuditEvidence {
  return {
    sourceType: "audit-map",
    sourceRef: `audit-map:${ctx.slug}/token-roles/${role.claimKey}`,
    observed: `${role.description}: Figma ${role.figma.path || "(root)"} ${role.figma.properties.join("/")} ↔ registry ${role.registry.tokens.join(", ")} ↔ CSS ${role.css.customProperty}`,
  };
}

/** Names of the variables bound on the role's Figma properties (root-level facts that hold in every variant). */
function roleBoundNames(ctx: RuleContext, role: TokenRoleMapping): { names: string[]; boundProperties: string[] } {
  const nameById = new Map(ctx.snapshot.observed.variables.map((variable) => [variable.id, variable.name]));
  const names = new Set<string>();
  const boundProperties = new Set<string>();
  for (const binding of ctx.snapshot.observed.variableBindings) {
    if (binding.withinInstance !== null || binding.scope !== "all" || binding.path !== role.figma.path) continue;
    if (!role.figma.properties.includes(binding.property)) continue;
    const name = nameById.get(binding.variableId);
    if (!name) continue;
    names.add(name);
    boundProperties.add(binding.property);
  }
  return { names: Array.from(names).sort(), boundProperties: Array.from(boundProperties).sort() };
}

type NumericResolution = { ok: true; value: number; steps: string[] } | { ok: false; reason: string };

/** Follows a Figma variable to a numeric literal for one mode: through single-mode alias targets only. */
function resolveFigmaNumber(ctx: RuleContext, variable: SnapshotVariable, mode: string): NumericResolution {
  const byId = new Map<string, SnapshotVariable>(
    [...ctx.snapshot.observed.variables, ...(ctx.snapshot.observed.aliasClosure?.variables ?? [])].map((candidate) => [candidate.id, candidate]),
  );
  let current = variable;
  let modeKey = mode;
  const steps = [`${variable.name} [${mode}]`];
  for (let depth = 0; depth < RESOLUTION_DEPTH; depth += 1) {
    const value = current.valuesByMode[modeKey];
    if (typeof value === "number") return { ok: true, value, steps: [...steps, String(value)] };
    if (value && typeof value === "object" && "aliasId" in value) {
      const target = byId.get(value.aliasId);
      if (!target) return { ok: false, reason: `alias target ${value.alias ?? value.aliasId} was not captured` };
      const modes = Object.keys(target.valuesByMode);
      if (modes.length !== 1) return { ok: false, reason: `alias target ${target.name} has ${modes.length} modes; the mode that applies is not determinable` };
      current = target;
      modeKey = modes[0];
      steps.push(target.name);
      continue;
    }
    return { ok: false, reason: `${current.name} [${modeKey}] is not a numeric value` };
  }
  return { ok: false, reason: "alias depth limit reached" };
}

/** Statically resolves the role's custom property to a length under one mode selector, then `:root`. */
function resolveCssNumber(ctx: RuleContext, role: TokenRoleMapping, attributeValue: string): (NumericResolution & { evidence: AuditEvidence[] }) | { ok: false; reason: string; evidence: AuditEvidence[] } {
  const resolution = ctx.facts.tokens.runtimeDeclarations.find((token) => token.name === role.css.customProperty);
  if (!resolution) return { ok: false, reason: `${role.css.customProperty} is not among the observed custom properties`, evidence: [] };
  const modeContext = `[${role.css.modeAttribute}="${attributeValue}"]`;
  const evidence: AuditEvidence[] = [];
  const steps: string[] = [];
  const seen = new Set<string>();
  let name = resolution.name;
  let declarations: RuntimeDeclaration[] = resolution.declarations;
  for (let depth = 0; depth < RESOLUTION_DEPTH; depth += 1) {
    if (seen.has(name)) return { ok: false, reason: `alias cycle at ${name}`, evidence };
    seen.add(name);
    const chosen = declarations.find((declaration) => declaration.context === modeContext) ?? declarations.find((declaration) => declaration.context === ":root");
    if (!chosen) return { ok: false, reason: `${name} has no ${modeContext} or :root declaration`, evidence };
    evidence.push(
      repoEvidence(ctx, "css", `css:${chosen.file}:${chosen.line}`, `${name} [${chosen.context}] = ${chosen.value}${chosen.parityLabel ? ` [${chosen.parityLabel}${chosen.labelSource ? `, ${chosen.labelSource}` : ""}]` : ""}`),
    );
    const literal = LENGTH.exec(chosen.value);
    if (literal) return { ok: true, value: Number(literal[1]), steps: [...steps, chosen.value], evidence };
    if (!chosen.aliasTarget) return { ok: false, reason: `${name} = ${chosen.value} is not a plain length`, evidence };
    steps.push(`${name} → ${chosen.aliasTarget}`);
    name = chosen.aliasTarget;
    declarations = resolution.chainDeclarations.find((entry) => entry.name === name)?.declarations ?? [];
  }
  return { ok: false, reason: "alias depth limit reached", evidence };
}

function roleFinding(finding: AuditFinding): AuditFinding {
  // Which side is right (design or implementation) is a human decision.
  if (finding.status === "fail" || finding.status === "intentional-difference") finding.requiresHumanDecision = true;
  return finding;
}

/**
 * Explicit token-role comparison (pilot-scoped; see pilot-token-role-maps.ts).
 * Only roles named in the map are compared; nothing is inferred from names.
 *
 * - `role-<key>-token`: the registry token that implements the role must be a
 *   token the Figma master binds on the role's properties → pass / fail.
 * - `role-<key>-value-<mode>`: the Figma value (alias chain followed to a
 *   number through the captured closure) against the CSS value (static
 *   resolution of the role's custom property under the mode selector) → pass /
 *   fail when both resolve, unknown otherwise.
 * - Figma modes the map does not pair with a CSS selector → one unknown.
 */
export function compareTokenRoles(ctx: RuleContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const role of ctx.roleMap?.roles ?? []) {
    const mapEvidence_ = roleMapEvidence(ctx, role);
    const { names, boundProperties } = roleBoundNames(ctx, role);
    const registryRole = role.registry.tokens.filter((token) => ctx.facts.registry.tokensUsed.includes(token));
    const registryEvidence = repoEvidence(ctx, "registry", `registry:${ctx.slug}/tokensUsed`, registryRole.join(", ") || `none of ${role.registry.tokens.join(", ")}`);

    // 1. token identity
    const tokenBase = {
      category: "tokens" as const,
      claimKey: `role-${role.claimKey}-token`,
      claim: `${role.description}: the registry token that implements it is the token the Figma master binds`,
    };
    if (names.length === 0) {
      findings.push(
        makeFinding(ctx.slug, {
          ...tokenBase,
          status: "unknown",
          reasonCode: "missing-figma-side",
          actual: `no variable is bound on ${role.figma.properties.join("/")} at ${role.figma.path || "(root)"}`,
          expectedEvidence: [mapEvidence_],
          actualEvidence: [registryEvidence],
        }),
      );
    } else if (registryRole.length === 0) {
      findings.push(
        makeFinding(ctx.slug, {
          ...tokenBase,
          status: "unknown",
          reasonCode: "missing-repo-side",
          actual: `registry tokensUsed lists none of ${role.registry.tokens.join(", ")}`,
          expectedEvidence: [figmaEvidence(ctx, "variableBindings", `${role.figma.path || "(root)"} ${boundProperties.join("/")} bound to ${names.join(", ")}`)],
          actualEvidence: [mapEvidence_],
        }),
      );
    } else {
      const missing = registryRole.filter((token) => !names.includes(token));
      const input = {
        ...tokenBase,
        expected: names.join(", "),
        actual: registryRole.join(", "),
        expectedEvidence: [figmaEvidence(ctx, "variableBindings", `${role.figma.path || "(root)"} ${boundProperties.join("/")} bound to ${names.join(", ")}`)],
        actualEvidence: [registryEvidence, mapEvidence_],
      };
      findings.push(
        roleFinding(
          missing.length === 0
            ? makeFinding(ctx.slug, { ...input, status: "pass", reasonCode: "equal" })
            : differenceFinding(ctx, { ...input, reasonCode: "different" }),
        ),
      );
    }

    // 2. per-mode values
    const roleVariable = names.length === 1 ? ctx.snapshot.observed.variables.find((variable) => variable.name === names[0]) : undefined;
    if (!roleVariable) continue;
    const mappedModes = new Set(role.css.modes.map((mode) => mode.figmaMode));
    for (const mode of role.css.modes) {
      const base = {
        category: "tokens" as const,
        claimKey: `role-${role.claimKey}-value-${claimKeyPart(mode.figmaMode)}`,
        claim: `${role.description}: Figma ${roleVariable.name} in ${mode.figmaMode} mode equals the CSS value of ${role.css.customProperty} under ${role.css.modeAttribute}="${mode.attributeValue}"`,
      };
      if (!(mode.figmaMode in roleVariable.valuesByMode)) {
        findings.push(
          makeFinding(ctx.slug, {
            ...base,
            status: "unknown",
            reasonCode: "missing-figma-side",
            actual: `${roleVariable.name} has no ${mode.figmaMode} mode`,
            expectedEvidence: [figmaEvidence(ctx, `variables/${roleVariable.name}`, `modes: ${Object.keys(roleVariable.valuesByMode).join(", ")}`)],
            actualEvidence: [mapEvidence_],
          }),
        );
        continue;
      }
      const figma = resolveFigmaNumber(ctx, roleVariable, mode.figmaMode);
      const css = resolveCssNumber(ctx, role, mode.attributeValue);
      const figmaSide = figma.ok
        ? figmaEvidence(ctx, `variables/${roleVariable.name}/${mode.figmaMode}`, `${figma.steps.join(" → ")}`)
        : figmaEvidence(ctx, `variables/${roleVariable.name}/${mode.figmaMode}`, `unresolved: ${figma.reason}`);
      const cssSide = [...css.evidence, mapEvidence_];
      if (!figma.ok || !css.ok) {
        findings.push(
          makeFinding(ctx.slug, {
            ...base,
            status: "unknown",
            reasonCode: "unresolved-value",
            actual: !figma.ok ? `Figma side: ${figma.reason}` : `CSS side: ${(css as { reason: string }).reason}`,
            expectedEvidence: [figmaSide],
            actualEvidence: cssSide,
          }),
        );
        continue;
      }
      const input = { ...base, expected: String(figma.value), actual: String(css.value), expectedEvidence: [figmaSide], actualEvidence: cssSide };
      findings.push(
        roleFinding(
          figma.value === css.value
            ? makeFinding(ctx.slug, { ...input, status: "pass", reasonCode: "equal" })
            : differenceFinding(ctx, { ...input, reasonCode: "different" }),
        ),
      );
    }
    const unmapped = Object.keys(roleVariable.valuesByMode).filter((mode) => !mappedModes.has(mode));
    if (unmapped.length > 0) {
      findings.push(
        makeFinding(ctx.slug, {
          category: "tokens",
          claimKey: `role-${role.claimKey}-unmapped-modes`,
          claim: `${role.description}: Figma ${roleVariable.name} modes with no mapped CSS selector`,
          status: "unknown",
          reasonCode: "unmapped",
          actual: unmapped.join(", "),
          expectedEvidence: [figmaEvidence(ctx, `variables/${roleVariable.name}`, `modes: ${Object.keys(roleVariable.valuesByMode).join(", ")}`)],
          actualEvidence: [mapEvidence_],
        }),
      );
    }
  }
  return findings;
}

// ── documentation consistency (generic) ─────────────────────────────────────

/**
 * Scope (deliberately narrow): sentences of the exact shape
 * `No [canonical] <Subject> [COMPONENT_SET/]master` where <Subject> contains the
 * component's own name. Such a sentence is an unequivocal negative claim about
 * the existence of a canonical master. Anything else — hedged, conditional or
 * about another component — is not parsed (it stays covered by the prose-only
 * unknown). The compared side is the STRUCTURED identity, never other prose.
 */
const NEGATIVE_MASTER_CLAIM = /^no\s+(?:canonical\s+)?([A-Za-z0-9 _-]*?)\s*(?:COMPONENT_SET\s*\/\s*)?master\b/i;

function squash(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function findNegativeMasterClaim(reference: string, componentName: string): string | null {
  for (const raw of reference.split(/(?<=[.;])\s+|\n+/)) {
    const sentence = raw.trim();
    const match = NEGATIVE_MASTER_CLAIM.exec(sentence);
    if (match && squash(match[1]).includes(squash(componentName))) return sentence;
  }
  return null;
}

export function compareFigmaReferenceClaims(ctx: RuleContext): AuditFinding[] {
  const reference = ctx.facts.registry.figmaReference;
  const identity = ctx.facts.registry.figmaIdentity;
  if (!reference || !identity) return [];
  const sentence = findNegativeMasterClaim(reference, ctx.facts.component.name);
  if (!sentence) return [];
  const identityText = `${identity.nodeType} ${identity.nodeId}, role ${identity.role}`;
  const input = {
    category: "documentation" as const,
    claimKey: "figma-reference-negative-master-claim",
    claim: "Registry figmaReference's explicit statement about a canonical Figma master agrees with the structured Figma identity",
    expected: identityText,
    actual: sentence.slice(0, 300),
    expectedEvidence: [
      repoEvidence(ctx, "registry", `registry:${ctx.slug}/figmaIdentity`, identityText),
      figmaEvidence(ctx, "node", `${ctx.snapshot.observed.node.type} "${ctx.snapshot.observed.node.name}" (${ctx.snapshot.observed.node.id}) observed in the snapshot`),
    ],
    actualEvidence: [repoEvidence(ctx, "registry", `registry:${ctx.slug}/figmaReference`, sentence.slice(0, 300))],
  };
  return [
    identity.role === "master"
      ? differenceFinding(ctx, { ...input, reasonCode: "documentation-contradicts-identity" })
      : makeFinding(ctx.slug, { ...input, status: "pass", reasonCode: "equal" }),
  ];
}

export const COMPARISON_RULES: ReadonlyArray<(ctx: RuleContext) => AuditFinding[]> = [
  compareIdentity,
  compareGuard,
  compareFigmaTokenDependencies,
  compareMappedProperties,
  compareDarkMode,
  compareImplementationEvidence,
  compareTokenRoles,
  compareDocumentationEvidence,
  compareFigmaReferenceClaims,
];
