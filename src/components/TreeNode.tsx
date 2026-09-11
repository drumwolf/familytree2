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
import type { Person, PersonInput } from '@/lib/people'
import { cn } from '@/lib/utils'

export const NODE_WIDTH = 250
export const NODE_HEIGHT = 60

function blankInput(person: Person | undefined): PersonInput {
  return {
    full_name: person?.full_name ?? '',
    birth_year: person?.birth_year?.toString() ?? '',
    birthplace: person?.birthplace ?? '',
    notes: person?.notes ?? '',
  }
}

export function TreeNode({
  slot,
  person,
  left,
  top,
  isRoot,
  onSave,
  onMakeRoot,
}: {
  slot: number
  person: Person | undefined
  left: number
  top: number
  isRoot: boolean
  onSave: (slot: number, input: PersonInput) => Promise<string | null>
  onMakeRoot: (slot: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PersonInput>(() => blankInput(person))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) setForm(blankInput(person))
    setError(null)
    setOpen(next)
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

  const isEmpty = !person?.full_name

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          'absolute flex flex-col justify-center overflow-hidden rounded-lg border border-zinc-400 bg-blue-50 px-3 py-1 text-left shadow-sm transition-colors hover:bg-blue-100',
          isEmpty && 'items-center justify-center',
        )}
        style={{ left, top, width: NODE_WIDTH, height: NODE_HEIGHT }}
      >
        {isEmpty ? (
          <span className="text-muted-foreground text-xl">?</span>
        ) : (
          <>
            <span className="truncate text-sm font-medium">{person.full_name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {[person.birth_year, person.birthplace].filter(Boolean).join(' · ')}
            </span>
          </>
        )}
      </PopoverTrigger>
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
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {!isRoot && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onMakeRoot(slot)
                setOpen(false)
              }}
            >
              Make root ancestor
            </Button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  )
}
