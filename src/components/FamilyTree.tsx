import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TreeNode } from '@/components/TreeNode'
import { supabase } from '@/lib/supabase'
import { useTreeLayout, type TreeLayout } from '@/lib/layout'
import { absoluteSlot, allSlots, gridColumn, gridRow, lineageOf, GENERATIONS, TOTAL_SLOTS } from '@/lib/pedigree'
import type { Person, PersonInput } from '@/lib/people'

const TRUE_ROOT = 1

function nodeCenter(slot: number, layout: TreeLayout) {
  return {
    x: (gridColumn(slot) - 1) * layout.colWidth,
    y: (gridRow(slot) - 1) * layout.rowUnit + layout.nodeHeight / 2,
  }
}

function connectorPath(parentOfSlot: number, ancestorSlot: number, layout: TreeLayout) {
  const from = nodeCenter(parentOfSlot, layout)
  const to = nodeCenter(ancestorSlot, layout)
  const fromX = from.x + layout.nodeWidth
  const midX = fromX + (layout.colWidth - layout.nodeWidth) / 2
  return `M ${fromX} ${from.y} H ${midX} V ${to.y} H ${to.x}`
}

function buildConnectors(layout: TreeLayout) {
  return allSlots()
    .filter((slot) => 2 * slot + 1 <= TOTAL_SLOTS)
    .flatMap((slot) => [
      { key: `${slot}-${2 * slot}`, d: connectorPath(slot, 2 * slot, layout) },
      { key: `${slot}-${2 * slot + 1}`, d: connectorPath(slot, 2 * slot + 1, layout) },
    ])
}

export function FamilyTree() {
  const [people, setPeople] = useState<Record<number, Person>>({})
  const [loading, setLoading] = useState(true)
  const [viewRoot, setViewRoot] = useState(TRUE_ROOT)
  const [history, setHistory] = useState<number[]>([])
  const layout = useTreeLayout()
  const connectors = useMemo(() => buildConnectors(layout), [layout])

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

  function upsertPerson(
    userId: string,
    slot: number,
    fields: Pick<Person, 'full_name' | 'birth_year' | 'death_year' | 'birthplace' | 'notes'>,
  ) {
    return supabase
      .from('people')
      .upsert({ user_id: userId, slot, ...fields }, { onConflict: 'user_id,slot' })
      .select()
      .single()
  }

  async function handleSave(slot: number, input: PersonInput): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 'Not signed in.'

    const { data, error } = await upsertPerson(user.id, slot, {
      full_name: input.full_name || null,
      birth_year: input.birth_year ? Number(input.birth_year) : null,
      death_year: input.death_year ? Number(input.death_year) : null,
      birthplace: input.birthplace || null,
      notes: input.notes || null,
    })

    if (error) {
      console.error(error)
      return error.message
    }

    setPeople((prev) => ({ ...prev, [slot]: data as Person }))
    return null
  }

  async function handleClear(slot: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('people').delete().eq('user_id', user.id).eq('slot', slot)
    if (error) {
      console.error(error)
      return
    }

    setPeople((prev) => {
      const next = { ...prev }
      delete next[slot]
      return next
    })
  }

  // Swaps the data between two slots. If the target is empty, the source
  // slot's row is deleted instead of swapped into (so it goes back to being
  // blank rather than holding a copy of the target's empty fields).
  async function handleMove(sourceSlot: number, targetSlot: number) {
    if (sourceSlot === targetSlot) return
    const sourcePerson = people[sourceSlot]
    if (!sourcePerson) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const targetPerson = people[targetSlot]

    const { data: newTarget, error: targetError } = await upsertPerson(user.id, targetSlot, {
      full_name: sourcePerson.full_name,
      birth_year: sourcePerson.birth_year,
      death_year: sourcePerson.death_year,
      birthplace: sourcePerson.birthplace,
      notes: sourcePerson.notes,
    })
    if (targetError) {
      console.error(targetError)
      return
    }

    if (targetPerson) {
      const { data: newSource, error: sourceError } = await upsertPerson(user.id, sourceSlot, {
        full_name: targetPerson.full_name,
        birth_year: targetPerson.birth_year,
        death_year: targetPerson.death_year,
        birthplace: targetPerson.birthplace,
        notes: targetPerson.notes,
      })
      if (sourceError) {
        console.error(sourceError)
        return
      }
      setPeople((prev) => ({ ...prev, [targetSlot]: newTarget as Person, [sourceSlot]: newSource as Person }))
      return
    }

    const { error: deleteError } = await supabase.from('people').delete().eq('user_id', user.id).eq('slot', sourceSlot)
    if (deleteError) {
      console.error(deleteError)
      return
    }
    setPeople((prev) => {
      const next = { ...prev, [targetSlot]: newTarget as Person }
      delete next[sourceSlot]
      return next
    })
  }

  if (loading) return null

  const maxRow = Math.max(...allSlots().map(gridRow))
  const height = maxRow * layout.rowUnit
  const width = GENERATIONS * layout.colWidth
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
                left={(gridColumn(displaySlot) - 1) * layout.colWidth}
                top={(gridRow(displaySlot) - 1) * layout.rowUnit}
                width={layout.nodeWidth}
                height={layout.nodeHeight}
                compact={layout.compact}
                lineage={lineageOf(displaySlot)}
                onSave={handleSave}
                onMakeRoot={handleMakeRoot}
                onMove={handleMove}
                onClear={handleClear}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
