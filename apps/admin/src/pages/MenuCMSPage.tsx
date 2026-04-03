import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Monitor } from 'lucide-react'
import api from '../services/api'

export default function MenuCMSPage() {
  const qc = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/menu/products').then(r => r.data),
  })

  const { data: combos = [] } = useQuery({
    queryKey: ['combos'],
    queryFn: () => api.get('/menu/combos').then(r => r.data),
  })

  const toggleProduct = useMutation({
    mutationFn: ({ id, isOnWebMenu }: { id: number; isOnWebMenu: boolean }) =>
      api.put(`/menu/products/${id}`, { isOnWebMenu: !isOnWebMenu }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products-all'] }),
  })

  const filtered = activeCategory
    ? products.filter((p: any) => p.category_id === activeCategory)
    : products

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-brand-400" /> CMS — Menú Web
        </h1>
        <p className="text-gray-500 text-sm">
          Controla qué productos y combos son visibles en la Landing Page.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
            !activeCategory ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400 hover:bg-white/5'
          }`}
        >
          Todos
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
              activeCategory === cat.id ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400 hover:bg-white/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Productos ({filtered.length})</h2>
        <div className="divide-y divide-white/5">
          {filtered.map((product: any) => (
            <div key={product.id} className="flex items-center gap-4 py-3 hover:bg-white/3 -mx-1 px-1 rounded-lg transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category_name} · ${product.base_price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  product.is_on_web_menu ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {product.is_on_web_menu ? 'Visible en web' : 'Oculto'}
                </span>
                <button
                  onClick={() => toggleProduct.mutate({ id: product.id, isOnWebMenu: product.is_on_web_menu })}
                  className="btn-ghost p-1.5"
                  title={product.is_on_web_menu ? 'Ocultar de la web' : 'Mostrar en la web'}
                >
                  {product.is_on_web_menu ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combos */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Combos Promocionales ({combos.length})</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {combos.map((combo: any) => (
            <div key={combo.id} className="bg-white/4 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-white">{combo.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{combo.description}</p>
                  <p className="text-brand-400 font-bold text-sm mt-1">${combo.price.toFixed(2)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  combo.is_on_web_menu ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {combo.is_on_web_menu ? 'Visible' : 'Oculto'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {combo.items?.map((item: any) => (
                  <span key={item.id} className="text-xs bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                    {item.quantity}× {item.product_name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
