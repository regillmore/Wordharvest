import type { WorldTarget } from '../core/worldTargets';

export function visibleWorldLabelTargets(targets: readonly WorldTarget[]): WorldTarget[] {
  return targets.filter((target) => target.action.kind !== 'open-menu');
}
