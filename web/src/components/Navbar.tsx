import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, Pizza } from 'lucide-react'
import { useWebCartStore } from '../store/useWebCartStore'

export default function Navbar() {
  const { count, setOpen } = useWebCartStore()
  const total = count()

  return (
    <nav className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Pizza className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif font-bold text-xl text-white">Piacere</span>
        </Link>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-6">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-brand-400 text-sm font-medium' : 'nav-link'}>Inicio</NavLink>
          <NavLink to="/menu" className={({ isActive }) => isActive ? 'text-brand-400 text-sm font-medium' : 'nav-link'}>Menú</NavLink>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-stone-400 hover:text-white transition-colors hidden sm:block">
            Iniciar sesión
          </Link>
          <button
            id="cart-button"
            onClick={() => setOpen(true)}
            className="relative w-9 h-9 bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 rounded-full flex items-center justify-center transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-brand-400" />
            {total > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {total > 9 ? '9+' : total}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
