import { createContext, useContext, useState } from 'react'
import { convertFromBDTRaw, getCurrencyForCountry } from '../utils/currency'

const CartContext = createContext({})
export function useCart() { return useContext(CartContext) }

// cartItem: { postId, postTitle, bannerUrl, supplierId, supplierName, item: { id, name, imageUrl, price, size, color }, qty }
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  function addItem(post, item, qty = 1, size = '', color = '') {
    const key = `${post.id}_${item.id}_${size}_${color}`
    setItems(prev => {
      const existing = prev.find(i => i.key === key)
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i)
      return [...prev, {
        key,
        postId: post.id,
        postTitle: post.title,
        bannerUrl: post.bannerUrl || post.imageUrl || '',
        supplierId: post.supplierId,
        supplierName: post.supplierName,
        item: { ...item },
        qty,
        size,
        color,
      }]
    })
    setIsOpen(true)
  }

  function removeItem(key) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function updateQty(key, qty) {
    if (qty < 1) { removeItem(key); return }
    setItems(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
  }

  function clearCart() { setItems([]) }

  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  function getTotalInCountry(country) {
    const curr = getCurrencyForCountry(country)
    const total = items.reduce((s, i) => {
      const bdtPrice = parseFloat(i.item.price) || 0
      return s + convertFromBDTRaw(bdtPrice * i.qty, country)
    }, 0)
    return { total, symbol: curr.symbol, code: curr.code }
  }

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQty, clearCart, totalItems, getTotalInCountry }}>
      {children}
    </CartContext.Provider>
  )
}