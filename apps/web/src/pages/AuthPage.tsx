import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setDone(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1>Kolla din e-post</h1>
          <p>Vi har skickat en bekräftelselänk till {email}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#007aff" />
            <path d="M12 28L20 12L28 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 22h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1>{mode === 'login' ? 'Logga in' : 'Skapa konto'}</h1>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label>Namn</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ditt namn"
                required
              />
            </div>
          )}
          <div className={styles.field}>
            <label>E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@example.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Vänta...' : mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
        </form>
        <p className={styles.toggle}>
          {mode === 'login' ? 'Inget konto? ' : 'Har du redan ett konto? '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Skapa konto' : 'Logga in'}
          </button>
        </p>
      </div>
    </div>
  )
}
