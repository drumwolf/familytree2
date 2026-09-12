export const GENERATIONS = 5
export const TOTAL_SLOTS = 2 ** GENERATIONS - 1

export function allSlots(): number[] {
  return Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1)
}

export function generationOf(slot: number): number {
  return Math.floor(Math.log2(slot)) + 1
}

function indexInGeneration(slot: number, generation: number): number {
  return slot - 2 ** (generation - 1)
}

// In the earliest generation shown, the gap within a father/mother pair is
// smaller than the gap between different pairs.
const WITHIN_PAIR_GAP = 1.5
const BETWEEN_PAIR_GAP = 2

/** Row for placement on a grid, centering each ancestor between the rows of
 * the two children (in binary-tree terms) that produced them. In the
 * earliest generation, rows are laid out directly with a tighter gap within
 * each father/mother pair; every generation above that is simply the
 * midpoint of its two children, so the tighter spacing propagates upward
 * while the gap between different pairs stays unchanged. */
export function gridRow(slot: number): number {
  const generation = generationOf(slot)

  if (generation === GENERATIONS) {
    const index = indexInGeneration(slot, generation)
    const pair = Math.floor(index / 2)
    const withinPair = index % 2
    return 1 + pair * (WITHIN_PAIR_GAP + BETWEEN_PAIR_GAP) + withinPair * WITHIN_PAIR_GAP
  }

  return (gridRow(2 * slot) + gridRow(2 * slot + 1)) / 2
}

export function gridColumn(slot: number): number {
  return generationOf(slot)
}

/**
 * Maps a "display slot" (1..TOTAL_SLOTS, laid out as if it were its own
 * 1-rooted tree) to the true, permanent slot in storage, given which
 * absolute slot is currently being treated as the root of the view.
 *
 * This works because the subtree under any ancestor is structurally
 * identical to the whole tree: an ancestor `k` generations back from
 * absolute slot `root`, at index `i` within that generation, is always at
 * absolute slot `root * 2^k + i`.
 */
export function absoluteSlot(viewRoot: number, displaySlot: number): number {
  const k = generationOf(displaySlot) - 1
  const i = displaySlot - 2 ** k
  return viewRoot * 2 ** k + i
}

export type Lineage = 'root' | 'paternal' | 'maternal'

/** Which side of the currently-viewed root a display slot descends from. */
export function lineageOf(displaySlot: number): Lineage {
  if (displaySlot === 1) return 'root'
  let s = displaySlot
  while (s > 3) s = Math.floor(s / 2)
  return s === 2 ? 'paternal' : 'maternal'
}
