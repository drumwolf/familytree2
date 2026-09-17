import { Crosshair } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Lineage } from '@/lib/pedigree'
import type { Person, PersonInput } from '@/lib/people'
import { cn } from '@/lib/utils'

export const NODE_WIDTH = 250
export const NODE_HEIGHT = 60

const LINEAGE_STYLES: Record<Lineage, string> = {
  root: 'bg-gray-200 hover:bg-gray-300',
  paternal: 'bg-red-100 hover:bg-red-200',
  maternal: 'bg-blue-100 hover:bg-blue-200',
}

function blankInput(person: Person | undefined): PersonInput {
  return {
    full_name: person?.full_name ?? '',
    birth_year: person?.birth_year?.toString() ?? '',
    death_year: person?.death_year?.toString() ?? '',
    birthplace: person?.birthplace ?? '',
    notes: person?.notes ?? '',
  }
}

export function TreeNode({
  slot,
  person,
  left,
  top,
  lineage,
  onSave,
  onMakeRoot,
  onMove,
  onClear,
}: {
  slot: number
  person: Person | undefined
  left: number
  top: number
  lineage: Lineage
  onSave: (slot: number, input: PersonInput) => Promise<string | null>
  onMakeRoot: (slot: number) => void
  onMove: (sourceSlot: number, targetSlot: number) => void
  onClear: (slot: number) => void
}) {
  const isRoot = lineage === 'root'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PersonInput>(() => blankInput(person))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) setForm(blankInput(person))
    setError(null)
    setConfirmingClear(false)
    setOpen(next)
  }

  function handleClear() {
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }
    setOpen(false)
    onClear(slot)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const errorMessage = await onSave(slot, form)
    setSaving(false)
    if (errorMessage) {
      setError(errorMessage)
      return
    }
    setOpen(false)
  }

  const isEmpty =
    !person?.full_name && !person?.birth_year && !person?.death_year && !person?.birthplace && !person?.notes

  const trigger = (
    <PopoverTrigger
      className={cn(
        'flex h-full w-full flex-col justify-center overflow-hidden rounded-lg border border-zinc-400 px-3 py-1 text-left shadow-sm transition-colors',
        LINEAGE_STYLES[lineage],
        isEmpty && 'items-center justify-center',
        isDragging && 'opacity-40',
      )}
      draggable={!isEmpty}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(slot))
        e.dataTransfer.effectAllowed = 'move'
        setIsDragging(true)
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      {isEmpty ? (
        <span className="text-muted-foreground text-xl">?</span>
      ) : (
        <>
          <span className="truncate text-sm font-medium">{person?.full_name || '-'}</span>
          <span className="text-muted-foreground truncate text-xs">
            {[
              [person.birth_year, person.death_year].filter(Boolean).join('–'),
              person.birthplace,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </>
      )}
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div
        className={cn('absolute', isDropTarget && 'rounded-lg ring-2 ring-primary ring-offset-1')}
        style={{ left, top, width: NODE_WIDTH, height: NODE_HEIGHT }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDragEnter={() => setIsDropTarget(true)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsDropTarget(false)
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDropTarget(false)
          const sourceSlot = Number(e.dataTransfer.getData('text/plain'))
          if (!Number.isNaN(sourceSlot)) onMove(sourceSlot, slot)
        }}
      >
        {person?.notes ? (
          <Tooltip>
            <TooltipTrigger render={trigger} />
            <TooltipContent side="right" className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900">
              {person.notes}
            </TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        {!isRoot && (
          <button
            type="button"
            draggable={false}
            aria-label="Make root ancestor"
            title="Make root ancestor"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onMakeRoot(slot)
            }}
            className="absolute top-1/2 right-[10px] -translate-y-1/2 rounded-md bg-white/70 p-1.5 text-zinc-600 shadow-sm transition-colors hover:bg-white hover:text-zinc-900 dark:bg-black/40 dark:text-zinc-300 dark:hover:bg-black/60"
          >
            <Crosshair className="size-4" />
          </button>
        )}
      </div>
      <PopoverContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${slot}`}>Full name</Label>
            <Input
              id={`name-${slot}`}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`year-${slot}`}>Birth year</Label>
            <Input
              id={`year-${slot}`}
              type="number"
              inputMode="numeric"
              value={form.birth_year}
              onChange={(e) => setForm({ ...form, birth_year: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`death-year-${slot}`}>Death year</Label>
            <Input
              id={`death-year-${slot}`}
              type="number"
              inputMode="numeric"
              value={form.death_year}
              onChange={(e) => setForm({ ...form, death_year: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`place-${slot}`}>Birthplace</Label>
            <Input
              id={`place-${slot}`}
              value={form.birthplace}
              onChange={(e) => setForm({ ...form, birthplace: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`notes-${slot}`}>Notes</Label>
            <Textarea
              id={`notes-${slot}`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            {!isEmpty && (
              <Button type="button" variant="destructive" onClick={handleClear} className="flex-1">
                {confirmingClear ? 'Confirm clear' : 'Clear'}
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
