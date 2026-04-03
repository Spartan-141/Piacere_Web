import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWebCartStore } from '../store/useWebCartStore'

export default function CartPage() {
  const { items, total, removeItem, updateQuantity, clearCart } = useWebCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-stone-700 mx-auto mb-4" />
        <h2 className="font-serif text-2xl text-white mb-2">Tu carrito está vacío</h2>
        <p className="text-stone-500 mb-6">Agrega algunas pizzas deliciosas para comenzar</p>
        <Link to="/menu" className="btn-cta inline-block">Ver Menú</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-white mb-8">Tu Pedido</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex gap-4">
              <div className="w-14 h-14 bg-stone-800 rounded-xl flex items-center justify-center text-2xl">🍕</div>
              <div className="flex-1">
                <p className="font-semibold text-white">{item.name}</p>
                {item.variantName && <p className="text-stone-500 text-sm">{item.variantName}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-stone-600 hover:text-red-400 transition-colors ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-400">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-stone-600">${item.unitPrice.toFixed(2)} c/u</p>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-stone-600 hover:text-red-400 transition-colors mt-2">
            Vaciar carrito
          </button>
        </div>

        {/* Summary */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 h-fit sticky top-20">
          <h2 className="font-semibold text-white mb-4">Resumen del Pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span><span>${total().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Delivery</span><span className="text-emerald-400">Gratis</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-2 border-t border-stone-800 mt-2">
              <span>Total</span><span className="text-brand-400">${total().toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Dirección de entrega</label>
              <input
                type="text"
                placeholder="Tu dirección..."
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <button className="btn-cta w-full">
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
