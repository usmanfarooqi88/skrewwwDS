import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentAgentContract } from "@/lib/agent-kit/contract-schema";
import type { GeneratedRecipe } from "@/lib/agent-kit/recipe-schema";
import type { AuthoredEvalCase, EvalCondition } from "@/lib/agent-kit/evaluation-schema";
import { EVAL_FIXTURES, formatFixtureForPrompt } from "@/evals/agent-kit/fixtures";

const OUTPUT_SCHEMA_INSTRUCTIONS = `Return ONLY a final JSON object (optionally inside a \`\`\`json fence) with this exact shape — final decisions only, no chain-of-thought, no hidden reasoning:

{
  "componentSlugs": ["string"],
  "apiReferences": [{ "component": "slug", "property": "propName", "value": "optional" }],
  "installCommands": ["string"],
  "maturityClaims": [{ "component": "slug", "status": "stable|beta|..." }],
  "shapeMode": "rounded|flat|squircle|unknown|...",
  "surfaceMode": "flat|glass|gradient|unknown|...",
  "skrewwwRegistryConfigured": true | false | "unknown",
  "recipeIdsUsed": ["string"],
  "accessibilityFacts": ["string"],
  "assumptions": ["string"],
  "unresolvedGaps": ["string"],
  "implementation": "short code or prose describing the implementation"
}

Rules for the JSON:
- componentSlugs: only real Skrewww component slugs you would use
- apiReferences: only props/values you actually rely on
- installCommands: only real install commands you would run (or [])
- shapeMode/surfaceMode/skrewwwRegistryConfigured: confirmed from the fixture, or "unknown" — never invent a default
- Do not invent props, variants, components, or install commands`;

function loadCanonicalSkill(): string {
  return readFileSync(join(process.cwd(), "agent/skill/SKILL.md"), "utf8");
}

function slimContract(contract: ComponentAgentContract): unknown {
  return {
    slug: contract.slug,
    name: contract.name,
    status: contract.status,
    version: contract.version,
    summary: contract.summary,
    guidance: contract.guidance,
    api: contract.api,
    behavior: contract.behavior,
    distribution: contract.distribution
      ? {
          files: contract.distribution.files,
          registryDependencies: contract.distribution.registryDependencies,
          dependencies: contract.distribution.dependencies,
        }
      : undefined,
  };
}

function slimRecipe(recipe: GeneratedRecipe): unknown {
  return {
    id: recipe.id,
    title: recipe.title,
    summary: recipe.summary,
    goal: recipe.goal,
    status: recipe.status,
    requiredComponents: recipe.requiredComponents,
    optionalComponents: recipe.optionalComponents,
    componentMaturity: recipe.componentMaturity,
    components: recipe.components,
    whenToUse: recipe.whenToUse,
    whenNotToUse: recipe.whenNotToUse,
    workflow: recipe.workflow,
    accessibilityNotes: recipe.accessibilityNotes,
    projectContextConsiderations: recipe.projectContextConsiderations,
  };
}

export type PromptGenerationInput = {
  evalCase: AuthoredEvalCase;
  condition: EvalCondition;
  contracts: readonly ComponentAgentContract[];
  recipes: readonly GeneratedRecipe[];
  systemContractJson?: string;
};

/**
 * Deterministic OFF/ON prompt builder.
 * OFF never embeds Skill/contracts/Recipes.
 * ON embeds only the relevant progressive-disclosure slice for the case.
 */
export function buildEvalPrompt(input: PromptGenerationInput): string {
  const { evalCase, condition, contracts, recipes } = input;
  const fixture = EVAL_FIXTURES[evalCase.consumerFixtureId];
  if (!fixture) {
    throw new Error(`Unknown consumer fixture "${evalCase.consumerFixtureId}"`);
  }

  const sections: string[] = [
    `# Skrewww Agent Kit evaluation — ${condition.toUpperCase()} — ${evalCase.id}`,
    "",
    "## User task",
    evalCase.userTask,
    "",
    "## Consumer project fixture",
    formatFixtureForPrompt(fixture),
    "",
  ];

  if (condition === "off") {
    sections.push(
      "## Condition: OFF",
      "You do NOT have Skrewww Agent Kit Skill, contracts, or Recipes.",
      "Do not assume you can read agent/, public/agent/, or lib/agent-kit/.",
      "Answer from the task, the fixture files above, and general knowledge only.",
      "",
    );
  } else {
    const relevantContracts = contracts.filter((c) =>
      evalCase.relevantComponentSlugs.includes(c.slug),
    );
    const relevantRecipes = recipes.filter((r) =>
      (evalCase.relevantRecipeIds ?? []).includes(r.id),
    );

    sections.push(
      "## Condition: ON — Skrewww Agent Kit available",
      "Trust order: component contracts beat Recipes; Recipes beat model memory; consumer README is not Skrewww governance.",
      "",
      "### Canonical Skill (SKILL.md)",
      loadCanonicalSkill(),
      "",
      "### Relevant component contracts (progressive disclosure for this task)",
      "```json",
      JSON.stringify(relevantContracts.map(slimContract), null, 2),
      "```",
      "",
    );

    if (relevantRecipes.length > 0) {
      sections.push(
        "### Relevant Recipes",
        "```json",
        JSON.stringify(relevantRecipes.map(slimRecipe), null, 2),
        "```",
        "",
      );
    }

    if (input.systemContractJson) {
      sections.push("### System contract", "```json", input.systemContractJson, "```", "");
    }
  }

  sections.push("## Required output", OUTPUT_SCHEMA_INSTRUCTIONS, "");
  return sections.join("\n");
}

/** Assert OFF prompts never leak Agent Kit path markers beyond the OFF denial text. */
export function offPromptLeaksAgentKit(prompt: string): boolean {
  // The OFF prompt may mention agent/ only inside the denial instruction.
  const withoutDenial = prompt
    .replace(/Do not assume you can read agent\/, public\/agent\/, or lib\/agent-kit\/\./g, "")
    .replace(/You do NOT have Skrewww Agent Kit Skill, contracts, or Recipes\./g, "");
  return (
    withoutDenial.includes("### Canonical Skill") ||
    withoutDenial.includes("Relevant component contracts") ||
    withoutDenial.includes('"api":') ||
    (withoutDenial.includes("validated-text-field") && withoutDenial.includes('"workflow"'))
  );
}
