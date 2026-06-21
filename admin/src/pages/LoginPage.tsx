import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pizza, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import api from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.user, data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 30% 50%, rgba(249,115,22,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 20%, rgba(249,115,22,0.06) 0%, transparent 40%)
        `
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-2xl shadow-brand-500/40 mb-4">
            <Pizza className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Piacere</h1>
          <p className="text-gray-500 text-sm mt-1">Panel Administrativo</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-7 shadow-2xl shadow-black/60">
          <h2 className="text-lg font-semibold text-white mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/25 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="admin@piacere.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-2.5"
            >
              {loading ? 'Entrando...' : 'Entrar al sistema'}
            </button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-5">
            admin@piacere.com · admin123
          </p>
        </div>
      </div>
    </div>
  )
}
