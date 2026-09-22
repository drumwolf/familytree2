import { useMediaQuery } from '@/lib/use-media-query'

// Below this viewport width (covers iPad portrait/landscape) we switch to the
// compact size preset instead of trying to scale the desktop one down.
const COMPACT_BREAKPOINT = '(max-width: 1180px)'

export type TreeLayout = {
  compact: boolean
  nodeWidth: number
  nodeHeight: number
  rowUnit: number
  colWidth: number
}

const DESKTOP_LAYOUT: TreeLayout = {
  compact: false,
  nodeWidth: 250,
  nodeHeight: 60,
  rowUnit: 48,
  colWidth: 320,
}

const COMPACT_LAYOUT: TreeLayout = {
  compact: true,
  nodeWidth: 160,
  nodeHeight: 46,
  rowUnit: 34,
  colWidth: 195,
}

export function useTreeLayout(): TreeLayout {
  const isCompact = useMediaQuery(COMPACT_BREAKPOINT)
  return isCompact ? COMPACT_LAYOUT : DESKTOP_LAYOUT
}
