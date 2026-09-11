import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NODE_HEIGHT, NODE_WIDTH, TreeNode } from '@/components/TreeNode'
import { supabase } from '@/lib/supabase'
import { absoluteSlot, allSlots, gridColumn, gridRow, lineageOf, GENERATIONS, TOTAL_SLOTS } from '@/lib/pedigree'
import type { Person, PersonInput } from '@/lib/people'

const TRUE_ROOT = 1

const ROW_UNIT = 48
const COL_WIDTH = 320

function nodeCenter(slot: number) {
  return {
    x: (gridColumn(slot) - 1) * COL_WIDTH,
    y: (gridRow(slot) - 1) * ROW_UNIT + NODE_HEIGHT / 2,
  }
}

function connectorPath(parentOfSlot: number, ancestorSlot: number) {
  const from = nodeCenter(parentOfSlot)
  const to = nodeCenter(ancestorSlot)
  const fromX = from.x + NODE_WIDTH
  const midX = fromX + (COL_WIDTH - NODE_WIDTH) / 2
  return `M ${fromX} ${from.y} H ${midX} V ${to.y} H ${to.x}`
}

const connectors = allSlots()
  .filter((slot) => 2 * slot + 1 <= TOTAL_SLOTS)
  .flatMap((slot) => [
    { key: `${slot}-${2 * slot}`, d: connectorPath(slot, 2 * slot) },
    { key: `${slot}-${2 * slot + 1}`, d: connectorPath(slot, 2 * slot + 1) },
  ])

export function FamilyTree() {
  const [people, setPeople] = useState<Record<number, Person>>({})
  const [loading, setLoading] = useState(true)
  const [viewRoot, setViewRoot] = useState(TRUE_ROOT)
  const [history, setHistory] = useState<number[]>([])

  function handleMakeRoot(newRoot: number) {
    setHistory((prev) => [...prev, viewRoot])
    setViewRoot(newRoot)
  }

  function handleBack() {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      setViewRoot(prev[prev.length - 1])
      return prev.slice(0, -1)
    })
  }

  useEffect(() => {
    supabase
      .from('people')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
        } else if (data) {
          const bySlot: Record<number, Person> = {}
          for (const row of data) bySlot[row.slot] = row as Person
          setPeople(bySlot)
        }
        setLoading(false)
      })
  }, [])

  async function handleSave(slot: number, input: PersonInput): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 'Not signed in.'

    const { data, error } = await supabase
      .from('people')
      .upsert(
        {
          user_id: user.id,
          slot,
          full_name: input.full_name || null,
          birth_year: input.birth_year ? Number(input.birth_year) : null,
          birthplace: input.birthplace || null,
          notes: input.notes || null,
        },
        { onConflict: 'user_id,slot' },
      )
      .select()
      .single()

    if (error) {
      console.error(error)
      return error.message
    }

    setPeople((prev) => ({ ...prev, [slot]: data as Person }))
    return null
  }

  if (loading) return null

  const maxRow = Math.max(...allSlots().map(gridRow))
  const height = maxRow * ROW_UNIT
  const width = GENERATIONS * COL_WIDTH
  const rootPerson = people[viewRoot]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-3">
        <Button variant="outline" size="sm" disabled={history.length === 0} onClick={handleBack}>
          Back
        </Button>
        <span className="text-muted-foreground text-sm">
          Viewing ancestors of: {rootPerson?.full_name || 'Unnamed'}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="relative" style={{ width, height }}>
          <svg
            className="absolute top-0 left-0 text-zinc-400"
            width={width}
            height={height}
            style={{ pointerEvents: 'none' }}
          >
            {connectors.map(({ key, d }) => (
              <path key={key} d={d} stroke="currentColor" strokeWidth={1.5} fill="none" />
            ))}
          </svg>
          {allSlots().map((displaySlot) => {
            const slot = absoluteSlot(viewRoot, displaySlot)
            return (
              <TreeNode
                key={slot}
                slot={slot}
                person={people[slot]}
                left={(gridColumn(displaySlot) - 1) * COL_WIDTH}
                top={(gridRow(displaySlot) - 1) * ROW_UNIT}
                lineage={lineageOf(displaySlot)}
                onSave={handleSave}
                onMakeRoot={handleMakeRoot}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
