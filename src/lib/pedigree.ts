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

/** Integer row for placement on a grid with 2^GENERATIONS rows, centering each
 * ancestor between the rows of the two children (in binary-tree terms) that
 * produced them. */
export function gridRow(slot: number): number {
  const generation = generationOf(slot)
  const index = indexInGeneration(slot, generation)
  const spacing = 2 ** (GENERATIONS + 1 - generation)
  const offset = 2 ** (GENERATIONS - generation) - 1
  return index * spacing + offset + 1
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
