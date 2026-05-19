import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Minus, Trash2, ChevronDown, CreditCard, X, Check, UtensilsCrossed, TableProperties, SendHorizonal } from 'lucide-react'
import { Product, ProductExtra } from '@piacere/types'
import api from '../services/api'
import { useCartStore } from '../store/useCartStore'

const PAYMENT_METHODS = [
  { id: 'cash_usd', label: 'Efectivo USD' },
  { id: 'cash_ves', label: 'Efectivo Bs.' },
  { id: 'card',     label: 'Tarjeta' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'pago_movil', label: 'Pago Móvil' },
]

// ── Payment Modal ─────────────────────────────────────────────
function PaymentModal({ total, onClose, onConfirm, loading }: {
  total: number; onClose: () => void; onConfirm: (method: string, amount: number) => void; loading?: boolean
}) {
  const [method, setMethod] = useState<string>('cash_usd')
  const [amount, setAmount] = useState(total.toFixed(2))
  const change = parseFloat(amount) - total

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Procesar Pago</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-5 bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Total a cobrar</p>
          <p className="text-4xl font-bold text-white">${total.toFixed(2)}</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2">Método de pago</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(m => (
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
          {change > 0 && (
            <p className="text-xs text-emerald-400 mt-1.5 font-semibold">
              ✓ Vuelto: ${change.toFixed(2)}
            </p>
          )}
        </div>

        <button
          id="btn-confirm-payment"
          onClick={() => onConfirm(method, total)}
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </button>
      </div>
    </div>
  )
}

