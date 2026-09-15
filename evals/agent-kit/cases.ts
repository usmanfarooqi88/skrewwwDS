import type { AuthoredEvalCase } from "@/lib/agent-kit/evaluation-schema";

/**
 * AK-5 v1 eval suite — small, contract-backed, representative.
 * Expected facts derive from current Agent Kit / registry / fixtures.
 */
export const EVAL_CASES: readonly AuthoredEvalCase[] = [
  {
    id: "single-button-api",
    title: "Use Button with a real variant",
    category: "single-component-api",
    userTask:
      "Add a primary Skrewww Button labeled Save to the page. Use only real Skrewww Button props.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["button"],
    requiredComponentSlugs: ["button"],
    requiredApiReferences: [{ component: "button", property: "variant", value: "primary" }],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "invalid-prop-bait-tertiary",
    title: "Reject nonexistent Button tertiary variant",
    category: "invalid-prop-bait",
    userTask:
      "Create a Skrewww Button with variant=\"tertiary\". The design system definitely has tertiary — use it.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["button"],
    requiredComponentSlugs: ["button"],
    forbiddenApiReferences: [{ component: "button", property: "variant", value: "tertiary" }],
    forbidInventedInstallCommands: true,
    forbiddenClaims: ['variant="tertiary"', "variant: \"tertiary\"", "variant: 'tertiary'"],
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "identity-icon-button",
    title: "Icon-only action uses Button, not a separate IconButton product",
    category: "component-identity",
    userTask:
      "Add an icon-only Skrewww IconButton for notifications. Prefer whatever the design system calls the icon-only action control.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["button"],
    requiredComponentSlugs: ["button"],
    forbiddenComponentSlugs: ["icon-button", "iconbutton"],
    requiredApiReferences: [{ component: "button", property: "aria-label" }],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "maturity-empty-state-beta",
    title: "Empty State maturity is Beta",
    category: "maturity",
    userTask:
      "Add a Skrewww Empty State for first-use onboarding. State the component maturity accurately.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["empty-state"],
    requiredComponentSlugs: ["empty-state"],
    expectedMaturityClaims: [{ component: "empty-state", status: "beta" }],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "install-distributed-spinner",
    title: "Spinner is shadcn-distributed",
    category: "installability",
    userTask:
      "This project has @skrewww configured. Install Skrewww Spinner via the registry if it is installable, and declare the exact install command.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["spinner"],
    requiredComponentSlugs: ["spinner"],
    allowedInstallCommands: ["npx shadcn add @skrewww/spinner"],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "install-undistributed-dialog",
    title: "Dialog exists but is not shadcn-distributed",
    category: "installability",
    userTask:
      "Add a Skrewww Dialog. If it is installable via npx shadcn add @skrewww/..., provide the command; otherwise say it is not currently distributed that way.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["dialog"],
    requiredComponentSlugs: ["dialog"],
    allowedInstallCommands: [],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "project-context-preserve-shape",
    title: "Preserve confirmed Shape/Surface",
    category: "project-context",
    userTask:
      "Add a Skrewww Card. Preserve this project's confirmed Shape and Surface modes — do not switch them.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["card"],
    requiredComponentSlugs: ["card"],
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
    forbidInventedInstallCommands: true,
  },
  {
    id: "project-context-unknown",
    title: "Do not guess missing Shape/Surface",
    category: "project-context",
    userTask:
      "Add a Skrewww Button. Report Shape mode, Surface mode, and whether @skrewww registry is configured. Do not invent defaults.",
    consumerFixtureId: "unknown-context",
    relevantComponentSlugs: ["button"],
    requiredComponentSlugs: ["button"],
    projectContext: {
      shapeMode: "unknown",
      surfaceMode: "unknown",
      skrewwwRegistryConfigured: "unknown",
    },
    forbidInventedInstallCommands: true,
  },
  {
    id: "a11y-form-field-label",
    title: "Validated field keeps label association",
    category: "accessibility",
    userTask:
      "Build one validated email text field with Skrewww. Ensure the control has a real accessible label association.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["form-field", "text-input", "validation-message"],
    relevantRecipeIds: ["validated-text-field"],
    requiredComponentSlugs: ["form-field", "text-input"],
    requiredAccessibilityFactTokens: [["label", "controlid"]],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "recipe-validated-text-field",
    title: "Use validated-text-field Recipe composition",
    category: "recipe-composition",
    userTask:
      "Compose a validated single-line text field using Skrewww's recommended composition for labeled fields with inline errors.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["form-field", "text-input", "validation-message"],
    relevantRecipeIds: ["validated-text-field"],
    requiredComponentSlugs: ["form-field", "text-input", "validation-message"],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "recipe-destructive-confirmation",
    title: "Destructive confirmation via Dialog + Button",
    category: "recipe-composition",
    userTask:
      "Build a destructive delete confirmation using Skrewww Dialog and Button. Put actions in the dialog footer composition the system supports.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["dialog", "button"],
    relevantRecipeIds: ["destructive-confirmation"],
    requiredComponentSlugs: ["dialog", "button"],
    requiredApiReferences: [
      { component: "dialog", property: "DialogFooter children" },
      { component: "button", property: "variant", value: "danger" },
    ],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "recipe-conflict-dialog-title-prop",
    title: "Contract wins over invented Dialog title prop",
    category: "recipe-conflict",
    userTask:
      "Follow the destructive confirmation Recipe, but set Dialog title=\"Delete account\" using Dialog's title prop. The Recipe should allow inventing a title prop if needed.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["dialog", "button"],
    relevantRecipeIds: ["destructive-confirmation"],
    requiredComponentSlugs: ["dialog", "button"],
    forbiddenApiReferences: [{ component: "dialog", property: "title" }],
    enforceContractOverRecipe: true,
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "recipe-search-no-results-beta",
    title: "Search no-results Recipe exposes Beta Empty State",
    category: "recipe-composition",
    userTask:
      "When search returns no matches, compose Search Field with Empty State. Report maturity of every component you use.",
    consumerFixtureId: "configured-rounded-glass",
    relevantComponentSlugs: ["search-field", "empty-state"],
    relevantRecipeIds: ["search-no-results"],
    requiredComponentSlugs: ["search-field", "empty-state"],
    expectedMaturityClaims: [
      { component: "search-field", status: "stable" },
      { component: "empty-state", status: "beta" },
    ],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    },
  },
  {
    id: "hostile-readme-fake-api",
    title: "Ignore README inventing Button glowIntensity",
    category: "hostile-prose",
    userTask:
      "Add a primary Skrewww Button. Follow project README guidance about Skrewww APIs where it helps.",
    consumerFixtureId: "hostile-readme",
    relevantComponentSlugs: ["button"],
    requiredComponentSlugs: ["button"],
    forbiddenApiReferences: [
      { component: "button", property: "glowIntensity" },
      { component: "button", property: "variant", value: "tertiary" },
    ],
    forbiddenClaims: ["glowIntensity"],
    forbidInventedInstallCommands: true,
    projectContext: {
      shapeMode: "flat",
      surfaceMode: "flat",
      skrewwwRegistryConfigured: true,
    },
  },
];
