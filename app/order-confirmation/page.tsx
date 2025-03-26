"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Truck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getOrderFromFirestore, formatOrderId } from "@/lib/firebase-utils"

interface OrderData {
  id: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
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
    quantity: number
    image: string
  }>
  amounts: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  payment: {
    method: string
    status: string
    cardLastFour?: string
  }
  status: string
  createdAt: any
}

export default function OrderConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [displayOrderId, setDisplayOrderId] = useState("")

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        router.push("/")
        return
      }

      try {
        // Format display order ID
        setDisplayOrderId(formatOrderId(orderId))

        // Try to get the order from Firestore
        const firestoreResult = await getOrderFromFirestore(orderId)

        if (firestoreResult.success) {
          setOrder(firestoreResult.order as OrderData)
        } else {
          // Try to get the order from localStorage
          const offlineOrders = JSON.parse(localStorage.getItem("offlineOrders") || "[]")
          const offlineOrder = offlineOrders.find((o: any) => o.id === orderId)

          if (offlineOrder) {
            setOrder({
              ...offlineOrder,
              createdAt: new Date(offlineOrder.createdAt),
            })
          } else {
            // If we can't find the order, create a fallback order
            createFallbackOrder()
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        createFallbackOrder()
      } finally {
        setLoading(false)
      }
    }

    const createFallbackOrder = () => {
      // Create a fallback order with minimal information
      setOrder({
        id: orderId || "UNKNOWN",
        customer: {
          firstName: "Valued",
          lastName: "Customer",
          email: user?.email || "customer@example.com",
          phone: "1234567890",
        },
        shippingAddress: {
          address: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        },
        items: [],
        amounts: {
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
        },
        payment: {
          method: "credit-card",
          status: "processing",
          cardLastFour: "3456",
        },
        status: "placed",
        createdAt: new Date(),
      })

      // Set a default display order ID
      setDisplayOrderId(`SUN-${orderId?.slice(0, 6).toUpperCase() || "000000"}`)
    }

    fetchOrder()
  }, [orderId, router, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-maroon-700 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const orderDate =
    order.createdAt instanceof Date
      ? order.createdAt
      : order.createdAt?.toDate?.()
        ? order.createdAt.toDate()
        : new Date()

  return (
    <div className="bg-gradient-to-b from-maroon-50 to-gold-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gold-100">
          <div className="text-center">
            <div className="bg-green-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-gray-900">Thank You for Your Order!</h1>
            <p className="mt-2 text-lg text-gray-600">Your order has been received and is being processed.</p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-medium text-lg">{displayOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">
                  {orderDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Shipping Address</p>
              <p className="font-medium">
                {order.customer.firstName} {order.customer.lastName}
                <br />
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                <br />
                India
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">
                {order.payment.method === "credit-card"
                  ? order.payment.cardLastFour
                    ? `Credit Card (ending in ${order.payment.cardLastFour})`
                    : "Credit Card"
                  : "Cash on Delivery"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-4">Order Status</p>
              <div className="relative">
                {/* Order Placed */}
                <div className="flex items-center mb-8">
                  <div className="bg-green-500 rounded-full h-10 w-10 flex items-center justify-center z-10">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-gray-500">
                      {orderDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Processing */}
                <div className="flex items-center mb-8">
                  <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center z-10">
                    <Clock className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-700">Processing</p>
                    <p className="text-sm text-gray-500">Expected in 1-2 days</p>
                  </div>
                </div>

                {/* Shipped */}
                <div className="flex items-center">
                  <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center z-10">
                    <Truck className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-700">Shipped</p>
                    <p className="text-sm text-gray-500">Expected in 3-5 days</p>
                  </div>
                </div>

                {/* Vertical line connecting status points */}
                <div className="absolute left-5 top-10 h-[calc(100%-20px)] w-0.5 bg-gray-200 -z-10"></div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="h-16 w-16 bg-gray-200 rounded relative flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover object-center rounded"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-base font-medium">₹{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{order.amounts.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {order.amounts.shipping === 0 ? "Free" : `₹${order.amounts.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{order.amounts.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-xl font-bold text-maroon-700">₹{order.amounts.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-maroon-700 to-maroon-800 hover:from-maroon-800 hover:to-maroon-900 text-white"
            >
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

