import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWebCartStore } from '../store/useWebCartStore'

export default function CartDrawer() {
  const { isOpen, setOpen, items, total, removeItem, updateQuantity } = useWebCartStore()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-stone-900 border-l border-stone-800 z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-brand-400" /> Tu Pedido
          </h2>
          <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-600 gap-2">
              <ShoppingCart className="w-12 h-12" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-stone-800/50 rounded-xl p-3 flex gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                      + {item.extras.map(e => e.name).join(', ')}
                    </p>
                  )}
                  <p className="text-brand-400 font-bold text-sm mt-1">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeItem(item.id)} className="text-stone-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-stone-800 space-y-3">
            <div className="flex justify-between font-bold text-white">
              <span>Total</span>
              <span className="text-brand-400">${total().toFixed(2)}</span>
            </div>
            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="btn-cta w-full text-center block"
            >
              Proceder al Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
