import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface ComboFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  combo?: any;
  products: any[];
  onSave: (data: any) => void;
}

const ComboFormModal: React.FC<ComboFormModalProps> = ({ isOpen, onClose, combo, products, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isOnWebMenu: true
  });
  
  const [items, setItems] = useState<{productId: string, quantity: number}[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (combo) {
        setFormData({
          name: combo.name,
          description: combo.description || '',
          price: combo.price.toString(),
          isOnWebMenu: combo.is_on_web_menu === 1
        });
        setItems(combo.items?.map((i: any) => ({ productId: i.product_id.toString(), quantity: i.quantity })) || []);
      } else {
        setFormData({ name: '', description: '', price: '', isOnWebMenu: true });
        setItems([{ productId: products[0]?.id?.toString() || '', quantity: 1 }]);
      }
    }
  }, [isOpen, combo, products]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('El combo debe tener al menos un producto');
    if (items.some(i => !i.productId || i.quantity < 1)) return alert('Completa todos los productos del combo correctamente.');
    
    onSave({
      id: combo?.id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      isOnWebMenu: formData.isOnWebMenu,
      items: items.map(i => ({ productId: parseInt(i.productId, 10), quantity: i.quantity }))
    });
  };

  const addItem = () => setItems([...items, { productId: products[0]?.id?.toString() || '', quantity: 1 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, val: string|number) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = val;
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="glass-panel-dark w-full max-w-lg p-6 scale-in-center overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {combo ? 'Editar Combo' : 'Nuevo Combo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Nombre del Combo</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field w-full text-sm" placeholder="Ej. Combo Familiar" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Precio Total ($)</label>
              <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="input-field w-full text-sm" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Descripción</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field w-full text-sm min-h-[60px]" placeholder="(Opcional)" />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-white/5 bg-white/5">
            <input type="checkbox" id="comboWebMenu" checked={formData.isOnWebMenu} onChange={e => setFormData({...formData, isOnWebMenu: e.target.checked})} className="accent-brand-500 w-4 h-4 cursor-pointer" />
            <label htmlFor="comboWebMenu" className="text-sm text-gray-300 font-medium cursor-pointer flex-1">Mostrar en Menú Web (Landing Page)</label>
          </div>

          <div className="mt-6 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Productos del Combo</h3>
              <button type="button" onClick={addItem} className="text-xs flex items-center gap-1 bg-brand-500/20 text-brand-400 px-2 py-1 rounded hover:bg-brand-500/30 transition-colors">
                <Plus className="w-3 h-3"/> Añadir Producto
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex-1">
                    <select required value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="input-field w-full text-sm !py-1.5">
                      <option value="">Selecciona un producto</option>
                      {products.map(p => <option key={p.id} value={p.id} className="bg-gray-900">{p.name} (${p.base_price?.toFixed(2)})</option>)}
                    </select>
                  </div>
                  <div className="w-20 border-l border-white/10 pl-2">
                    <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value, 10))} className="input-field w-full text-sm text-center !py-1.5" />
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 p-1.5" title="Remover producto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No hay productos en el combo</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{combo ? 'Guardar Cambios' : 'Crear Combo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComboFormModal;
