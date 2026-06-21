import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, X, Check } from 'lucide-react'
import { Product, Category, ProductExtra } from '@piacere/contracts'
import { useWebCartStore } from '../store/useWebCartStore'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [selCat, setSelCat] = useState<number | null>(null)
  const [extrasModalData, setExtrasModalData] = useState<Product | null>(null)
  const { addItem } = useWebCartStore()

  const { data: extras = [] } = useQuery<ProductExtra[]>({
    queryKey: ['web-extras'],
    queryFn: () => api.get('/menu/extras').then(r => r.data),
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['web-categories'],
    queryFn: () => api.get('/menu/categories?web=true').then(r => r.data),
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['web-products-all'],
    queryFn: () => api.get('/menu/products?web=true').then(r => r.data),
  })

  const filtered = products.filter(p => {
    const matchCat = selCat ? (p as any).categoryId === selCat : true
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleAddToCart = (product: Product) => {
    const isPizza = (product as any).category_name?.toLowerCase() === 'pizzas'
    if (isPizza && extras.length > 0) {
      setExtrasModalData(product)
    } else {
      addItem(product, [])
    }
  }

  const handleConfirmExtras = (selectedExtras: ProductExtra[]) => {
    if (extrasModalData) {
      addItem(extrasModalData, selectedExtras)
      setExtrasModalData(null)
    }
  }

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
            <div className="h-36 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center text-4xl overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                (product as any).category_name === 'Pizzas' ? '🍕' :
                (product as any).category_name === 'Pastas' ? '🍝' :
                (product as any).category_name === 'Bebidas' ? '🥤' : '🍽️'
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-brand-500 font-medium mb-1">{(product as any).category_name}</p>
              <h3 className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">{product.name}</h3>
              {product.description && (
                <p className="text-stone-600 text-xs mt-1 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-brand-400 font-bold">${product.basePrice.toFixed(2)}</p>
                <button
                  onClick={() => handleAddToCart(product)}
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

      {/* Extras Selection Modal */}
      {extrasModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{extrasModalData.name}</h3>
                <p className="text-brand-400 font-semibold mt-1">Precio Base: ${extrasModalData.basePrice.toFixed(2)}</p>
              </div>
              <button onClick={() => setExtrasModalData(null)} className="p-1 text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <h4 className="text-sm font-medium text-stone-400 mb-3 border-b border-stone-800 pb-2">Seleccionar Adicionales (Opcional)</h4>
            
            <ExtrasList 
              extras={extras} 
              basePrice={extrasModalData.basePrice}
              onConfirm={handleConfirmExtras}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ExtrasList({ extras, basePrice, onConfirm }: { extras: ProductExtra[], basePrice: number, onConfirm: (e: ProductExtra[]) => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggle = (extra: ProductExtra) => {
    const next = new Set(selected)
    if (next.has(extra.id)) next.delete(extra.id)
    else next.add(extra.id)
    setSelected(next)
  }

  const selectedExtras = extras.filter(e => selected.has(e.id))
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const finalPrice = basePrice + extrasTotal

  return (
    <>
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-2 custom-scrollbar">
        {extras.map(e => {
          const isSelected = selected.has(e.id)
          return (
            <button
              key={e.id}
              onClick={() => toggle(e)}
              className={`flex justify-between items-center p-3 rounded-xl border text-sm transition-all ${
                isSelected 
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300' 
                  : 'bg-stone-800/50 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span className="font-medium text-left">{e.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">+${e.price.toFixed(2)}</span>
                {isSelected && <Check className="w-4 h-4 text-brand-400" />}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-stone-800 flex justify-between items-center">
         <div>
           <p className="text-xs text-stone-400 mb-1">Total con adicionales</p>
           <p className="text-xl font-bold text-white">${finalPrice.toFixed(2)}</p>
         </div>
         <button 
           onClick={() => onConfirm(selectedExtras)}
           className="bg-brand-500 hover:bg-brand-600 text-white rounded-full py-2 px-6 flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105"
         >
           <Plus className="w-4 h-4" /> Añadir al Carrito
         </button>
      </div>
    </>
  )
}
