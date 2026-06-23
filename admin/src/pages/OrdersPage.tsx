import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus, CreditCard, X, UtensilsCrossed, Eye, CheckCircle2, AlertCircle, Trash2, ShoppingBag, Truck, DoorOpen, Search, ChefHat } from 'lucide-react'
import api from '../services/api'
import ConfirmModal from '../components/ConfirmModal'
import { Product, ProductExtra } from '@piacere/contracts'
import { useCartStore } from '../store/useCartStore'
import { useNavigate } from 'react-router-dom'

// ── Order Detail Modal ─────────────────────────────────────
function OrderDetailModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then(r => r.data),
  })

  const methodLabel: Record<string, string> = {
    cash_usd: 'Efectivo USD', cash_ves: 'Efectivo Bs.',
    card: 'Tarjeta', transfer: 'Transferencia', pago_movil: 'Pago Móvil',
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-2xl shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">{data?.order_number ?? 'Cargando...'}</h3>
            {data && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(data.created_at).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-10">Cargando detalles...</div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {/* Info Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Mesa</p>
                <p className="text-sm font-bold text-white">{data.table_name || 'Sin asignar'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tipo</p>
                <p className="text-sm font-bold text-white">
                  {data.type === 'dine_in' ? 'Comer Aquí' : data.type === 'takeaway' ? 'Para Llevar' : data.type}
                </p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  data.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {data.paid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {data.paid ? 'Pagado' : 'Sin pagar'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Productos</h4>
              <div className="space-y-2">
                {(data.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 bg-black/30 rounded-lg px-3 py-2.5 border border-white/5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        <span className="text-brand-400 font-bold mr-1">{item.quantity}×</span>
                        {item.product_name || item.combo_name || 'Ítem'}
                      </p>
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-0.5">Extras: {item.extras.map((e: any) => e.name).join(', ')}</p>
                      )}
                      {item.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">Nota: {item.notes}</p>}
                    </div>
                    <p className="text-sm font-bold text-gray-300 whitespace-nowrap">${(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            {data.payments && data.payments.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Pagos Registrados</h4>
                <div className="space-y-1.5">
                  {data.payments.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm text-emerald-300 font-medium">{methodLabel[p.method] ?? p.method}</span>
                        {p.reference && <span className="text-[10px] text-gray-500">({p.reference})</span>}
                      </div>
                      <span className="text-sm font-bold text-emerald-400">${parseFloat(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/8 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>${parseFloat(data.subtotal).toFixed(2)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Descuento</span><span>-${parseFloat(data.discount).toFixed(2)}</span>
                </div>
              )}
              {data.tip > 0 && (
                <div className="flex justify-between text-sm text-brand-400">
                  <span>Propina</span><span>+${parseFloat(data.tip).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2 mt-1">
                <span>Total con Propina</span>
                <span className="text-brand-400">
                  ${(parseFloat(data.total) + parseFloat(data.tip || 0)).toFixed(2)}
                </span>
              </div>
              {data.total_paid > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Total Pagado</span><span>${parseFloat(data.total_paid).toFixed(2)}</span>
                </div>
              )}
              {data.total_paid < (parseFloat(data.total) + parseFloat(data.tip || 0)) && (
                <div className="flex justify-between text-sm font-semibold text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1 mt-1">
                  <span>Saldo Pendiente</span>
                  <span>
                    ${(parseFloat(data.total) + parseFloat(data.tip || 0) - parseFloat(data.total_paid)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">No se pudo cargar la orden.</div>
        )}
      </div>
    </div>
  )
}

// ── Modals ──────────────────────────────────────────────────

function PaymentModal({ totalPaid, subtotalTotal, onClose, onConfirm, loading }: {
  totalPaid: number; subtotalTotal: number; onClose: () => void; onConfirm: (method: string, amount: number, tip: number) => void; loading?: boolean
}) {
  const amountToPay = Math.max(0, subtotalTotal - totalPaid)
  const [method, setMethod] = useState<string>('cash_usd')
  const [tip, setTip] = useState<number>(0)
  const [amount, setAmount] = useState(amountToPay.toFixed(2))
  const change = parseFloat(amount) - (amountToPay + tip)

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
          <h3 className="text-lg font-semibold text-white">Registrar Pago</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Monto Restante + Propina</p>
          <p className="text-4xl font-bold text-white">${(amountToPay + tip).toFixed(2)}</p>
          {tip > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              Restante: ${amountToPay.toFixed(2)} + Propina: ${tip.toFixed(2)}
            </p>
          )}
        </div>

        {/* Propina Section */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Propina (Tip)</label>
            {tip > 0 && <span className="text-xs text-brand-400 font-semibold">+${tip.toFixed(2)}</span>}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[0, 5, 10, 15].map((pct) => {
              const tipVal = parseFloat((amountToPay * (pct / 100)).toFixed(2));
              const isSelected = tip === tipVal;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setTip(tipVal);
                    setAmount((amountToPay + tipVal).toFixed(2));
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  {pct === 0 ? '0%' : `${pct}%`}
                </button>
              );
            })}
          </div>
          <input
            type="number"
            placeholder="Propina personalizada"
            value={tip === 0 ? '' : tip}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setTip(val);
              setAmount((amountToPay + val).toFixed(2));
            }}
            className="input-field w-full text-sm"
            step="0.1"
            min="0"
          />
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
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
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
          onClick={() => onConfirm(method, amountToPay + tip, tip)}
          disabled={loading}
          className="btn-primary bg-emerald-600 hover:bg-emerald-700 w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </button>
      </div>
    </div>
  )
}

function TableSelectModal({ onClose, onSelect }: {
  onClose: () => void
  onSelect: (tableId: number | null) => void
}) {
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Cambiar Mesa</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <button 
          onClick={() => onSelect(null)} 
          className="mb-4 w-full py-2 border border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-gray-400 hover:text-white transition-colors"
        >
          Quitar Mesa (Para Llevar)
        </button>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {sections.map((sec: any) => {
            const secTables = tables.filter((t: any) => t.sectionId === sec.id)
            if (secTables.length === 0) return null
            return (
              <div key={sec.id}>
                <h4 className="text-gray-400 text-sm font-medium mb-3">{sec.name}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {secTables.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (t.status !== 'free') {
                           if(!window.confirm(`La mesa ${t.name} parece ocupada. ¿Deseas asignarla de todos modos?`)) return;
                        }
                        onSelect(t.id)
                      }}
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
        </div>
      </div>
    </div>
  )
}

function AddItemsModal({ orderId, onClose }: { orderId: number, onClose: () => void }) {
  // A simplified POS interface strictly for adding items to an existing order.
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [extrasModalData, setExtrasModalData] = useState<Product | null>(null)
  
  // Local cart for this modal
  const [cart, setCart] = useState<any[]>([])

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/menu/categories').then(r => r.data) })
  const { data: extras = [] } = useQuery({ queryKey: ['extras-active'], queryFn: () => api.get('/menu/extras').then(r => r.data) })
  const { data: products = [] } = useQuery({ 
    queryKey: ['products', selectedCategory], 
    queryFn: () => api.get(`/menu/products${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`).then(r => r.data) 
  })

  const addItemsMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/orders/${orderId}/add-items`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      onClose()
    }
  })

  const filtered = products.filter((p: Product) => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = (product: Product, selectedExtras: ProductExtra[] = []) => {
    const extraIdsStr = selectedExtras.length > 0 ? '-' + selectedExtras.map(e => e.id).sort().join(',') : '';
    const id = `${product.id}${extraIdsStr}`;
    const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const price = product.basePrice + extrasPrice;

    setCart(prev => {
      const existing = prev.find(i => i.id === id)
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { id, productId: product.id, name: product.name, extras: selectedExtras, quantity: 1, unitPrice: price }]
    })
  }

  const handleProductClick = (product: Product) => {
    const isPizza = categories.find((c: any) => c.id === product.categoryId)?.slug === 'pizzas'
    if (isPizza && extras.length > 0) setExtrasModalData(product)
    else handleAdd(product, [])
  }

  const handleConfirmExtras = (selectedExtras: ProductExtra[]) => {
    if (extrasModalData) {
      handleAdd(extrasModalData, selectedExtras)
      setExtrasModalData(null)
    }
  }

  const handleSubmit = () => {
    if (cart.length === 0) return
    const payload = {
      items: cart.map(i => ({
        productId: i.productId,
        extraIds: i.extras.map((e: any) => e.id),
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    }
    addItemsMutation.mutate(payload)
  }

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white">Añadir a la Orden #{orderId}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Menu */}
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            <div className="flex gap-3">
              <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
              <select value={selectedCategory || ''} onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)} className="input-field w-48">
                <option value="">Categorías</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 pr-2">
              {filtered.map((p: Product) => (
                <div key={p.id} onClick={() => handleProductClick(p)} className="glass-panel p-3 cursor-pointer hover:bg-white/10 transition-colors flex flex-col justify-between h-24">
                  <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-brand-400 font-bold text-sm">${p.basePrice.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="w-80 bg-black/40 border-l border-white/10 flex flex-col p-4">
            <h4 className="font-semibold text-sm mb-3">Nuevos Ítems</h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.map(item => (
                <div key={item.id} className="bg-white/5 rounded-lg p-2 text-sm flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.quantity}x {item.name}</p>
                    {item.extras.length > 0 && <p className="text-[10px] text-gray-400">+ {item.extras.map((e:any) => e.name).join(', ')}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-brand-400">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-gray-500 text-sm text-center py-10">Agrega productos del menú</p>}
            </div>
            <div className="pt-4 border-t border-white/10 mt-4">
              <div className="flex justify-between font-bold mb-4"><span>Total Extra:</span><span className="text-brand-400">${subtotal.toFixed(2)}</span></div>
              <button 
                onClick={handleSubmit} 
                disabled={cart.length === 0 || addItemsMutation.isPending} 
                className="btn-primary w-full disabled:opacity-50"
              >
                {addItemsMutation.isPending ? 'Guardando...' : 'Confirmar Adición'}
              </button>
            </div>
          </div>
        </div>

        {extrasModalData && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
             <div className="glass-panel p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Adicionales para {extrasModalData.name}</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                   {extras.map((e: any) => (
                     <button key={e.id} onClick={() => handleConfirmExtras([e])} className="p-2 border border-white/10 rounded-lg hover:bg-brand-500/20 text-sm">
                       {e.name} (+${e.price})
                     </button>
                   ))}
                </div>
                <button onClick={() => handleConfirmExtras([])} className="btn-secondary w-full">Sin Adicionales</button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Orders Page ──────────────────────────────────────────

export default function OrdersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all') // 'all', 'dine_in', 'takeaway'
  
  // States for Modals
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, orderId: number, total: number, paid: number } | null>(null)
  const [tableModal, setTableModal] = useState<{ isOpen: boolean, orderId: number } | null>(null)
  const [addItemsModal, setAddItemsModal] = useState<{ isOpen: boolean, orderId: number } | null>(null)

  const [detailModal, setDetailModal] = useState<number | null>(null)
  const [confirmState, setConfirmState] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' as any
  })

  // We fetch all active/unreleased orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
    refetchInterval: 15_000 // auto refresh every 15s
  })

  // Mutations
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] })
  })

  const updateTable = useMutation({
    mutationFn: ({ id, tableId }: { id: number, tableId: number | null }) => api.patch(`/orders/${id}/table`, { tableId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['tables-pos'] })
      setTableModal(null)
    }
  })

  const updateType = useMutation({
    mutationFn: ({ id, type }: { id: number, type: string }) => api.patch(`/orders/${id}/type`, { type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['tables-pos'] })
    }
  })

  const registerPayment = useMutation({
    mutationFn: ({ id, method, amount, tip }: { id: number, method: string, amount: number, tip?: number }) => api.post(`/orders/${id}/payments`, { method, amount, tip }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      setPaymentModal(null)
    }
  })

  const releaseTableMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/orders/${id}/release-table`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['tables'] })
      qc.invalidateQueries({ queryKey: ['tables-pos'] })
    }
  })

  // Mark an unpaid dine_in order as delivered to the table (food arrived, payment pending)
  const handleMarkServed = (order: any) => {
    setConfirmState({
      isOpen: true,
      title: 'Marcar como Entregada',
      message: `¿Confirmas que la orden ${order.order_number} fue entregada a la mesa ${order.table_name || ''}? La mesa quedará en estado "Entregada" y la orden permanecerá abierta en cobros pendientes.`,
      type: 'primary',
      onConfirm: () => {
        updateStatus.mutate({ id: order.id, status: 'served' })
        setConfirmState(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Mark a paid order as fully delivered (goes to history, table → served)
  const handleMarkDelivered = (order: any) => {
    setConfirmState({
      isOpen: true,
      title: 'Marcar como Entregada',
      message: `¿Confirmas que la orden ${order.order_number} fue entregada?${order.table_name ? ` La mesa ${order.table_name} quedará en estado "Entregada".` : ''} El pedido pasará a historial/limpieza.`,
      type: 'primary',
      onConfirm: () => {
        updateStatus.mutate({ id: order.id, status: 'delivered' })
        setConfirmState(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Release a table from a delivered paid order
  const handleReleaseTable = (order: any) => {
    setConfirmState({
      isOpen: true,
      title: 'Liberar Mesa',
      message: `¿Deseas liberar la mesa ${order.table_name || ''}? Quedará disponible para nuevos clientes.`,
      type: 'primary',
      onConfirm: () => {
        releaseTableMutation.mutate(order.id)
        setConfirmState(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleToggleType = (order: any) => {
    if (order.type === 'dine_in') {
      setConfirmState({
        isOpen: true,
        title: 'Cambiar a Para Llevar',
        message: `¿Deseas cambiar la orden ${order.order_number} a 'Para Llevar'? Esto liberará la mesa ${order.table_name || ''}.`,
        type: 'warning' as any,
        onConfirm: () => {
          updateType.mutate({ id: order.id, type: 'takeaway' })
          setConfirmState(prev => ({ ...prev, isOpen: false }))
        }
      })
    } else {
      updateType.mutate({ id: order.id, type: 'dine_in' })
      setTableModal({ isOpen: true, orderId: order.id })
    }
  }

  // Time elapsed helper — handle UTC timestamps from SQLite (may lack 'Z')
  const getTimeElapsed = (isoDate: string) => {
    const raw = isoDate.endsWith('Z') ? isoDate : isoDate + 'Z'
    const diff = Math.floor((Date.now() - new Date(raw).getTime()) / 60000)
    const d = Math.max(0, diff)
    if (d < 1)   return 'Ahora mismo'
    if (d < 60)  return `Hace ${d} min`
    if (d < 1440) return `Hace ${Math.floor(d/60)} h ${d%60} min`
    return `Hace ${Math.floor(d/1440)} d`
  }

  if (isLoading) return <div className="p-6 text-gray-500">Cargando comandas...</div>

  // Filter orders based on search input and type filter
  const filteredOrders = orders.filter((o: any) => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.table_name && o.table_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = 
      selectedType === 'all' || o.type === selectedType;

    return matchesSearch && matchesType;
  })

  // Column 1: Cocina (Active, preparing, ready to go)
  const preparingOrders = filteredOrders.filter(
    (o: any) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  )

  // Column 2: Por Cobrar (Served and unpaid)
  const servedUnpaidOrders = filteredOrders.filter(
    (o: any) => o.status === 'served' && !o.paid
  )

  // Column 3: Mesas por Liberar (Delivered and table occupied)
  const tablesToRelease = filteredOrders.filter(
    (o: any) => o.status === 'delivered' && o.table_id !== null
  )

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Tablero Operativo de Órdenes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Control de cocina, cobros y liberación de mesas en tiempo real.</p>
        </div>
        <p className="text-gray-500 text-xs bg-white/5 border border-white/8 px-3 py-1 rounded-full flex-shrink-0">
          Auto-actualización · 15s
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-black/30 p-4 rounded-2xl border border-white/5 flex-shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por orden, mesa o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-9 py-2 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'dine_in', label: 'Comer Aquí' },
            { id: 'takeaway', label: 'Para Llevar' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === type.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        
        {/* Column 1: Cocina / Por Entregar */}
        <div className="flex flex-col h-full bg-black/25 rounded-2xl border border-white/5 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-amber-500/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-white text-base">Cocina / Por Entregar</h2>
            </div>
            <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/10">
              {preparingOrders.length}
            </span>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {preparingOrders.map((order: any) => {
              const pending = Math.max(0, (order.total || 0) + (order.tip || 0) - (order.total_paid || 0))
              return (
                <div
                  key={order.id}
                  className="flex flex-col rounded-xl border border-white/8 bg-white/4 p-4 hover:bg-white/6 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-950/10 transition-all gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-gray-500 font-medium tracking-wider truncate">{order.order_number}</p>
                      <p className="text-xl font-bold text-white mt-0.5">${((order.total || 0) + (order.tip || 0)).toFixed(2)}</p>
                      {order.tip > 0 && (
                        <p className="text-[10px] text-brand-400 font-semibold mt-0.5">
                          Orden: ${(order.total || 0).toFixed(2)} + Propina: ${(order.tip || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDetailModal(order.id)}
                      title="Ver detalles"
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-500/25 border border-white/8 hover:border-brand-500/40 flex items-center justify-center text-gray-400 hover:text-brand-400 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pills */}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300">
                      <span className="text-gray-500">Mesa:</span>
                      {order.table_name ? <span className="font-semibold text-white">{order.table_name}</span> : <span className="text-gray-500 italic">Llevar</span>}
                    </span>
                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300">
                      {order.type === 'dine_in' ? 'Comer Aquí' : 'Para Llevar'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {getTimeElapsed(order.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.paid ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/10">PAGADO</span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/10">PENDIENTE PAGO</span>
                    )}

                    {order.status === 'pending' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/10">PENDIENTE</span>}
                    {order.status === 'confirmed' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/10">CONFIRMADO</span>}
                    {order.status === 'preparing' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/20 animate-pulse">PREPARANDO</span>}
                    {order.status === 'ready' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/10">¡LISTO!</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'preparing' })}
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/20 transition-all"
                      >
                        👨‍🍳 Empezar Preparación
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'ready' })}
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20 transition-all"
                      >
                        🛎️ Marcar como Listo
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => {
                          if (order.paid) {
                            handleMarkDelivered(order)
                          } else {
                            handleMarkServed(order)
                          }
                        }}
                        className="w-full py-1.5 text-xs font-bold rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/20 transition-all flex items-center justify-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        {order.paid ? 'Entregar Comanda' : 'Entregar (sin cobrar)'}
                      </button>
                    )}

                    {!order.paid && (
                      <button
                        onClick={() => setPaymentModal({ isOpen: true, orderId: order.id, total: order.total, paid: order.total_paid })}
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Cobrar
                      </button>
                    )}

                    {/* Utility actions */}
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <button
                        onClick={() => setAddItemsModal({ isOpen: true, orderId: order.id })}
                        className="py-1 px-2 text-[10px] font-medium rounded bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10"
                      >
                        + Añadir Ítems
                      </button>
                      <button
                        onClick={() => handleToggleType(order)}
                        className="py-1 px-2 text-[10px] font-medium rounded bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10"
                      >
                        {order.type === 'dine_in' ? 'Llevar' : 'Comer Aquí'}
                      </button>
                    </div>

                    {order.type === 'dine_in' && (
                      <button
                        onClick={() => setTableModal({ isOpen: true, orderId: order.id })}
                        className="w-full py-1 text-[10px] font-medium rounded bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10"
                      >
                        Cambiar Mesa
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {preparingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 py-16 text-center">
                <ChefHat className="w-10 h-10 mb-2 opacity-25" />
                <p className="text-sm font-medium">No hay órdenes en cocina</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Por Cobrar (Servidas) */}
        <div className="flex flex-col h-full bg-black/25 rounded-2xl border border-white/5 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-rose-500/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-400" />
              <h2 className="font-bold text-white text-base">Servidas (Por Cobrar)</h2>
            </div>
            <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-500/10">
              {servedUnpaidOrders.length}
            </span>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {servedUnpaidOrders.map((order: any) => {
              const pending = Math.max(0, (order.total || 0) + (order.tip || 0) - (order.total_paid || 0))
              return (
                <div
                  key={order.id}
                  className="flex flex-col rounded-xl border border-white/8 bg-white/4 p-4 hover:bg-white/6 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-950/10 transition-all gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-gray-500 font-medium tracking-wider truncate">{order.order_number}</p>
                      <p className="text-xl font-bold text-white mt-0.5">${((order.total || 0) + (order.tip || 0)).toFixed(2)}</p>
                      {order.tip > 0 && (
                        <p className="text-[10px] text-brand-400 font-semibold mt-0.5">
                          Orden: ${(order.total || 0).toFixed(2)} + Propina: ${(order.tip || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDetailModal(order.id)}
                      title="Ver detalles"
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-500/25 border border-white/8 hover:border-brand-500/40 flex items-center justify-center text-gray-400 hover:text-brand-400 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pills */}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300">
                      <span className="text-gray-500">Mesa:</span>
                      {order.table_name ? <span className="font-semibold text-white">{order.table_name}</span> : <span className="text-gray-500 italic">Llevar</span>}
                    </span>
                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300">
                      {order.type === 'dine_in' ? 'Comer Aquí' : 'Para Llevar'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {getTimeElapsed(order.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/10">PENDIENTE PAGO</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/10">ENTREGADA</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setPaymentModal({ isOpen: true, orderId: order.id, total: order.total, paid: order.total_paid })}
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 hover:border-emerald-400 text-emerald-300 shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      💳 Cobrar Orden
                    </button>

                    {/* Utility actions */}
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <button
                        onClick={() => setAddItemsModal({ isOpen: true, orderId: order.id })}
                        className="py-1 px-2 text-[10px] font-medium rounded bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10"
                      >
                        + Añadir Ítems
                      </button>
                      <button
                        onClick={() => handleToggleType(order)}
                        className="py-1 px-2 text-[10px] font-medium rounded bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10"
                      >
                        {order.type === 'dine_in' ? 'Llevar' : 'Comer Aquí'}
                      </button>
                    </div>

                    {order.type === 'dine_in' && (
                      <button
                        onClick={() => setTableModal({ isOpen: true, orderId: order.id })}
                        className="w-full py-1 text-[10px] font-medium rounded bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10"
                      >
                        Cambiar Mesa
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {servedUnpaidOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 py-16 text-center">
                <CheckCircle2 className="w-10 h-10 mb-2 opacity-25" />
                <p className="text-sm font-medium">Sin cuentas pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Mesas por Liberar */}
        <div className="flex flex-col h-full bg-black/25 rounded-2xl border border-white/5 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-sky-500/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-white text-base">Mesas por Liberar</h2>
            </div>
            <span className="bg-sky-500/20 text-sky-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-500/10">
              {tablesToRelease.length}
            </span>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {tablesToRelease.map((order: any) => {
              return (
                <div
                  key={order.id}
                  className="flex flex-col rounded-xl border border-white/8 bg-white/4 p-4 hover:bg-white/6 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-950/10 transition-all gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-gray-500 font-medium tracking-wider truncate">{order.order_number}</p>
                      <p className="text-xl font-bold text-white mt-0.5">${((order.total || 0) + (order.tip || 0)).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setDetailModal(order.id)}
                      title="Ver detalles"
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-500/25 border border-white/8 hover:border-brand-500/40 flex items-center justify-center text-gray-400 hover:text-brand-400 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pills */}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300">
                      <span className="text-gray-500">Mesa:</span>
                      {order.table_name ? <span className="font-semibold text-white">{order.table_name}</span> : <span className="text-gray-500 italic">Sin asignar</span>}
                    </span>
                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300">
                      Comer Aquí
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {getTimeElapsed(order.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/10">PAGADO</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/10">MESA OCUPADA</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleReleaseTable(order)}
                      disabled={releaseTableMutation.isPending}
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 hover:border-sky-500/50 text-sky-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      {releaseTableMutation.isPending ? 'Liberando...' : '🏁 Liberar Mesa'}
                    </button>
                  </div>
                </div>
              )
            })}
            {tablesToRelease.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 py-16 text-center">
                <DoorOpen className="w-10 h-10 mb-2 opacity-25" />
                <p className="text-sm font-medium">No hay mesas por liberar</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {detailModal !== null && (
        <OrderDetailModal orderId={detailModal} onClose={() => setDetailModal(null)} />
      )}

      {/* Modals */}
      {paymentModal && (
        <PaymentModal 
          totalPaid={paymentModal.paid}
          subtotalTotal={paymentModal.total}
          onClose={() => setPaymentModal(null)}
          onConfirm={(method, amount, tip) => registerPayment.mutate({ 
            id: paymentModal.orderId, 
            method, 
            amount, 
            tip: tip > 0 ? tip : undefined 
          })}
          loading={registerPayment.isPending}
        />
      )}

      {tableModal && (
        <TableSelectModal 
          onClose={() => setTableModal(null)}
          onSelect={(tableId) => updateTable.mutate({ id: tableModal.orderId, tableId })}
        />
      )}

      {addItemsModal && (
        <AddItemsModal 
          orderId={addItemsModal.orderId}
          onClose={() => setAddItemsModal(null)}
        />
      )}

      <ConfirmModal 
        {...confirmState}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

