import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  categories: any[];
  onSave: (data: any) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, product, categories, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    categoryId: '',
    isOnWebMenu: true
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          basePrice: product.base_price.toString(),
          categoryId: product.category_id?.toString() || (categories[0]?.id.toString() || ''),
          isOnWebMenu: product.is_on_web_menu === 1
        });
      } else {
        setFormData({
          name: '',
          description: '',
          basePrice: '',
          categoryId: categories[0]?.id.toString() || '',
          isOnWebMenu: true
        });
      }
    }
  }, [isOpen, product, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: product?.id,
      name: formData.name,
      description: formData.description,
      basePrice: parseFloat(formData.basePrice) || 0,
      categoryId: parseInt(formData.categoryId, 10),
      isOnWebMenu: formData.isOnWebMenu,
      isActive: product ? product.is_active : 1
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="glass-panel-dark w-full max-w-md p-6 scale-in-center overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nombre del Producto</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field w-full text-sm" placeholder="Ej. Hamburguesa Doble" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Descripción</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field w-full text-sm min-h-[80px]" placeholder="Breve descripción del producto (Opcional)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Precio Base ($)</label>
              <input required type="number" step="0.01" min="0" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="input-field w-full text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Categoría</label>
              <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="input-field w-full text-sm">
                <option value="">Selecciona...</option>
                {categories.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg border border-white/5 bg-white/5">
            <input type="checkbox" id="webMenu" checked={formData.isOnWebMenu} onChange={e => setFormData({...formData, isOnWebMenu: e.target.checked})} className="accent-brand-500 w-4 h-4 cursor-pointer" />
            <label htmlFor="webMenu" className="text-sm text-gray-300 font-medium cursor-pointer flex-1">Mostrar en Menú Web (Landing Page)</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{product ? 'Guardar Cambios' : 'Crear Producto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
