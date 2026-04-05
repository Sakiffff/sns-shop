import { createContext, useContext, useState } from 'react'

const CartContext = createContext({})
export function useCart() { return useContext(CartContext) }

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // [{ supplier, qty, note }]
  const [isOpen, setIsOpen] = useState(false)

  function addToCart(supplier) {
    setItems(prev => {
      const existing = prev.find(i => i.supplier.id === supplier.id)
      if (existing) return prev.map(i => i.supplier.id === supplier.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { supplier, qty: 1, note: '' }]
    })
    setIsOpen(true)
  }

  function removeFromCart(supplierId) {
    setItems(prev => prev.filter(i => i.supplier.id !== supplierId))
  }

  function updateNote(supplierId, note) {
    setItems(prev => prev.map(i => i.supplier.id === supplierId ? { ...i, note } : i))
  }

  function updateQty(supplierId, qty) {
    if (qty < 1) { removeFromCart(supplierId); return }
    setItems(prev => prev.map(i => i.supplier.id === supplierId ? { ...i, qty } : i))
  }

  function clearCart() { setItems([]) }

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addToCart, removeFromCart, updateNote, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}
