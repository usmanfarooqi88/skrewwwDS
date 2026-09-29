/* global figma */
/**
 * Skrewww AG-1B — read-only Figma capture (TRANSPORT layer).
 *
 * Runs INSIDE the Figma plugin runtime (for example via the Figma Desktop
 * Bridge's `figma_execute`), not in Node — repo code cannot call the bridge.
 * It only reads: no node, variable, or style is created or modified.
 *
 * Output is RAW facts shaped as `RawFigmaCapture` (lib/figma-snapshot/raw-capture.ts).
 * Sorting, grouping and derivation happen in the repo
 * (lib/figma-snapshot/normalize.ts), never here.
 *
 * Usage in the plugin runtime:
 *   <paste this file>
 *   return await captureSkrewwwFigmaNodes([{ slug, fileKey, nodeId }, ...]);
 */
const SKREWWW_FIGMA_CAPTURE_VERSION = "1.0.0";

// Invoked from the plugin runtime — see usage above.
async function captureSkrewwwFigmaNodes(targets) {
  const variables = {};
  const collections = {};
  const styles = {};

  const round = (n) => (typeof n === "number" ? Math.round(n * 10000) / 10000 : n);

  function literal(value) {
    if (value && typeof value === "object" && "r" in value) {
      return { r: round(value.r), g: round(value.g), b: round(value.b), a: round(value.a ?? 1) };
    }
    return typeof value === "number" ? round(value) : value;
  }

  async function describeCollection(id) {
    if (collections[id]) return collections[id];
    const c = await figma.variables.getVariableCollectionByIdAsync(id);
    collections[id] = c ? { name: c.name, modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })) } : null;
    return collections[id];
  }

  async function describeVariable(id) {
    if (id in variables) return;
    variables[id] = null;
    const v = await figma.variables.getVariableByIdAsync(id);
    if (!v) return;
    const collection = await describeCollection(v.variableCollectionId);
    const valuesByMode = {};
    for (const mode of collection ? collection.modes : []) {
      const value = v.valuesByMode[mode.modeId];
      if (value && typeof value === "object" && value.type === "VARIABLE_ALIAS") {
        const target = await figma.variables.getVariableByIdAsync(value.id);
        valuesByMode[mode.name] = { alias: target ? target.name : null, aliasId: value.id };
      } else {
        valuesByMode[mode.name] = literal(value);
      }
    }
    variables[id] = {
      name: v.name,
      resolvedType: v.resolvedType,
      collectionId: v.variableCollectionId,
      collectionName: collection ? collection.name : null,
      valuesByMode,
    };
  }

  async function describeStyle(id) {
    if (!id || typeof id !== "string") return null;
    if (!(id in styles)) {
      const s = await figma.getStyleByIdAsync(id);
      styles[id] = s ? s.name : null;
    }
    return styles[id];
  }

  // Sibling-disambiguated layer path, stable for an unchanged file.
  function childSegment(parent, child) {
    const same = parent.children.filter((c) => c.name === child.name);
    return same.length > 1 ? `${child.name}[${same.indexOf(child)}]` : child.name;
  }

  const SKIP_NODE_LEVEL_KEYS = new Set(["fills", "strokes", "effects", "componentProperties", "textRangeFills"]);

  async function collectPaintBindings(node, kind, path, withinInstance, out) {
    const paints = node[kind];
    if (!Array.isArray(paints)) return;
    for (let i = 0; i < paints.length; i++) {
      const p = paints[i];
      if (p.boundVariables && p.boundVariables.color) {
        await describeVariable(p.boundVariables.color.id);
        out.push({ path, property: `${kind}[${i}].color`, variableId: p.boundVariables.color.id, withinInstance });
      }
      for (let s = 0; s < (p.gradientStops || []).length; s++) {
        const stop = p.gradientStops[s];
        if (stop.boundVariables && stop.boundVariables.color) {
          await describeVariable(stop.boundVariables.color.id);
          out.push({ path, property: `${kind}[${i}].gradientStops[${s}].color`, variableId: stop.boundVariables.color.id, withinInstance });
        }
      }
    }
  }

  async function walk(node, path, withinInstance, acc) {
    for (const [key, value] of Object.entries(node.boundVariables || {})) {
      if (SKIP_NODE_LEVEL_KEYS.has(key)) continue;
      const aliases = Array.isArray(value) ? value : [value];
      for (let i = 0; i < aliases.length; i++) {
        if (!aliases[i] || !aliases[i].id) continue;
        await describeVariable(aliases[i].id);
        acc.bindings.push({ path, property: Array.isArray(value) ? `${key}[${i}]` : key, variableId: aliases[i].id, withinInstance });
      }
    }
    await collectPaintBindings(node, "fills", path, withinInstance, acc.bindings);
    await collectPaintBindings(node, "strokes", path, withinInstance, acc.bindings);
    for (let i = 0; i < (node.effects || []).length; i++) {
      for (const [field, alias] of Object.entries(node.effects[i].boundVariables || {})) {
        await describeVariable(alias.id);
        acc.bindings.push({ path, property: `effects[${i}].${field}`, variableId: alias.id, withinInstance });
      }
    }
    if (node.type === "TEXT") {
      const styleId = node.textStyleId;
      acc.textStyles.push({
        path,
        withinInstance,
        styleName: typeof styleId === "string" ? await describeStyle(styleId) : null,
        mixed: typeof styleId !== "string",
      });
    }
    let nextWithin = withinInstance;
    if (node.type === "INSTANCE" && path !== "") {
      const main = await node.getMainComponentAsync();
      const set = main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
      acc.instances.push({
        path,
        withinInstance,
        visible: node.visible,
        mainComponentId: main ? main.id : null,
        mainComponentName: main ? main.name : null,
        componentSetId: set ? set.id : null,
        componentSetName: set ? set.name : null,
        remote: main ? main.remote : null,
        variantProperties: node.variantProperties || null,
      });
      nextWithin = path;
    }
    if ("children" in node) {
      for (const child of node.children) {
        const segment = childSegment(node, child);
        await walk(child, path ? `${path} > ${segment}` : segment, nextWithin, acc);
      }
    }
  }

  function layoutOf(node) {
    const radius = node.cornerRadius;
    return {
      layoutMode: node.layoutMode ?? null,
      itemSpacing: node.layoutMode && node.layoutMode !== "NONE" ? round(node.itemSpacing) : null,
      padding:
        node.layoutMode && node.layoutMode !== "NONE"
          ? [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].map(round)
          : null,
      primaryAxisSizingMode: node.primaryAxisSizingMode ?? null,
      counterAxisSizingMode: node.counterAxisSizingMode ?? null,
      primaryAxisAlignItems: node.primaryAxisAlignItems ?? null,
      counterAxisAlignItems: node.counterAxisAlignItems ?? null,
      cornerRadius:
        typeof radius === "number"
          ? round(radius)
          : [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius].map(round),
      strokeWeight: typeof node.strokeWeight === "number" ? round(node.strokeWeight) : null,
      strokeAlign: node.strokeAlign ?? null,
      clipsContent: node.clipsContent ?? null,
      width: round(node.width),
      height: round(node.height),
      fillTypes: Array.isArray(node.fills) ? node.fills.map((p) => p.type) : [],
      strokeTypes: Array.isArray(node.strokes) ? node.strokes.map((p) => p.type) : [],
      effectTypes: (node.effects || []).map((e) => e.type),
    };
  }

  async function captureRoot(root) {
    const acc = { bindings: [], textStyles: [], instances: [] };
    await walk(root, "", null, acc);
    return {
      id: root.id,
      name: root.name,
      variantProperties: root.variantProperties || null,
      explicitVariableModes: root.explicitVariableModes || {},
      layout: layoutOf(root),
      children: ("children" in root ? root.children : []).map((c) => ({ name: c.name, type: c.type, visible: c.visible })),
      ...acc,
    };
  }

  const results = [];
  for (const target of targets) {
    // Node IDs are only unique within a file (Free shares IDs with Pro), so
    // never read a target from a file other than the one it names.
    if (target.fileKey !== figma.fileKey) {
      results.push({ target, fileKey: figma.fileKey, node: null, error: "file-key-mismatch" });
      continue;
    }
    const node = await figma.getNodeByIdAsync(target.nodeId);
    if (!node) {
      results.push({ target, fileKey: figma.fileKey, node: null, error: "node-not-found" });
      continue;
    }
    let page = node;
    while (page && page.type !== "PAGE") page = page.parent;
    const roots = node.type === "COMPONENT_SET" ? node.children.filter((c) => c.type === "COMPONENT") : [node];
    const capturedRoots = [];
    for (const root of roots) capturedRoots.push(await captureRoot(root));
    const definitions = {};
    for (const [key, def] of Object.entries(node.componentPropertyDefinitions || {})) {
      definitions[key] = {
        type: def.type,
        defaultValue: def.defaultValue,
        variantOptions: def.variantOptions || null,
      };
    }
    results.push({
      target,
      fileKey: figma.fileKey,
      node: {
        id: node.id,
        type: node.type,
        name: node.name,
        description: node.description || "",
        pageName: page ? page.name : null,
        parent: node.parent ? { id: node.parent.id, type: node.parent.type, name: node.parent.name } : null,
        componentPropertyDefinitions: definitions,
        roots: capturedRoots,
      },
    });
  }

  return {
    captureVersion: SKREWWW_FIGMA_CAPTURE_VERSION,
    fileKey: figma.fileKey,
    fileName: figma.root.name,
    targets: results,
    variables,
    collections,
  };
}
