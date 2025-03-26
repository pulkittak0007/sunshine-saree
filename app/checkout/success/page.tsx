"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, ShoppingBag, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatOrderId, getOrderFromFirestore } from "@/lib/firebase-utils"

interface OrderSummary {
  id: string
  customer: {
    firstName: string
    lastName: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
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
  }
  createdAt: any
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [displayOrderId, setDisplayOrderId] = useState("")
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      router.push("/")
      return
    }

    setDisplayOrderId(formatOrderId(orderId))

    // Fetch basic order details
    const fetchOrderSummary = async () => {
      try {
        const result = await getOrderFromFirestore(orderId)
        if (result.success) {
          setOrder(result.order as OrderSummary)
        } else {
          // Try to get from localStorage
          const offlineOrders = JSON.parse(localStorage.getItem("offlineOrders") || "[]")
          const offlineOrder = offlineOrders.find((o: any) => o.id === orderId)
          if (offlineOrder) {
            setOrder({
              ...offlineOrder,
              createdAt: new Date(offlineOrder.createdAt),
            })
          }
        }
      } catch (error) {
        console.error("Error fetching order summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderSummary()

    // Redirect to full order confirmation page after 10 seconds
    const timer = setTimeout(() => {
      router.push(`/order-confirmation?id=${orderId}`)
    }, 10000)

    return () => clearTimeout(timer)
  }, [orderId, router])

  if (!orderId) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-maroon-50 to-gold-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="bg-green-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold mt-6 mb-2">Thank You for Your Order!</h1>
          <p className="text-gray-600 mb-2">Your order has been received and is being processed.</p>
          <p className="text-sm text-gray-500">
            You will be redirected to your detailed order page in a few seconds...
          </p>
        </div>

        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-xl font-bold">{displayOrderId}</p>
          </div>

          {order && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium">
                {(order.createdAt instanceof Date
                  ? order.createdAt
                  : order.createdAt?.toDate?.()
                    ? order.createdAt.toDate()
                    : new Date()
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {order && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
              <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-12 w-12 relative flex-shrink-0 mr-3">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">₹{item.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{order.amounts.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{order.amounts.shipping === 0 ? "Free" : `₹${order.amounts.shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>₹{order.amounts.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t mt-2">
                  <span>Total</span>
                  <span className="text-maroon-700">₹{order.amounts.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Order Status</h2>
              <div className="flex items-center mb-2">
                <div className="bg-green-500 rounded-full h-8 w-8 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">Order Placed</p>
                  <p className="text-xs text-gray-500">Your order has been confirmed</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full h-8 w-8 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-700">Processing</p>
                  <p className="text-xs text-gray-500">Your order is being processed</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-maroon-700 to-maroon-800 hover:from-maroon-800 hover:to-maroon-900 text-white"
          >
            <Link href={`/order-confirmation?id=${orderId}`}>
              View Order Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 border-2 border-maroon-700 text-maroon-700 hover:bg-maroon-700 hover:text-white"
          >
            <Link href="/shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

