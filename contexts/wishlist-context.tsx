"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

export interface WishlistItem {
  id: number
  name: string
  price: number
  salePrice: number | null
  image: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: number) => void
  isInWishlist: (id: number) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {},
})

export const useWishlist = () => useContext(WishlistContext)

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [firestoreAvailable, setFirestoreAvailable] = useState(true)
  const { user } = useAuth()

  // Load wishlist from localStorage or Firestore when component mounts or user changes
  useEffect(() => {
    const loadWishlist = async () => {
      // First try to load from localStorage as a quick start
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        try {
          setItems(JSON.parse(savedWishlist))
        } catch (error) {
          console.error("Error parsing wishlist from localStorage:", error)
        }
      }

      // If user is logged in, try to load from Firestore
      if (user && firestoreAvailable) {
        try {
          const wishlistDoc = await getDoc(doc(db, "wishlists", user.uid))
          if (wishlistDoc.exists()) {
            setItems(wishlistDoc.data().items || [])
          }
        } catch (error) {
          console.error("Error loading wishlist from Firestore:", error)
          // Mark Firestore as unavailable if we get a permission error
          setFirestoreAvailable(false)
          // Continue using localStorage data that was already loaded
        }
      }
    }

    loadWishlist()
  }, [user, firestoreAvailable])

  // Save wishlist to localStorage or Firestore when it changes
  useEffect(() => {
    const saveWishlist = async () => {
      // Always save to localStorage as a backup
      localStorage.setItem("wishlist", JSON.stringify(items))

      // If user is logged in and Firestore is available, try to save there too
      if (user && firestoreAvailable) {
        try {
          await setDoc(doc(db, "wishlists", user.uid), { items }, { merge: true })
        } catch (error) {
          console.error("Error saving wishlist to Firestore:", error)
          setFirestoreAvailable(false)
          // Already saved to localStorage, so data is not lost
        }
      }
    }

    saveWishlist()
  }, [items, user, firestoreAvailable])

  const addItem = (item: WishlistItem) => {
    setItems((prevItems) => {
      if (prevItems.some((i) => i.id === item.id)) {
        return prevItems
      }
      return [...prevItems, item]
    })
  }

  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const isInWishlist = (id: number) => {
    return items.some((item) => item.id === id)
  }

  const clearWishlist = () => {
    setItems([])
    localStorage.removeItem("wishlist")

    if (user && firestoreAvailable) {
      try {
        setDoc(doc(db, "wishlists", user.uid), { items: [] }, { merge: true }).catch((error) => {
          console.error("Error clearing wishlist in Firestore:", error)
          setFirestoreAvailable(false)
        })
      } catch (error) {
        console.error("Error clearing wishlist:", error)
      }
    }
  }

  const value = {
    items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

