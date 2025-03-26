import { db } from "./firebase"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"

// Format order ID with SUN prefix
export const formatOrderId = (id: string) => {
  return `SUN-${id.slice(0, 6).toUpperCase()}`
}

// Save order to Firestore
export const saveOrderToFirestore = async (orderData: {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    userId: string | null
  }
  shippingAddress: {
    address: string
    city: string
    state: string
    pincode: string
  }
  items: Array<{
    id: number
    name: string
    price: number
    originalPrice: number
    quantity: number
    image: string
  }>
  payment: {
    method: string
    status: string
    cardLastFour?: string
  }
  amounts: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  notes?: string
  status: string
}) => {
  try {
    // Clean the order data to remove undefined values
    const cleanOrderData = JSON.parse(JSON.stringify(orderData))

    // Add timestamp
    const orderWithTimestamp = {
      ...cleanOrderData,
      createdAt: serverTimestamp(),
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, "orders"), orderWithTimestamp)
    console.log("Order saved to Firestore with ID:", docRef.id)

    return {
      success: true,
      orderId: docRef.id,
    }
  } catch (error) {
    console.error("Error saving order to Firestore:", error)
    return {
      success: false,
      error,
    }
  }
}

// Get order from Firestore
export const getOrderFromFirestore = async (orderId: string) => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    if (orderDoc.exists()) {
      return {
        success: true,
        order: {
          id: orderDoc.id,
          ...orderDoc.data(),
        },
      }
    } else {
      return {
        success: false,
        error: "Order not found",
      }
    }
  } catch (error) {
    console.error("Error fetching order from Firestore:", error)
    return {
      success: false,
      error,
    }
  }
}

// Save order to localStorage as fallback
export const saveOrderToLocalStorage = (orderId: string, orderData: any) => {
  try {
    // Add creation date
    const orderWithDate = {
      ...orderData,
      createdAt: new Date().toISOString(),
    }

    // Remove any circular references or non-serializable data
    const cleanOrderData = JSON.parse(JSON.stringify(orderWithDate))

    // Get existing orders or initialize empty array
    const offlineOrders = JSON.parse(localStorage.getItem("offlineOrders") || "[]")

    // Add new order
    offlineOrders.push({
      id: orderId,
      ...cleanOrderData,
    })

    // Save back to localStorage
    localStorage.setItem("offlineOrders", JSON.stringify(offlineOrders))

    return true
  } catch (localStorageError) {
    console.error("Error saving to localStorage:", localStorageError)
    return false
  }
}

