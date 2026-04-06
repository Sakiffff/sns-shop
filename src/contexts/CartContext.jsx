import { createContext, useContext, useState } from 'react'

const CartContext = createContext({})
export function useCart() { return useContext(CartContext) }

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // { post, qty }
  const [isOpen, setIsOpen] = useState(false)

  function addToCart(post) {
    setItems(prev => {
      const existing = prev.find(i => i.post.id === post.id)
      if (existing) return prev.map(i => i.post.id === post.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { post, qty: 1 }]
    })
    setIsOpen(true)
  }

  function removeFromCart(postId) {
    setItems(prev => prev.filter(i => i.post.id !== postId))
  }

  function updateQty(postId, qty) {
    if (qty < 1) { removeFromCart(postId); return }
    setItems(prev => prev.map(i => i.post.id === postId ? { ...i, qty } : i))
  }

  function clearCart() { setItems([]) }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalCost = items.reduce((sum, i) => {
    const price = parseFloat(i.post.price) || 0
    const moq = parseInt(i.post.moq) || 1
    return sum + (price * i.qty * moq)
  }, 0)

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalCost }}>
      {children}
    </CartContext.Provider>
  )
}