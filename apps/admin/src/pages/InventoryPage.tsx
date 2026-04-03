import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Package, AlertTriangle, TrendingDown } from 'lucide-react'
import api from '../services/api'

export default function InventoryPage() {
  const qc = useQueryClient()
  const [adjusting, setAdjusting] = useState<any | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjustType, setAdjustType] = useState<'purchase' | 'waste' | 'manual_adjustment'>('purchase')

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => api.get('/inventory/materials').then(r => r.data),
  })

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.get('/inventory/recipes').then(r => r.data),
  })

  const adjust = useMutation({
    mutationFn: ({ id, ...data }: any) => api.post(`/inventory/materials/${id}/adjust`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] })
      setAdjusting(null)
      setAdjustDelta('')
      setAdjustNotes('')
    },
  })

  const lowStock = materials.filter((m: any) => m.stock_quantity <= m.min_stock_alert)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Inventario & Escandallo</h1>
        <p className="text-gray-500 text-sm">{materials.length} materias primas · {recipes.length} recetas configuradas</p>
      </div>

      {/* Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="card border border-red-500/20">
          <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {lowStock.length} materi{lowStock.length > 1 ? 'as' : 'a'} bajo stock mínimo
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((m: any) => (
              <span key={m.id} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                {m.name}: {m.stock_quantity} {m.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Materials Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-400" /> Materias Primas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs text-gray-500 text-left">
                <th className="pb-2 font-medium">Material</th>
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 font-medium">Mínimo</th>
                <th className="pb-2 font-medium">Costo/Und</th>
                <th className="pb-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {materials.map((m: any) => (
                <tr key={m.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-2.5 font-medium text-white">{m.name}</td>
                  <td className="py-2.5">
                    <span className={`font-semibold ${
                      m.stock_quantity <= m.min_stock_alert ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {m.stock_quantity} <span className="text-gray-500 font-normal text-xs">{m.unit}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500">{m.min_stock_alert} {m.unit}</td>
                  <td className="py-2.5 text-gray-400">{m.cost_per_unit ? `$${m.cost_per_unit}` : '—'}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => setAdjusting(m)}
                      className="text-xs btn-secondary py-1 px-2"
                    >
                      Ajustar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipes */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-brand-400" /> Recetas (Escandallo)
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {recipes.map((recipe: any) => (
            <div key={recipe.id} className="bg-white/4 rounded-lg p-3">
              <p className="text-sm font-semibold text-white mb-2">
                {recipe.product_name}
                {recipe.variant_name && <span className="text-gray-500 font-normal"> · {recipe.variant_name}</span>}
              </p>
              <div className="space-y-1">
                {recipe.ingredients?.map((ing: any) => (
                  <div key={ing.id} className="flex justify-between text-xs text-gray-400">
                    <span>{ing.raw_material_name}</span>
                    <span className="text-gray-300">{ing.quantity} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {recipes.length === 0 && (
            <p className="text-gray-600 text-sm col-span-2 text-center py-4">No hay recetas configuradas</p>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {adjusting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-white mb-1">Ajustar Stock</h3>
            <p className="text-sm text-gray-500 mb-4">{adjusting.name} — actual: {adjusting.stock_quantity} {adjusting.unit}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tipo de movimiento</label>
                <select value={adjustType} onChange={e => setAdjustType(e.target.value as any)} className="input-field w-full text-sm">
                  <option value="purchase">Compra (+)</option>
                  <option value="waste">Merma (−)</option>
                  <option value="manual_adjustment">Ajuste manual</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Cantidad ({adjustType === 'waste' ? 'se restará' : 'se sumará'})
                </label>
                <input
                  type="number" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)}
                  className="input-field w-full" min="0" step="0.1"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas (opcional)</label>
                <input type="text" value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)} className="input-field w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setAdjusting(null)} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={() => adjust.mutate({
                    id: adjusting.id,
                    quantityDelta: adjustType === 'waste' ? -Math.abs(parseFloat(adjustDelta)) : Math.abs(parseFloat(adjustDelta)),
                    type: adjustType,
                    notes: adjustNotes,
                  })}
                  className="btn-primary flex-1"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
