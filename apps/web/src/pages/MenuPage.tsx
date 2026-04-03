import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus } from 'lucide-react'
import { Product, Category } from '@piacere/types'
import { useWebCartStore } from '../store/useWebCartStore'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [selCat, setSelCat] = useState<number | null>(null)
  const { addItem } = useWebCartStore()

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['web-categories'],
    queryFn: () => api.get('/menu/categories?web=true').then(r => r.data),
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['web-products-all'],
    queryFn: () => api.get('/menu/products?web=true').then(r => r.data),
  })

  const filtered = products.filter(p => {
    const matchCat = selCat ? (p as any).category_id === selCat : true
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="section-title mb-2">Nuestro Menú</h1>
      <p className="text-stone-500 mb-8">Ingredientes frescos, recetas auténticas 🇮🇹</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded-full px-4 py-2 pl-9 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelCat(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selCat ? 'bg-brand-500 text-white' : 'bg-stone-900 border border-stone-700 text-stone-400 hover:border-stone-600'
            }`}
          >
            Todos
          </button>
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelCat(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selCat === cat.id ? 'bg-brand-500 text-white' : 'bg-stone-900 border border-stone-700 text-stone-400 hover:border-stone-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="product-card group">
            <div className="h-36 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center text-4xl">
              {(product as any).category_name === 'Pizzas' ? '🍕' :
               (product as any).category_name === 'Pastas' ? '🍝' :
               (product as any).category_name === 'Bebidas' ? '🥤' : '🍽️'}
            </div>
            <div className="p-4">
              <p className="text-xs text-brand-500 font-medium mb-1">{(product as any).category_name}</p>
              <h3 className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">{product.name}</h3>
              {product.description && (
                <p className="text-stone-600 text-xs mt-1 line-clamp-2">{product.description}</p>
              )}
              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {product.variants.slice(0, 3).map(v => (
                    <span key={v.id} className="text-xs bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded">{v.name}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-brand-400 font-bold">${product.basePrice.toFixed(2)}</p>
                <button
                  onClick={() => addItem(product, product.variants?.[1] ?? product.variants?.[0] ?? null)}
                  className="w-7 h-7 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-stone-600">
          <p className="text-4xl mb-3">🔍</p>
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}
