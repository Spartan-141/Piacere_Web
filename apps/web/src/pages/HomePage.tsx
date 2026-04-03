import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Star, Bike, Clock, Trophy } from 'lucide-react'
import { Product, Combo } from '@piacere/types'
import { useWebCartStore } from '../store/useWebCartStore'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useWebCartStore()
  const mainVariant = product.variants?.[1] ?? product.variants?.[0] ?? null // Mediana por defecto

  return (
    <div className="product-card group">
      <div className="h-40 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center text-5xl">
        🍕
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors">{product.name}</h3>
        {product.description && (
          <p className="text-stone-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-xs text-stone-600">Desde</span>
            <p className="text-brand-400 font-bold text-lg">
              ${(product.basePrice + (product.variants?.[0]?.priceDelta ?? 0)).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => addItem(product, mainVariant)}
            className="w-9 h-9 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-brand-500/30"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ComboCard({ combo }: { combo: Combo }) {
  return (
    <div className="relative bg-gradient-to-br from-brand-900/40 to-stone-900 border border-brand-500/20 rounded-2xl p-5 hover:border-brand-500/40 transition-all">
      <div className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">COMBO</div>
      <div className="text-3xl mb-3">🎉</div>
      <h3 className="font-bold text-white text-lg">{combo.name}</h3>
      <p className="text-stone-400 text-sm mt-1">{combo.description}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {combo.items?.map((item: any) => (
          <span key={item.id} className="text-xs bg-white/5 text-stone-500 px-2 py-0.5 rounded">
            {item.quantity}× {item.productName || item.product_name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-brand-400 font-bold text-xl">${combo.price.toFixed(2)}</p>
        <button className="btn-cta text-sm py-2 px-4">Pedir</button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['web-products'],
    queryFn: () => api.get('/menu/products?web=true').then(r => r.data),
  })

  const { data: combos = [] } = useQuery<Combo[]>({
    queryKey: ['web-combos'],
    queryFn: () => api.get('/menu/combos?web=true').then(r => r.data),
  })

  const pizzas = products.filter((p: any) => p.category_name === 'Pizzas').slice(0, 8)

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 60% 50%, rgba(249,115,22,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(249,115,22,0.08) 0%, transparent 40%)',
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-500/25 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-brand-300 text-sm font-medium">Pizzería Artesanal desde 2010</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight">
              El Gusto <br />
              <span className="text-brand-400">Auténtico</span>
            </h1>
            <p className="text-stone-400 text-lg md:text-xl mt-6 leading-relaxed">
              Horneadas en horno de leña, con ingredientes traídos directamente de Italia. 
              Cada pizza es una obra de arte culinaria.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link to="/menu" className="btn-cta inline-flex items-center justify-center gap-2">
                Ver Menú Completo <ChevronRight className="w-4 h-4" />
              </Link>
              <button className="px-6 py-3 rounded-full border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white transition-all font-medium">
                Nuestras Promos
              </button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: Bike,  label: 'Delivery Rápido' },
                { icon: Clock, label: 'Lunes a Domingo' },
                { icon: Trophy, label: 'Mejor Pizzería 2024' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-stone-500">
                  <Icon className="w-4 h-4 text-brand-500" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      {pizzas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-brand-500 text-sm font-medium mb-1 uppercase tracking-wider">Nuestras Especialidades</p>
              <h2 className="section-title">Pizzas Favoritas</h2>
            </div>
            <Link to="/menu" className="text-brand-400 text-sm font-medium hover:text-brand-300 flex items-center gap-1">
              Ver todo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pizzas.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Combos */}
      {combos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
          <div className="mb-8">
            <p className="text-brand-500 text-sm font-medium mb-1 uppercase tracking-wider">Ahorra Más</p>
            <h2 className="section-title">Combos Especiales</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8 px-4 text-center text-stone-600 text-sm">
        <p>© {new Date().getFullYear()} Piacere Pizzería — Todos los derechos reservados</p>
      </footer>
    </div>
  )
}
