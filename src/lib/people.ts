export interface Person {
  id: string
  slot: number
  full_name: string | null
  birth_year: number | null
  death_year: number | null
  birthplace: string | null
  notes: string | null
}

export interface PersonInput {
  full_name: string
  birth_year: string
  death_year: string
  birthplace: string
  notes: string
}