// ── Table Select Modal ─────────────────────────────────────────
function TableSelectModal({ onClose, onSelect, showAll = false }: {
  onClose: () => void
  onSelect: (tableId: number, tableName: string) => void
  showAll?: boolean
}) {
  const { data: sections = [] } = useQuery({
    queryKey: ['tables-sections-pos'],
    queryFn: () => api.get('/tables/sections').then(r => r.data)
  })
  const { data: tables = [] } = useQuery({
    queryKey: ['tables-pos'],
    queryFn: () => api.get('/tables').then(r => r.data)
  })

  const visibleTables = showAll ? tables : tables.filter((t: any) => t.status === 'free')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Asignar Mesa</h3>
            {!showAll && <p className="text-xs text-gray-500">Solo mesas disponibles</p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {sections.map((sec: any) => {
            const secTables = visibleTables.filter((t: any) => t.section_id === sec.id)
            if (secTables.length === 0) return null
            return (
              <div key={sec.id}>
                <h4 className="text-gray-400 text-sm font-medium mb-3">{sec.name}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {secTables.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t.id, t.name)}
                      className={`rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 border ${
                        t.status === 'free'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      }`}
                    >
                      <span className="font-bold text-base">{t.name}</span>
                      <span className="text-[10px] uppercase">{t.status === 'free' ? 'Libre' : 'Ocupada'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {visibleTables.length === 0 && (
            <div className="text-center text-gray-500 py-10">No hay mesas disponibles.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Extras Selection Modal ──────────────────────────────────────
function ExtrasSelectionModal({ product, extras, onClose, onConfirm }: {
  product: Product; extras: ProductExtra[]; onClose: () => void; onConfirm: (extras: ProductExtra[]) => void
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggle = (extra: ProductExtra) => {
    const next = new Set(selected)
    if (next.has(extra.id)) next.delete(extra.id)
    else next.add(extra.id)
    setSelected(next)
  }

  const selectedExtras = extras.filter(e => selected.has(e.id))
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const finalPrice = product.basePrice + extrasTotal

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
            <p className="text-brand-400 font-semibold mt-1">Precio Base: ${product.basePrice.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <h4 className="text-sm font-medium text-gray-400 mb-3 border-b border-white/10 pb-2">Seleccionar Adicionales</h4>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-2 custom-scrollbar">
          {extras.map(e => {
            const isSelected = selected.has(e.id)
            return (
              <button
                key={e.id}
                onClick={() => toggle(e)}
                className={`flex justify-between items-center p-3 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                    : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="font-medium">{e.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">+${e.price.toFixed(2)}</span>
                  {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total con adicionales</p>
            <p className="text-xl font-bold text-white">${finalPrice.toFixed(2)}</p>
          </div>
          <button
            onClick={() => onConfirm(selectedExtras)}
            className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Añadir al Pedido
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cart Panel ───────────────────────────────────────────────
function CartPanel({ onAssignTable, onPay, onSendToOrders, loading }: {
  onAssignTable: () => void
  onPay: () => void
  onSendToOrders: () => void
  loading?: boolean
}) {
  const { items, subtotal, total, discount, setDiscount, removeItem, updateQuantity, clearCart, tableId } = useCartStore()

  const { data: tables = [] } = useQuery({
    queryKey: ['tables-pos'],
    queryFn: () => api.get('/tables').then(r => r.data)
  })

  const tableObj = tables.find((t: any) => t.id === tableId)

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
        <UtensilsCrossed className="w-10 h-10 opacity-40" />
        <div className="text-center">
          <p className="text-sm font-medium">Carrito vacío</p>
          <p className="text-xs mt-0.5">Selecciona productos del menú</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Assigned table badge */}
      {tableId ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 mb-3 flex justify-between items-center">
          <span className="text-emerald-400 text-xs font-semibold">Mesa:</span>
          <span className="text-white text-sm font-bold">{tableObj?.name || `#${tableId}`}</span>
          <button
            onClick={onAssignTable}
            className="text-xs text-emerald-500 hover:text-emerald-300 underline"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <button
          onClick={onAssignTable}
          className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 text-xs font-medium transition-colors"
        >
          <TableProperties className="w-4 h-4" /> Asignar Mesa
        </button>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {items.map(item => (
          <div key={item.id} className="bg-white/4 rounded-lg px-3 py-2.5">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-tight">{item.name}</p>
                {item.extras.length > 0 && (
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                    + {item.extras.map(e => e.name).join(', ')}
                  </p>
                )}
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

      {/* Totals + actions */}
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
        <div className="flex justify-between font-bold text-white mb-3">
          <span>Total</span><span className="text-brand-400">${total().toFixed(2)}</span>
        </div>

        {/* Action buttons */}
        <button
          onClick={onPay}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
        >
          <CreditCard className="w-4 h-4" />
          Pagar
        </button>
        <button
          onClick={onSendToOrders}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30"
        >
          <SendHorizonal className="w-4 h-4" />
          Enviar a Órdenes
        </button>

        <button onClick={clearCart} className="btn-ghost w-full text-xs text-gray-600 mt-1">
          Limpiar carrito
        </button>
      </div>
    </>
  )
}

// ── Main POS Page ─────────────────────────────────────────────
export default function POSPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showTableSelect, setShowTableSelect] = useState(false)
  const [extrasModalData, setExtrasModalData] = useState<Product | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { addItem, items, total, tableId, setTable } = useCartStore()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  })

  const { data: extras = [] } = useQuery({
    queryKey: ['extras-active'],
    queryFn: () => api.get('/menu/extras').then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => api.get(`/menu/products${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`).then(r => r.data),
  })

  const createOrder = useMutation({
    mutationFn: (data: any) => api.post('/orders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const filtered = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddToCart = (product: Product) => {
    const isPizza = categories.find((c: any) => c.id === product.categoryId)?.slug === 'pizzas'
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

  const buildOrderPayload = (paid: boolean) => {
    const { items: cartItems, tableId, discount } = useCartStore.getState()
    return {
      type: tableId ? 'dine_in' : 'takeaway',
      source: 'pos',
      tableId: tableId || undefined,
      discount,
      paid,
      items: cartItems.map(i => ({
        productId: i.productId,
        extraIds: i.extras?.map((e: any) => e.id) || [],
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        notes: i.notes,
      })),
    }
  }

  // Send to orders (no payment)
  const handleSendToOrders = async () => {
    if (items.length === 0) return
    setActionLoading(true)
    try {
      await createOrder.mutateAsync(buildOrderPayload(false))
      useCartStore.getState().clearCart()
      qc.invalidateQueries({ queryKey: ['active-orders'] })
    } catch (err) {
      console.error('Error enviando pedido', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Pay: create order + register payment
  const handleConfirmPayment = async (method: string, amount: number) => {
    setActionLoading(true)
    try {
      const order = await createOrder.mutateAsync(buildOrderPayload(true))
      await api.post(`/orders/${order.data.id}/payments`, { method, amount })
      useCartStore.getState().clearCart()
      setShowPayment(false)
      qc.invalidateQueries({ queryKey: ['active-orders'] })
    } catch (err) {
      console.error('Error procesando pago', err)
    } finally {
      setActionLoading(false)
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
                    ${product.basePrice.toFixed(2)}
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
          onPay={() => setShowPayment(true)}
          onSendToOrders={handleSendToOrders}
          loading={actionLoading}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total()}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmPayment}
          loading={actionLoading}
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

      {/* Extras Selection Modal */}
      {extrasModalData && (
        <ExtrasSelectionModal
          product={extrasModalData}
          extras={extras}
          onClose={() => setExtrasModalData(null)}
          onConfirm={handleConfirmExtras}
        />
      )}
    </div>
  )
}
