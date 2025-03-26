"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

export interface CartItem {
  id: number
  name: string
  price: number
  salePrice: number | null
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
})

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [firestoreAvailable, setFirestoreAvailable] = useState(true)
  const { user } = useAuth()

  // Load cart from localStorage or Firestore when component mounts or user changes
  useEffect(() => {
    const loadCart = async () => {
      // First try to load from localStorage as a quick start
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error)
        }
      }

      // If user is logged in, try to load from Firestore
      if (user && firestoreAvailable) {
        try {
          const cartDoc = await getDoc(doc(db, "carts", user.uid))
          if (cartDoc.exists()) {
            setItems(cartDoc.data().items || [])
          }
        } catch (error) {
          console.error("Error loading cart from Firestore:", error)
          // Mark Firestore as unavailable if we get a permission error
          setFirestoreAvailable(false)
          // Continue using localStorage data that was already loaded
        }
      }
    }

    loadCart()
  }, [user, firestoreAvailable])

  // Save cart to localStorage or Firestore when it changes
  useEffect(() => {
    const saveCart = async () => {
      // Always save to localStorage as a backup
      localStorage.setItem("cart", JSON.stringify(items))

      // If user is logged in and Firestore is available, try to save there too
      if (user && firestoreAvailable && items.length > 0) {
        try {
          await setDoc(doc(db, "carts", user.uid), { items }, { merge: true })
        } catch (error) {
          console.error("Error saving cart to Firestore:", error)
          setFirestoreAvailable(false)
          // Already saved to localStorage, so data is not lost
        }
      }
    }

    saveCart()
  }, [items, user, firestoreAvailable])

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prevItems, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem("cart")

    if (user && firestoreAvailable) {
      try {
        setDoc(doc(db, "carts", user.uid), { items: [] }, { merge: true }).catch((error) => {
          console.error("Error clearing cart in Firestore:", error)
          setFirestoreAvailable(false)
        })
      } catch (error) {
        console.error("Error clearing cart:", error)
      }
    }
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  const subtotal = items.reduce((total, item) => {
    const price = item.salePrice || item.price
    return total + price * item.quantity
  }, 0)

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

