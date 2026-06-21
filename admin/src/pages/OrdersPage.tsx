import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus, CreditCard, X, UtensilsCrossed, Eye, CheckCircle2, AlertCircle, Trash2, ShoppingBag } from 'lucide-react'
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
            const secTables = tables.filter((t: any) => t.section_id === sec.id)
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
  const [tab, setTab] = useState<'open'|'paid'>('open')
  
  // States for Modals
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, orderId: number, total: number, paid: number } | null>(null)
  const [tableModal, setTableModal] = useState<{ isOpen: boolean, orderId: number } | null>(null)
  const [addItemsModal, setAddItemsModal] = useState<{ isOpen: boolean, orderId: number } | null>(null)

  const [detailModal, setDetailModal] = useState<number | null>(null)
  const [confirmState, setConfirmState] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' as any
  })

  // We fetch open orders (paid=0) and paid orders (paid=1)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', tab],
    queryFn: () => api.get(`/orders?paid=${tab === 'paid' ? 'true' : 'false'}`).then(r => r.data),
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

  const handleFinalize = (order: any) => {
    setConfirmState({
      isOpen: true,
      title: 'Finalizar Orden',
      message: `¿Estás seguro de finalizar la orden ${order.order_number}? Esto cerrará la mesa y enviará la orden al historial.`,
      type: 'primary',
      onConfirm: () => {
        updateStatus.mutate({ id: order.id, status: 'delivered' })
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

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Gestión de Órdenes</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              tab === 'open'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {orders.length} activa{orders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-0.5">Auto-actualización cada 15 s</p>
        </div>
        
        <div className="flex gap-1.5 bg-black/50 p-1.5 rounded-2xl border border-white/8 backdrop-blur-sm">
           <button 
             onClick={() => setTab('open')} 
             className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
               tab === 'open'
                 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                 : 'text-gray-500 hover:text-gray-300'
             }`}
           >
             Abiertas
           </button>
           <button 
             onClick={() => setTab('paid')} 
             className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
               tab === 'paid'
                 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                 : 'text-gray-500 hover:text-gray-300'
             }`}
           >
             Pagadas
           </button>
        </div>
      </div>


      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
                <UtensilsCrossed className="w-9 h-9 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-semibold">Sin órdenes {tab === 'open' ? 'abiertas' : 'pagadas'}</p>
                <p className="text-gray-600 text-sm mt-1">Las nuevas órdenes aparecerán aquí automáticamente</p>
              </div>
            </div>
          )}
          
          {orders.map((order: any) => {
            const pending = Math.max(0, (order.total || 0) + (order.tip || 0) - (order.total_paid || 0))
            const isFullyPaid = pending === 0
            return (
              <div
                key={order.id}
                className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                  tab === 'open'
                    ? 'bg-gradient-to-b from-amber-950/30 to-black/60 border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-950/50'
                    : 'bg-gradient-to-b from-emerald-950/30 to-black/60 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-950/50'
                }`}
              >
                {/* Accent stripe */}
                <div className={`h-1 w-full ${
                  tab === 'open' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`} />

                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] text-gray-500 font-medium tracking-wider truncate">{order.order_number}</p>
                      <p className={`text-2xl font-bold mt-0.5 ${
                        tab === 'open' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>${((order.total || 0) + (order.tip || 0)).toFixed(2)}</p>
                      {order.tip > 0 && (
                        <p className="text-[10px] text-brand-400 font-semibold mt-0.5">
                          Orden: ${(order.total || 0).toFixed(2)} + Propina: ${(order.tip || 0).toFixed(2)}
                        </p>
                      )}
                      {order.total_paid > 0 && order.total_paid < ((order.total || 0) + (order.tip || 0)) && (
                        <p className="text-[10px] text-orange-400 font-semibold mt-0.5">
                          Abonado: ${(order.total_paid).toFixed(2)} · Falta: ${pending.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDetailModal(order.id)}
                      title="Ver detalles"
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-brand-500/20 border border-white/8 hover:border-brand-500/40 flex items-center justify-center text-gray-500 hover:text-brand-400 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/6 border border-white/8 text-gray-300">
                      <span className="text-gray-500">Mesa:</span>
                      {order.table_name
                        ? <span className="font-semibold text-white">{order.table_name}</span>
                        : <span className="text-gray-500 italic">Sin asignar</span>
                      }
                    </span>
                    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/6 border border-white/8 text-gray-300">
                      {order.type === 'dine_in' ? 'Comer Aquí' : order.type === 'takeaway' ? 'Para Llevar' : order.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/6 border border-white/8 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {getTimeElapsed(order.created_at)}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-auto">
                    {tab === 'open' ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setAddItemsModal({ isOpen: true, orderId: order.id })}
                            className="py-2 px-3 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
                          >
                            + Añadir Ítems
                          </button>
                          <button
                            onClick={() => handleToggleType(order)}
                            className="py-2 px-3 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all flex items-center justify-center gap-1"
                          >
                            {order.type === 'dine_in' ? (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Llevar
                              </>
                            ) : (
                              <>
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                                Comer Aquí
                              </>
                            )}
                          </button>
                        </div>
                        {order.type === 'dine_in' && (
                          <button
                            onClick={() => setTableModal({ isOpen: true, orderId: order.id })}
                            className="w-full py-2 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
                          >
                            Cambiar Mesa
                          </button>
                        )}
                        <button
                          onClick={() => setPaymentModal({ isOpen: true, orderId: order.id, total: order.total, paid: order.total_paid })}
                          className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 transition-all"
                        >
                          💳 Cobrar Orden
                        </button>
                        <button
                          onClick={() => handleFinalize(order)}
                          className="w-full py-2 text-xs font-medium rounded-lg border border-dashed border-white/10 hover:border-white/25 text-gray-600 hover:text-gray-400 transition-all"
                        >
                          Orden Finalizada (sin cobrar)
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {isFullyPaid ? (
                            <button
                              onClick={() => setAddItemsModal({ isOpen: true, orderId: order.id })}
                              className="py-2 px-3 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
                            >
                              + Añadir más ítems
                            </button>
                          ) : (
                            <button
                              onClick={() => setPaymentModal({ isOpen: true, orderId: order.id, total: order.total, paid: order.total_paid })}
                              className="py-2 px-3 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 transition-all truncate"
                              title={`Cobrar Diferencia — $${pending.toFixed(2)}`}
                            >
                              ⚠️ Cobrar (${pending.toFixed(2)})
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleType(order)}
                            className="py-2 px-3 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all flex items-center justify-center gap-1"
                          >
                            {order.type === 'dine_in' ? (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Llevar
                              </>
                            ) : (
                              <>
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                                Comer Aquí
                              </>
                            )}
                          </button>
                        </div>
                        {order.type === 'dine_in' && (
                          <button
                            onClick={() => setTableModal({ isOpen: true, orderId: order.id })}
                            className="w-full py-2 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
                          >
                            Cambiar Mesa
                          </button>
                        )}
                        <button
                          onClick={() => handleFinalize(order)}
                          className="w-full py-2.5 text-xs font-bold rounded-lg bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 hover:border-brand-500/60 text-brand-400 transition-all"
                        >
                          {order.type === 'dine_in' ? '✓ Cerrar Mesa' : '✓ Finalizar Orden'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
          onConfirm={(method, amount, tip) => registerPayment.mutate({ id: paymentModal.orderId, method, amount, tip })}
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
