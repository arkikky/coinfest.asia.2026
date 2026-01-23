"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Container from "@/components/Customs/Container";
import { OrderPaymentStatus } from "@/types/store/order";

interface OrderData {
  id_orders: string;
  order_id: string;
  payment_status: OrderPaymentStatus;
  grand_order_total: number;
  created_at: string;
}

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("process");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("Order ID not found");
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        // @fetch(order data)
        const orderResponse = await fetch(
          `/api/v1/orders?id_orders=${encodeURIComponent(orderId)}`
        );
        
        if (!orderResponse.ok) {
          throw new Error("Failed to fetch order");
        }
        
        const orderResult = await orderResponse.json();
        const orderData = orderResult?.data as OrderData;
        
        // @check(payment_status)
        if (orderData?.payment_status === "paid") {
          setAccessDenied(true);
          // Redirect to order received page after a short delay
          setTimeout(() => {
            router.replace(`/checkout/order-received?process=${orderId}`);
          }, 2000);
          setLoading(false);
          return;
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error("Error fetching order data:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, router]);

  // @loading(order details)
  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading order details...</div>
        </div>
      </Container>
    );
  }

  // @access(denied - payment_status is paid)
  if (accessDenied) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-lg text-gray-600">
            This order has been paid. Redirecting to order confirmation...
          </div>
        </div>
      </Container>
    );
  }

  // @error(order details)
  if (error || !order) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-lg text-red-600">
            {error || "Order not found"}
          </div>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* @card(order failed) */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 shadow-sm">
            {/* @icon(failed) */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center size-20 rounded-full bg-red-100 border-2 border-red-500">
                <CheckCircle2 className="size-10 text-white" strokeWidth={2} fill="rgb(239 68 68)" />
              </div>
            </div>

            {/* @heading */}
            <h1 className="text-2xl font-bold text-gray-900 uppercase text-center mb-4">
              YOUR ORDER FAILED!
            </h1>

            {/* @message */}
            <div className="text-center text-gray-700 mb-6 space-y-2">
              <p>
                Your order couldn&apos;t be completed. Please try again. If
              </p>
              <p>
                you need help, contact us at{" "}
                <a
                  href="mailto:support@coinfest.asia"
                  className="text-primary underline hover:text-primary/80"
                >
                  support@coinfest.asia
                </a>
              </p>
            </div>

            {/* @button(try again) */}
            <div className="flex justify-center">
              <Button
                variant="default"
                size="lg"
                onClick={() => {
                  // Navigate back to checkout or tickets page
                  router.push("/tickets");
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function OrderFailed() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg text-gray-600">Loading order details...</div>
          </div>
        </Container>
      }
    >
      <OrderFailedContent />
    </Suspense>
  );
}
