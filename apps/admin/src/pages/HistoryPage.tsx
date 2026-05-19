import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  History, Eye, X, CreditCard, CheckCircle2, XCircle,
  Search, CalendarDays, UtensilsCrossed, ChevronDown
} from 'lucide-react'
import api from '../services/api'

// ── Order Detail Modal (same as in OrdersPage) ─────────────
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
        <div className="flex justify-between items-center p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">{data?.order_number ?? 'Cargando...'}</h3>
            {data && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(data.created_at).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-10">Cargando detalles...</div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Mesa</p>
                <p className="text-sm font-bold text-white">{data.table_name || 'Sin asignar'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tipo</p>
                <p className="text-sm font-bold text-white capitalize">{data.type.replace('_', ' ')}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  data.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {data.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {data.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                </span>
              </div>
            </div>

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
                    <p className="text-sm font-bold text-gray-300">${(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {data.payments && data.payments.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Pagos Registrados</h4>
                <div className="space-y-1.5">
                  {data.payments.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm text-emerald-300 font-medium">{methodLabel[p.method] ?? p.method}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">${parseFloat(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-black/40 rounded-xl p-4 border border-white/8 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>${parseFloat(data.subtotal).toFixed(2)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Descuento</span><span>-${parseFloat(data.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2 mt-1">
                <span>Total</span><span className="text-brand-400">${parseFloat(data.total).toFixed(2)}</span>
              </div>
              {data.total_paid > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Total Cobrado</span><span className="font-bold">${parseFloat(data.total_paid).toFixed(2)}</span>
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

// ── Main History Page ─────────────────────────────────────────
export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'cancelled'>('all')
  const [detailModal, setDetailModal] = useState<number | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-history', dateFilter],
    queryFn: () => {
      let url = '/orders/history'
      if (dateFilter) url += `?date=${dateFilter}`
      return api.get(url).then(r => r.data)
    },
  })

  // Client-side filter for search + status
  const filtered = orders.filter((o: any) => {
    const matchSearch =
      !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.table_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  // Stats
  const totalRevenue = filtered.reduce((sum: number, o: any) => sum + parseFloat(o.total_paid || 0), 0)
  const deliveredCount = filtered.filter((o: any) => o.status === 'delivered').length
  const cancelledCount = filtered.filter((o: any) => o.status === 'cancelled').length

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-400" />
            Historial de Órdenes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Consulta todas las órdenes finalizadas y canceladas.</p>
        </div>

        {/* Stats pills */}
        <div className="flex gap-3">
          <div className="glass-panel px-4 py-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ingresos</p>
            <p className="text-lg font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="glass-panel px-4 py-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Entregadas</p>
            <p className="text-lg font-bold text-white">{deliveredCount}</p>
          </div>
          <div className="glass-panel px-4 py-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Canceladas</p>
            <p className="text-lg font-bold text-red-400">{cancelledCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 flex-shrink-0">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por # orden o mesa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-9"
          />
        </div>

        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="input-field pl-9 pr-3 w-44"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="input-field w-44 appearance-none pr-10"
          >
            <option value="all">Todos los estados</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        {(search || dateFilter || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter('all') }}
            className="btn-ghost text-sm text-gray-400 hover:text-white"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/5">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-3">
            <UtensilsCrossed className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">No hay órdenes en el historial</p>
            {dateFilter && <p className="text-xs text-gray-600">Prueba con otra fecha</p>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/70 backdrop-blur-sm border-b border-white/8">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider"># Orden</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Mesa</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Fecha</th>
                <th className="text-center px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Cobrado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filtered.map((order: any) => (
                <tr key={order.id} className="hover:bg-white/3 transition-colors group">
                  <td className="px-4 py-3 font-mono text-xs text-white font-semibold">{order.order_number}</td>
                  <td className="px-4 py-3 text-gray-300">{order.table_name || <span className="text-gray-600 italic">Sin mesa</span>}</td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{order.type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span className="block text-gray-600">
                      {new Date(order.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {order.status === 'delivered'
                        ? <><CheckCircle2 className="w-3 h-3" /> Entregado</>
                        : <><XCircle className="w-3 h-3" /> Cancelado</>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">
                    ${parseFloat(order.total_paid || 0).toFixed(2)}
                    {parseFloat(order.total_paid || 0) < parseFloat(order.total || 0) && (
                      <span className="block text-[10px] text-red-400 font-normal line-through">${parseFloat(order.total).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetailModal(order.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-brand-400 p-1"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailModal !== null && (
        <OrderDetailModal orderId={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  )
}
