import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Minus, Trash2, ChevronDown, CreditCard, X } from 'lucide-react'
import { Product, ProductVariant } from '@piacere/types'
import api from '../services/api'
import { useCartStore } from '../store/useCartStore'

// ── Payment Modal ─────────────────────────────────────────────
function PaymentModal({ total, onClose, onConfirm }: {
  total: number; onClose: () => void; onConfirm: (payments: any[], method: string) => void
}) {
  const [method, setMethod] = useState<string>('cash_usd')
  const [amount, setAmount] = useState(total.toFixed(2))

  const methods = [
    { id: 'cash_usd', label: 'Efectivo USD' },
    { id: 'cash_ves', label: 'Efectivo Bs.' },
    { id: 'card',     label: 'Tarjeta' },
    { id: 'transfer', label: 'Transferencia' },
    { id: 'pago_movil', label: 'Pago Móvil' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Procesar Pago</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-5">
          <p className="text-gray-400 text-sm mb-1">Total a cobrar</p>
          <p className="text-3xl font-bold text-white">${total.toFixed(2)}</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2">Método de pago</label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  method === m.id
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-1.5">Monto recibido</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input-field w-full text-lg font-semibold"
            step="0.01"
          />
          {parseFloat(amount) > total && (
            <p className="text-xs text-emerald-400 mt-1">
              Vuelto: ${(parseFloat(amount) - total).toFixed(2)}
            </p>
          )}
        </div>

        <button
          id="btn-confirm-payment"
          onClick={() => onConfirm([{ method, amount: total }], method)}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Confirmar Pago
        </button>
      </div>
    </div>
  )
}

// ── Table Select Modal ─────────────────────────────────────────
function TableSelectModal({ onClose, onSelect }: { onClose: () => void; onSelect: (tableId: number, tableName: string) => void }) {
  const { data: sections = [] } = useQuery({
    queryKey: ['tables-sections-pos'],
    queryFn: () => api.get('/tables/sections').then(r => r.data)
  })
  
  const { data: tables = [] } = useQuery({
    queryKey: ['tables-pos'],
    queryFn: () => api.get('/tables').then(r => r.data)
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Asignar Mesa</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {sections.map((sec: any) => {
            const secTables = tables.filter((t: any) => t.section_id === sec.id && t.status === 'free')
            if (secTables.length === 0) return null
            return (
              <div key={sec.id}>
                <h4 className="text-gray-400 text-sm font-medium mb-3">{sec.name} (Libres)</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {secTables.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t.id, t.name)}
                      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/20 hover:scale-105 transition-all"
                    >
                      <span className="font-bold">{t.name}</span>
                      <span className="text-[10px] uppercase">Libre</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {tables.filter((t: any) => t.status === 'free').length === 0 && (
            <div className="text-center text-gray-500 py-10">No hay mesas libres disponibles.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cart Panel ───────────────────────────────────────────────
function CartPanel({ onAssignTable, onSendToKitchen, onQuickPay }: { 
  onAssignTable: () => void; 
  onSendToKitchen: () => void; 
  onQuickPay: () => void 
}) {
  const { items, subtotal, total, discount, setDiscount, removeItem, updateQuantity, clearCart, tableId } = useCartStore()

  // Find table name if assigned (Optional enhancement: fetch table name, or just show ID for now)
  const [tableName, setTableName] = useState<string | null>(null)
  
  // We fetch tables to resolve the table name
  const { data: tables = [] } = useQuery({
    queryKey: ['tables-pos'],
    queryFn: () => api.get('/tables').then(r => r.data)
  })

  // Set tableName based on selected tableId
  if (tableId && !tableName && tables.length > 0) {
    const t = tables.find((t: any) => t.id === tableId)
    if (t) setTableName(t.name)
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-2">
        <CreditCard className="w-10 h-10" />
        <p className="text-sm">Carrito vacío</p>
        <p className="text-xs">Selecciona productos del menú</p>
      </div>
    )
  }

  return (
    <>
      {tableId && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-2 mb-2 flex justify-between items-center">
           <span className="text-brand-300 text-xs font-semibold">Mesa Asignada:</span>
           <span className="text-white text-sm font-bold">{tableName || `#${tableId}`}</span>
           <button onClick={() => { useCartStore.getState().setTable(null); setTableName(null) }} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {items.map(item => (
          <div key={item.id} className="bg-white/4 rounded-lg px-3 py-2.5">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-tight">{item.name}</p>
                {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
              </div>
              <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 bg-white/8 hover:bg-white/15 rounded flex items-center justify-center transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 bg-white/8 hover:bg-white/15 rounded flex items-center justify-center transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-semibold text-brand-400">${(item.unitPrice * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 pt-3 space-y-2 mt-3">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Subtotal</span><span>${subtotal().toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Descuento</span>
          <input
            type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
            className="input-field flex-1 text-sm py-1 px-2" min="0" step="0.5"
          />
        </div>
        <div className="flex justify-between font-bold text-white mb-2">
          <span>Total</span><span className="text-brand-400">${total().toFixed(2)}</span>
        </div>
        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          {!tableId && (
            <button onClick={onAssignTable} className="col-span-2 btn-secondary py-2 text-sm border-dashed">
               + Asignar Mesa
            </button>
          )}
          
          <button onClick={onSendToKitchen} className={`${tableId ? 'col-span-2' : ''} btn-primary py-2 text-sm bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 shadow-lg`}>
             A Cocina
          </button>
          
          {!tableId && (
            <button onClick={onQuickPay} className="btn-primary py-2 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 shadow-lg">
               Pagar
            </button>
          )}
        </div>
        
        <button onClick={clearCart} className="btn-ghost w-full text-xs text-gray-600 mt-2">
          Limpiar carrito
        </button>
      </div>
    </>
  )
}

export default function POSPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showTableSelect, setShowTableSelect] = useState(false)
  const { addItem, items, total, tableId, setTable } = useCartStore()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => api.get(`/menu/products${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`).then(r => r.data),
  })

  const createOrder = useMutation({
    mutationFn: (data: any) => api.post('/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const filtered = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddToCart = (product: Product) => {
    // Añadir siempre la variante principal o nulo
    const mainVariant = product.variants?.[0] ?? null
    addItem(product, mainVariant)
  }

  const handleSendOrder = async () => {
    const { items: cartItems, tableId, orderType, discount } = useCartStore.getState()
    if (cartItems.length === 0) return

    try {
      await createOrder.mutateAsync({
        type: tableId ? 'dine_in' : 'takeaway',
        source: 'pos',
        tableId: tableId || undefined,
        discount,
        items: cartItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes,
        })),
      })
      useCartStore.getState().clearCart()
      // Opcional: mostrar notificación de éxito
    } catch (err) {
      console.error('Error creando pedido', err)
    }
  }

  const handleConfirmOrder = async (payments: any[]) => {
    const { items: cartItems, tableId, orderType, discount } = useCartStore.getState()
    try {
      const order = await createOrder.mutateAsync({
        type: tableId ? 'dine_in' : 'takeaway',
        source: 'pos',
        tableId: tableId || undefined,
        discount,
        items: cartItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes,
        })),
      })
      // Registrar pago
      for (const p of payments) {
        await api.post(`/orders/${order.data.id}/payments`, p)
      }
      useCartStore.getState().clearCart()
      setShowPayment(false)
    } catch (err) {
      console.error('Error creando pedido con pago', err)
    }
  }

  return (
    <div className="flex h-full">
      {/* Products area */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        {/* Search & categories */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="pos-search"
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field w-full pl-9"
            />
          </div>
          {/* Categories Dropdown */}
          <div className="relative min-w-48">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="input-field w-full appearance-none pr-10"
            >
              <option value="">Todas las Categorías</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id} className="bg-gray-900">
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product: Product) => (
              <div key={product.id} className="glass-panel p-3 flex flex-col gap-2 hover:bg-white/8 transition-all cursor-pointer group">
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm leading-tight">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-brand-400 font-bold text-sm">
                    ${(product.basePrice + (product.variants?.[0]?.priceDelta ?? 0)).toFixed(2)}
                  </span>
                  <button
                    id={`add-product-${product.id}`}
                    onClick={() => handleAddToCart(product)}
                    className="w-7 h-7 bg-brand-500 hover:bg-brand-600 rounded-lg flex items-center justify-center transition-all"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart sidebar */}
      <div className="w-72 border-l border-white/8 flex flex-col p-4 bg-black/30">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          Pedido · <span className="text-brand-400">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
        </h2>
        <CartPanel 
          onAssignTable={() => setShowTableSelect(true)} 
          onSendToKitchen={handleSendOrder} 
          onQuickPay={() => setShowPayment(true)} 
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total()}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {/* Table Select Modal */}
      {showTableSelect && (
        <TableSelectModal
          onClose={() => setShowTableSelect(false)}
          onSelect={(id, name) => {
            setTable(id)
            setShowTableSelect(false)
          }}
        />
      )}
    </div>
  )
}
