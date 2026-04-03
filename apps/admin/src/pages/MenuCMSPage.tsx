import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Plus, Search, Eye, EyeOff, Edit, Trash2, Tag, Coffee, Package, Settings } from 'lucide-react'
import api from '../services/api'
import ConfirmModal from '../components/ConfirmModal'
import ProductFormModal from '../components/ProductFormModal'
import ComboFormModal from '../components/ComboFormModal'

export default function MenuCMSPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'products'|'combos'|'categories'>('products')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Queries
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/menu/categories').then(r => r.data) })
  const { data: products = [] } = useQuery({ queryKey: ['products-all'], queryFn: () => api.get('/menu/products?all=true').then(r => r.data).catch(() => api.get('/menu/products').then(r => r.data)) })
  const { data: combos = [] } = useQuery({ queryKey: ['combos'], queryFn: () => api.get('/menu/combos?all=true').then(r => r.data).catch(() => api.get('/menu/combos').then(r => r.data)) })

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  const [showComboModal, setShowComboModal] = useState(false)
  const [editingCombo, setEditingCombo] = useState<any>(null)

  const [confirmState, setConfirmState] = useState<{isOpen: boolean, title: string, message: string, type?: any, onConfirm: () => void}>({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} })

  // Mutations (Product)
  const saveProduct = useMutation({
    mutationFn: (data: any) => data.id ? api.put(`/menu/products/${data.id}`, data) : api.post('/menu/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products-all'] }); setShowProductModal(false); setEditingProduct(null) }
  })
  const deleteProduct = useMutation({
    mutationFn: (id: number) => api.delete(`/menu/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products-all'] }); qc.invalidateQueries({ queryKey: ['combos'] }); setConfirmState(p => ({...p, isOpen: false})) }
  })
  const toggleProduct = useMutation({
    mutationFn: (id: number) => api.patch(`/menu/products/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products-all'] })
  })

  // Mutations (Combo)
  const saveCombo = useMutation({
    mutationFn: (data: any) => data.id ? api.put(`/menu/combos/${data.id}`, data) : api.post('/menu/combos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['combos'] }); setShowComboModal(false); setEditingCombo(null) }
  })
  const deleteCombo = useMutation({
    mutationFn: (id: number) => api.delete(`/menu/combos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['combos'] }); setConfirmState(p => ({...p, isOpen: false})) }
  })
  const toggleCombo = useMutation({
    mutationFn: (id: number) => api.patch(`/menu/combos/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['combos'] })
  })

  // Mutations (Category)
  const createCategory = useMutation({
    mutationFn: (name: string) => api.post('/menu/categories', { name, slug: name.toLowerCase().replace(/ /g, '-') }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] })
  })
  const deleteCategory = useMutation({
    mutationFn: (id: number) => api.delete(`/menu/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setConfirmState(p => ({...p, isOpen: false})) },
    onError: (err: any) => {
      setConfirmState({
        isOpen: true,
        title: 'Error de Eliminación',
        message: err.response?.data?.error || 'No se puede eliminar la categoría. Asegúrate de que no tenga productos asociados.',
        type: 'warning',
        onConfirm: () => setConfirmState(p => ({...p, isOpen: false}))
      });
    }
  })

  // Data Filtering
  const filteredProducts = useMemo(() => products.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm])
  const filteredCombos = useMemo(() => combos.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [combos, searchTerm])

  const openDeleteConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, type: 'danger', onConfirm })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" /> Gestor de Menú
          </h1>
          <p className="text-gray-500 text-sm">Administra categorías, productos y combos libremente.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
           <input placeholder="Buscar en menú..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 w-full text-sm bg-white/5" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'products' ? 'text-brand-400 border-brand-500' : 'text-gray-400 border-transparent hover:text-white'}`}><Coffee className="w-4 h-4"/> Productos</button>
        <button onClick={() => setActiveTab('combos')} className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'combos' ? 'text-brand-400 border-brand-500' : 'text-gray-400 border-transparent hover:text-white'}`}><Package className="w-4 h-4"/> Combos</button>
        <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'text-brand-400 border-brand-500' : 'text-gray-400 border-transparent hover:text-white'}`}><Tag className="w-4 h-4"/> Categorías</button>
      </div>

      <div className="animate-in fade-in duration-200">
        {activeTab === 'products' && (
           <div className="card">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-sm font-semibold text-gray-300">Catálogo de Productos ({filteredProducts.length})</h2>
               <button onClick={() => { setEditingProduct(null); setShowProductModal(true) }} className="btn-primary flex items-center gap-2 !py-1.5 !px-3 text-sm"><Plus className="w-4 h-4"/> Añadir</button>
             </div>
             <div className="divide-y divide-white/5">
                {filteredProducts.map((p: any) => (
                  <div key={p.id} className={`flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors ${p.isActive ? '' : 'opacity-50'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="text-sm font-medium text-white">{p.name} {!p.isActive && '(Oculto)'}</p>
                         <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded border border-white/10">{p.categoryName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.description || 'Sin descripción'} · <span className="text-brand-400 font-medium">${p.basePrice?.toFixed(2)}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full hidden sm:block ${p.isOnWebMenu ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>{p.isOnWebMenu ? 'Web Visible' : 'Oculto Web'}</span>
                       <div className="flex bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                         <button onClick={() => toggleProduct.mutate(p.id)} className={`p-1.5 transition-colors hover:text-white hover:bg-white/10 ${p.isActive ? 'text-emerald-400' : 'text-gray-500'}`} title={p.isActive ? 'Ocultar producto del POS' : 'Activar producto'}>{p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                         <button onClick={() => { setEditingProduct(p); setShowProductModal(true) }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                         <button onClick={() => openDeleteConfirm('Eliminar Producto', `¿Eliminar "${p.name}" permanentemente? Se removerá de cualquier combo que lo contenga.`, () => deleteProduct.mutate(p.id))} className="p-1.5 text-red-400 hover:bg-red-500/20 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No se encontraron productos.</p>}
             </div>
           </div>
        )}

        {activeTab === 'combos' && (
           <div className="card">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-sm font-semibold text-gray-300">Combos Promocionales ({filteredCombos.length})</h2>
               <button onClick={() => { setEditingCombo(null); setShowComboModal(true) }} className="btn-primary flex items-center gap-2 !py-1.5 !px-3 text-sm"><Plus className="w-4 h-4"/> Añadir</button>
             </div>
             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredCombos.map((c: any) => (
                  <div key={c.id} className={`bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col ${c.isActive ? '' : 'opacity-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <p className="font-bold text-white text-sm">{c.name} {!c.isActive && '(Oculto)'}</p>
                         <p className="text-xl text-brand-400 font-bold tracking-tight">${c.price?.toFixed(2)}</p>
                       </div>
                       <div className="flex bg-black/20 rounded-lg overflow-hidden border border-white/5">
                         <button onClick={() => toggleCombo.mutate(c.id)} className={`p-1.5 transition-colors hover:text-white ${c.isActive ? 'text-emerald-400' : 'text-gray-500'}`} title={c.isActive ? 'Ocultar Combo' : 'Mostrar Combo'}>{c.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                         <button onClick={() => { setEditingCombo(c); setShowComboModal(true) }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                         <button onClick={() => openDeleteConfirm('Eliminar Combo', `¿Eliminar "${c.name}" de forma permanente?`, () => deleteCombo.mutate(c.id))} className="p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 flex-1">{c.description || 'Sin descripción extra'}</p>
                    <div className="space-y-1 bg-black/20 rounded-lg p-2 border border-white/5">
                      {c.items?.map((item: any) => (
                        <div key={item.id} className="text-xs text-gray-300 flex justify-between">
                          <span>{item.quantity}× {item.productName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCombos.length === 0 && <p className="text-sm text-gray-500 py-4 col-span-full text-center">No hay combos registrados.</p>}
             </div>
           </div>
        )}

        {activeTab === 'categories' && (
           <div className="card max-w-2xl mx-auto">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-sm font-semibold text-gray-300">Gestión de Categorías ({categories.length})</h2>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); const name = new FormData(e.currentTarget).get('name') as string; createCategory.mutate(name); e.currentTarget.reset(); }} className="flex gap-2 mb-6 bg-white/5 p-3 rounded-lg border border-white/5">
               <input name="name" placeholder="Nueva categoría (ej. Bebidas Calientes)" required className="input-field flex-1 text-sm bg-black/20" />
               <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4"/> Crear</button>
             </form>

             <div className="space-y-2">
                {categories.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                     <div>
                       <p className="font-semibold text-white text-sm">{c.name}</p>
                       <p className="text-xs text-gray-500">/{c.slug}</p>
                     </div>
                     <button onClick={() => openDeleteConfirm('Eliminar Categoría', `¿Eliminar "${c.name}"? Solo es posible si no tiene productos asociados.`, () => deleteCategory.mutate(c.id))} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
             </div>
           </div>
        )}
      </div>

      <ProductFormModal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        product={editingProduct} 
        categories={categories} 
        onSave={(data: any) => saveProduct.mutate(data)} 
      />

      <ComboFormModal 
        isOpen={showComboModal} 
        onClose={() => setShowComboModal(false)} 
        combo={editingCombo} 
        products={products} 
        onSave={(data: any) => saveCombo.mutate(data)} 
      />

      <ConfirmModal 
        {...confirmState} 
        onCancel={() => setConfirmState(p => ({...p, isOpen: false}))} 
      />
    </div>
  )
}
