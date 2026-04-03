import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import AuthPage from './pages/AuthPage'
import CartPage from './pages/CartPage'

export default function App() {
  return (
    <div className="min-h-screen bg-stone-950">
      <Navbar />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </div>
  )
}
