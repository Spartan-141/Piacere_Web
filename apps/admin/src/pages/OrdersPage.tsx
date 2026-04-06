import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Filter, CheckCircle, Clock } from 'lucide-react'
import api from '../services/api'
import ConfirmModal from '../components/ConfirmModal'

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo'
}

const statusColors: Record<string, string> = {
  pending: 'bg-red-500/10 border-red-500/40 text-red-500',
  preparing: 'bg-amber-500/10 border-amber-500/40 text-amber-500',
  ready: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
}

export default function OrdersPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all'|'pending'|'preparing'|'ready'>('all')
  const [confirmState, setConfirmState] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' as any
  })

  // We fetch pending, preparing and ready
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['active-orders'],
    queryFn: () => api.get('/orders').then(r => r.data.filter((o: any) => ['pending', 'preparing', 'ready'].includes(o.status))),
    refetchInterval: 10_000 // auto refresh every 10s
  })

  // We need items for each order, but the GET /orders doesn't return items.
  // Wait, GET /orders just returns orders. To see items we need GET /orders/:id.
  // Unless we optimize this, we might want to fetch items too, but let's see. 
  // For this version we will fetch the items explicitly or change GET /orders in backend.
  // Actually, wait, the user wants "Cocina/Órdenes Activas". We can do a GET /orders/active which includes items, OR just show basic order info here and click to see details.
  // We'll show the basic info and a generic action button.

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-orders'] })
  })

  const filteredOrders = orders.filter((o: any) => filter === 'all' ? true : o.status === filter)

  const advanceOrder = (order: any) => {
    const nextStatusMap: Record<string, string> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'delivered'
    }
    const nextStatus = nextStatusMap[order.status]
    if (nextStatus) {
       updateStatus.mutate({ id: order.id, status: nextStatus })
    }
  }

  // Helper date format
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) return <div className="p-6 text-gray-500">Cargando comandas...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Órdenes en Espera (Cocina / Barra)</h1>
          <p className="text-gray-500 text-sm">Gestiona el flujo de los pedidos activos.</p>
        </div>
        
        <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
           <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Todas</button>
           <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'pending' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>Pendientes</button>
           <button onClick={() => setFilter('preparing')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'preparing' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}>Preparando</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500 glass-panel">No hay órdenes activas en este estado.</div>
        )}
        
        {filteredOrders.map((order: any) => (
          <div key={order.id} className="glass-panel p-4 flex flex-col gap-4 border-t-4 border-t-brand-500">
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-lg font-bold text-white">{order.order_number}</h2>
                 <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {formatTime(order.created_at)}</p>
               </div>
               <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 border rounded-lg ${statusColors[order.status]}`}>
                 {statusLabels[order.status]}
               </span>
            </div>

            <div className="bg-black/30 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                 <span className="text-gray-400 text-xs">Mesa:</span>
                 <span className="text-white font-medium">{order.table_name || 'Sin asignar'}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-gray-400 text-xs">Tipo:</span>
                 <span className="text-brand-300 font-medium capitalize">{order.type.replace('_',' ')}</span>
              </div>
            </div>

            <button 
               onClick={() => advanceOrder(order)}
               className={`mt-auto py-2.5 rounded-lg text-sm font-semibold transition-all ${order.status === 'ready' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'}`}
            >
              {order.status === 'pending' ? 'Comenzar Preparación' : order.status === 'preparing' ? 'Marcar como Listo' : 'Entregar'}
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal 
        {...confirmState}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
