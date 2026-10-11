import { CCV_MODES, CCV_MODES_BY_DISTRIBUTION, type CcvDistribution, type CcvMode } from "@/lib/ccv/types";

/**
 * CCV-5 — the one place a CLI flag becomes a mode. Modes are never substituted for
 * each other: a flag naming a mode of the other distribution, or an unknown mode,
 * is a usage error, and the default is always the LOCAL mode (a public mode is an
 * explicit opt-in because it touches the network and proves a different thing).
 */

export const PUBLIC_MODES: readonly CcvMode[] = ["PUBLIC_REGISTRY", "PUBLIC_NPM"];
export const isPublicMode = (mode: CcvMode): boolean => PUBLIC_MODES.includes(mode);

export type ModeSelection = { ok: true; mode: CcvMode; public: boolean } | { ok: false; message: string };

export function selectMode(distribution: CcvDistribution, flag: string | undefined): ModeSelection {
  const available = CCV_MODES_BY_DISTRIBUTION[distribution];
  const requested = flag ?? available[0];
  if (!(CCV_MODES as readonly string[]).includes(requested)) {
    return { ok: false, message: `unknown mode ${requested}; ${distribution} supports ${available.join(", ")}` };
  }
  const mode = requested as CcvMode;
  if (!available.includes(mode)) {
    const owner = (Object.keys(CCV_MODES_BY_DISTRIBUTION) as CcvDistribution[]).find((candidate) => CCV_MODES_BY_DISTRIBUTION[candidate].includes(mode));
    return { ok: false, message: `mode ${mode} belongs to the ${owner} distribution; ${distribution} supports ${available.join(", ")}` };
  }
  return { ok: true, mode, public: isPublicMode(mode) };
}
