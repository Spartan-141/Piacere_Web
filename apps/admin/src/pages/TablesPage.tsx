import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, ShoppingBag, Plus, Settings } from 'lucide-react'
import api from '../services/api'

const statusColors: Record<string, string> = {
  free:          'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
  waiting_order: 'bg-red-500/10 border-red-500/40 text-red-400',
  served:        'bg-blue-500/10 border-blue-500/40 text-blue-400',
  reserved:      'bg-amber-500/10 border-amber-500/40 text-amber-400',
}

const tableBorderColors: Record<string, string> = {
  free:          'border-emerald-500/30 ring-emerald-500/5',
  waiting_order: 'border-red-600/60 ring-red-500/20 animate-pulse-subtle',
  served:        'border-blue-500/60 ring-blue-500/20',
  reserved:      'border-amber-500/50 ring-amber-500/10',
}

const statusLabel: Record<string, string> = {
  free: 'Libre', waiting_order: 'Esperando', served: 'Entregada', reserved: 'Reservada',
}

export default function TablesPage() {
  const qc = useQueryClient()
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)

  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then(r => r.data),
    refetchInterval: 15_000,
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => api.get('/tables/sections').then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/tables/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  })

  const createTable = useMutation({
    mutationFn: (data: any) => api.post('/tables', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
      setShowTableModal(false)
    },
  })

  const createSection = useMutation({
    mutationFn: (data: any) => api.post('/tables/sections', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  })

  const deleteSection = useMutation({
    mutationFn: ({ id, force }: { id: number, force?: boolean }) => 
      api.delete(`/tables/sections/${id}${force ? '?force=true' : ''}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] })
      qc.invalidateQueries({ queryKey: ['tables'] }) // Also invalidate tables if they were deleted
    },
    onError: (error: any, variables) => {
      const resp = error.response?.data;
      if (resp?.error === 'CONFIRM_TABLE_DELETE') {
        if (window.confirm(resp.message)) {
          deleteSection.mutate({ id: variables.id, force: true });
        }
      } else {
        alert(resp?.error || 'Error al eliminar zona');
      }
    }
  })

  const handleOpenOrder = (tableId: number) => {
    // Aquí invocaremos la lógica del POS asociada a esta tabla.
    // Ej: setTableContext(tableId) -> navigate('/pos')
    alert(`Redirigiendo a registro POS para la Mesa #${tableId}. (Próximamente)`)
  }

  const groupedTables: Record<string, any[]> = {}
  for (const table of tables) {
    const sName = table.sectionName || 'Sin Sección'
    if (!groupedTables[sName]) groupedTables[sName] = []
    groupedTables[sName].push(table)
  }

  if (loadingTables) return <div className="p-6 text-gray-500">Cargando mesas...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Mesas y Zonas</h1>
          <p className="text-gray-500 text-sm">Organiza tu restaurante por áreas.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setShowSectionModal(true)} className="btn-secondary flex items-center gap-2">
            <Settings className="w-4 h-4" /> Administrar Zonas
          </button>
          <button onClick={() => setShowTableModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Mesa
          </button>
        </div>
      </div>

      <div className="flex gap-3 text-xs flex-wrap">
        {Object.entries(statusLabel).map(([s, l]) => (
          <span key={s} className={`px-2 py-1 rounded-full ${statusColors[s]}`}>{l}</span>
        ))}
      </div>

      {Object.entries(groupedTables).map(([sectionName, sTables]) => (
        <div key={sectionName}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{sectionName}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sTables.map((table: any) => (
              <div
                key={table.id}
                className={`glass-panel p-4 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02] border-2 ring-2 ${
                  tableBorderColors[table.status] || 'border-white/10 ring-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white text-lg">{table.name}</p>
                  <div className="flex items-center gap-1 text-gray-400 bg-white/5 px-2 py-1 rounded">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">{table.capacity || '?'}</span>
                  </div>
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${statusColors[table.status]}`}>
                  {statusLabel[table.status]}
                </span>

                <div className="flex flex-col gap-2 mt-auto pt-2 grid grid-cols-2">
                  <button
                    onClick={() => updateStatus.mutate({ 
                      id: table.id, 
                      status: table.status === 'reserved' ? 'free' : 'reserved' 
                    })}
                    className="text-xs py-1.5 rounded-lg font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  >
                    {table.status === 'reserved' ? 'Liberar' : 'Reservada'}
                  </button>

                  <button
                    onClick={() => updateStatus.mutate({ 
                      id: table.id, 
                      status: table.status === 'served' ? 'free' : 'served' 
                    })}
                    className="text-xs py-1.5 rounded-lg font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                  >
                    {table.status === 'served' ? 'Limpiar' : 'Entregada'}
                  </button>

                  <button
                    onClick={() => {
                        updateStatus.mutate({ id: table.id, status: 'waiting_order' })
                        handleOpenOrder(table.id)
                    }}
                    className="col-span-2 text-xs py-1.5 rounded-lg font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    Abrir Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* --- MODAL PARA GESTIÓN DE SECCIONES --- */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-dark w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">Administrar Zonas (Secciones)</h3>
            <div className="space-y-4 mb-4">
              {sections.map((sec: any) => (
                <div key={sec.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <div>
                    <p className="font-semibold text-white text-sm">{sec.name}</p>
                    <p className="text-xs text-gray-500">Prefijo: {sec.prefix}</p>
                  </div>
                  <button onClick={() => deleteSection.mutate({ id: sec.id })} className="btn-danger !py-1 !px-2 text-xs">Eliminar</button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                createSection.mutate({ name: fd.get('name'), prefix: (fd.get('prefix') as string).toUpperCase() })
                e.currentTarget.reset()
              }}
              className="flex gap-2 mb-6"
            >
              <input name="name" placeholder="Ej. Terraza" required className="input-field flex-1 text-sm" />
              <input name="prefix" placeholder="Pref. Ej: T" required maxLength={2} className="input-field w-20 text-sm uppercase" />
              <button type="submit" className="btn-primary text-sm shrink-0">Añadir</button>
            </form>

            <button onClick={() => setShowSectionModal(false)} className="btn-secondary w-full">Finalizar</button>
          </div>
        </div>
      )}

      {/* --- MODAL PARA CREACIÓN DE MESA --- */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-dark w-full max-w-xs p-6">
            <h3 className="text-lg font-bold text-white mb-4">Nueva Mesa</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                createTable.mutate({ sectionId: fd.get('sectionId'), capacity: fd.get('capacity') })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Sección / Zona</label>
                <select name="sectionId" required className="input-field w-full text-sm">
                  {sections.map((s: any) => <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Capacidad Sillas</label>
                <input name="capacity" type="number" min="1" required defaultValue="4" className="input-field w-full text-sm" />
              </div>
              <p className="text-xs text-gray-500 italic">El nombre de mesa se asignará automáticamente (ej: T1, P3...)</p>
              
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowTableModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Crear Mesa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
