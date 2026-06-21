import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ExtraFormModalProps {
  isOpen: boolean
  onClose: () => void
  extra: any | null
  onSave: (data: any) => void
}

export default function ExtraFormModal({ isOpen, onClose, extra, onSave }: ExtraFormModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (extra && isOpen) {
      setName(extra.name)
      setPrice(extra.price.toString())
    } else if (isOpen) {
      setName('')
      setPrice('')
    }
  }, [extra, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...(extra ? { id: extra.id } : {}),
      name,
      price: parseFloat(price)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">{extra ? 'Editar Adicional' : 'Nuevo Adicional'}</h2>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Nombre del Adicional</label>
            <input 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="input-field w-full" 
              placeholder="Ej. Queso Extra" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Precio ($)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              min="0" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              className="input-field w-full" 
              placeholder="0.00" 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="btn-primary">{extra ? 'Actualizar' : 'Crear Adicional'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
