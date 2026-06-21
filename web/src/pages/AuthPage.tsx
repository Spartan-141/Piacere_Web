import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pizza } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post(mode === 'login' ? '/auth/login' : '/auth/register', form)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-brand-500 rounded-2xl items-center justify-center mb-4 shadow-xl shadow-brand-500/30">
            <Pizza className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
          </h1>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          {/* Mode toggle */}
          <div className="flex bg-stone-950 rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === m ? 'bg-brand-500 text-white shadow' : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/15 border border-red-500/25 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-stone-500 mb-1.5">Nombre completo</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} required
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
            )}
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Correo electrónico</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Contraseña</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <button type="submit" disabled={loading} className="btn-cta w-full py-2.5 mt-2">
              {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear mi cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
