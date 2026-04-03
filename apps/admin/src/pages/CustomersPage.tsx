import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, DollarSign, ShoppingBag } from 'lucide-react'
import api from '../services/api'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers${search ? `?search=${search}` : ''}`).then(r => r.data),
  })

  const { data: detail } = useQuery({
    queryKey: ['customer-detail', selected?.id],
    queryFn: () => api.get(`/customers/${selected.id}`).then(r => r.data),
    enabled: !!selected,
  })

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" /> CRM — Clientes
          </h1>
          <p className="text-gray-500 text-sm">{customers.length} clientes registrados</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && <p className="text-gray-500 text-sm">Cargando...</p>}
          {customers.map((customer: any) => (
            <button
              key={customer.id}
              onClick={() => setSelected(customer)}
              className={`w-full text-left glass-panel p-3 hover:bg-white/8 transition-all ${
                selected?.id === customer.id ? 'ring-1 ring-brand-500/50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-white">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.email || '—'} · {customer.phone || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-400 font-semibold">${parseFloat(customer.total_spent || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-600">{customer.total_orders} pedido{customer.total_orders !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && detail && (
        <div className="w-80 border-l border-white/8 bg-black/30 p-5 overflow-y-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold">
              {detail.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-white">{detail.name}</p>
              <p className="text-xs text-gray-500">{detail.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <ShoppingBag className="w-4 h-4 text-brand-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{detail.orders?.length || 0}</p>
              <p className="text-xs text-gray-500">Pedidos</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">
                ${detail.orders?.reduce((s: number, o: any) => s + o.total, 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Gastado</p>
            </div>
          </div>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Últimos Pedidos</h3>
          <div className="space-y-1.5">
            {detail.orders?.slice(0, 8).map((order: any) => (
              <div key={order.id} className="flex justify-between text-xs bg-white/4 rounded px-2.5 py-2">
                <div>
                  <p className="text-gray-300 font-medium">{order.order_number}</p>
                  <p className="text-gray-600">{new Date(order.created_at).toLocaleDateString('es-VE')}</p>
                </div>
                <p className="text-brand-400 font-semibold">${order.total.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {detail.addresses?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Direcciones</h3>
              {detail.addresses.map((addr: any) => (
                <div key={addr.id} className="text-xs bg-white/4 rounded px-2.5 py-2 mb-1.5">
                  <p className="text-gray-400 font-medium">{addr.label || 'Sin etiqueta'}</p>
                  <p className="text-gray-300">{addr.address}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
