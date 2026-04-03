import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, DollarSign, Grid2X2, AlertTriangle } from 'lucide-react'
import api from '../services/api'

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', today],
    queryFn: () => api.get(`/orders?date=${today}`).then(r => r.data),
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => api.get('/inventory/alerts').then(r => r.data),
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then(r => r.data),
  })

  const todayRevenue = orders
    .filter((o: any) => o.status === 'delivered')
    .reduce((sum: number, o: any) => sum + o.total, 0)

  const activeOrders = orders.filter((o: any) =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  )

  const occupiedTables = tables.filter((t: any) => t.status === 'occupied').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}    label="Ingresos hoy" value={`$${todayRevenue.toFixed(2)}`} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={ShoppingBag}   label="Pedidos activos" value={activeOrders.length}          color="bg-brand-500/20 text-brand-400" />
        <StatCard icon={Grid2X2}       label="Mesas ocupadas" value={`${occupiedTables}/${tables.length}`} color="bg-amber-500/20 text-amber-400" />
        <StatCard icon={AlertTriangle} label="Alertas de stock" value={alerts.length}               color="bg-red-500/20 text-red-400" />
      </div>

      {/* Active Orders */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Pedidos Activos</h2>
        {activeOrders.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">No hay pedidos activos</p>
        ) : (
          <div className="space-y-2">
            {activeOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 bg-white/4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{order.table_name || order.type}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full badge-${order.status}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">${order.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <div className="card border border-red-500/20">
          <h2 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Stock Bajo
          </h2>
          <div className="space-y-2">
            {alerts.map((m: any) => (
              <div key={m.id} className="flex justify-between text-sm px-3 py-2 bg-red-500/5 rounded-lg">
                <span className="text-gray-300">{m.name}</span>
                <span className="text-red-400 font-medium">{m.stock_quantity} {m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
