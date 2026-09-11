import { FamilyTree } from '@/components/FamilyTree'
import { LoginForm } from '@/components/LoginForm'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

function App() {
  const { session, loading } = useAuth()

  if (loading) return null

  if (!session) return <LoginForm />

  return (
    <div className="flex h-svh flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-medium">Family Tree</h1>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <FamilyTree />
      </div>
    </div>
  )
}

export default App
