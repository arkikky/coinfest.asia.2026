"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "@/components/Customs/Container";

interface OrderData {
  id_orders: string;
  order_id: string;
  payment_status: string;
  paid_at: string;
  grand_order_total: number;
  discount_amount: number;
  order_subtotal: number;
  id_customers: string;
  id_coupons?: string | null;
  created_at: string;
}

interface CustomerData {
  billing_name: string;
  billing_email: string;
  billing_company: string | null;
}

interface OrderItemsData {
  quantity: number;
  subtotal: number;
  product?: {
    product_name: string;
    price: number;
    price_sale: number | null;
  };
}

interface CouponData {
  coupon_code_name: string;
  discount_percentage?: number;
  discount_amount?: number;
}

export default function OrderReceived() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("process");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemsData[]>([]);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const emailSentRef = useRef(false);

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
        setOrder(orderData);

        // @fetch(customer data) - optional, will show N/A if not available
        if (orderData?.id_customers) {
          try {
            const customerResponse = await fetch(
              `/api/v1/customers?id_customers=${encodeURIComponent(
                orderData.id_customers
              )}`
            );

            if (customerResponse.ok) {
              const customerResult = await customerResponse.json();
              setCustomer(customerResult?.data as CustomerData);
            }
          } catch {
            // Customer API might not exist, continue without it
          }
        }

        // @fetch(order items) - optional
        try {
          const itemsResponse = await fetch(
            `/api/v1/order-items?id_orders=${encodeURIComponent(orderId)}`
          );
          if (itemsResponse.ok) {
            const itemsResult = await itemsResponse.json();
            const items = itemsResult?.data || [];

            // @fetch(products for each item) - optional
            const itemsWithProducts = await Promise.all(
              items.map(async (item: any) => {
                try {
                  const productResponse = await fetch(
                    `/api/v1/products?id_products=${encodeURIComponent(
                      item.id_products
                    )}`
                  );
                  if (productResponse.ok) {
                    const productResult = await productResponse.json();
                    return {
                      ...item,
                      product: productResult?.data,
                    };
                  }
                  return item;
                } catch {
                  return item;
                }
              })
            );
            setOrderItems(itemsWithProducts);
          }
        } catch {
          // Order items API might fail, continue without it
        }

        // @fetch(coupon data if exists) - optional
        if (orderData?.id_coupons) {
          try {
            const couponResponse = await fetch(
              `/api/v1/coupons?id_coupons=${encodeURIComponent(
                orderData.id_coupons
              )}`
            );
            if (couponResponse.ok) {
              const couponResult = await couponResponse.json();
              setCoupon(couponResult?.data as CouponData);
            }
          } catch {
            // Coupon API might fail, continue without it
          }
        }

      } catch (err) {
        console.error("Error fetching order data:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // @send(email notification after order and customer data are loaded)
  useEffect(() => {
    if (!order || !customer || loading || emailSentRef.current) return;

    const sendEmail = async () => {
      emailSentRef.current = true; // Prevent multiple sends
      const isFree = (order.grand_order_total || 0) <= 0;
      try {
        const emailResponse = await fetch("/api/emails/order-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id_orders,
            email: customer.billing_email,
            fullname: customer.billing_name,
            amount: order.grand_order_total || 0,
            isFree: isFree,
            sentAt: new Date().toISOString(),
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send order confirmation email");
          emailSentRef.current = false; // Allow retry on failure
        }
      } catch (emailError) {
        console.error("Error sending order confirmation email:", emailError);
        emailSentRef.current = false; // Allow retry on failure
        // Don't throw - email failure shouldn't stop the page from loading
      }
    };

    sendEmail();
  }, [order, customer, loading]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading order details...</div>
        </div>
      </Container>
    );
  }

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

  const transactionDate = formatDate(order.paid_at || order.created_at);
  const totalAmount = order.grand_order_total || 0;
  const discountAmount = order.discount_amount || 0;

  return (
    <Container>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* @left(side - success message) */}
          <div className="flex flex-col items-start justify-start gap-6">
            {/* @success(icon) */}
            <div className="flex items-center justify-center size-24 rounded-full bg-green-500 text-white">
              <CheckCircle2 className="size-12" strokeWidth={2} />
            </div>

            {/* @title */}
            <h1 className="text-4xl font-bold text-gray-900">
              YOUR ORDER IS COMPLETE!
            </h1>

            {/* @message */}
            <p className="text-base text-gray-600 leading-relaxed">
              Your payment was successful, and your order is complete! Check
              your email for the invoice and e-ticket. If you don&apos;t receive
              them within 24 hours, please contact{" "}
              <a
                href="mailto:support@coinfest.asia"
                className="text-primary underline hover:text-primary/80"
              >
                support@coinfest.asia
              </a>
              .
            </p>

            {/* @button(share badge) */}
            <Button
              variant="default"
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Share2 className="size-4" />
              Share your Coinfest badge!
            </Button>

            {/* @button(back to home) */}
            <Button
              variant="outline"
              size="default"
              onClick={() => router.push("/")}
              className="mt-auto"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </div>

          {/* @right(side - order details card) */}
          <div className="flex items-start justify-start">
            <Card className="w-full bg-linear-to-br from-blue-500 to-red-500 text-white border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white">
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* @order(id) */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/80">Order ID</span>
                  <span className="text-lg font-semibold text-white">
                    #{order.order_id || order.id_orders}
                  </span>
                </div>

                {/* @transaction(date) */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/80">
                    Transaction Date
                  </span>
                  <span className="text-lg font-semibold text-white">
                    {transactionDate}
                  </span>
                </div>

                {/* @name */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/80">Name</span>
                  <span className="text-lg font-semibold text-white">
                    {customer?.billing_name || "N/A"}
                  </span>
                </div>

                {/* @email */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/80">Email</span>
                  <span className="text-lg font-semibold text-white">
                    {customer?.billing_email || "N/A"}
                  </span>
                </div>

                {/* @company */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/80">Company</span>
                  <span className="text-lg font-semibold text-white">
                    {customer?.billing_company || "N/A"}
                  </span>
                </div>

                {/* @payment(method) */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/80">Payment Method</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-fit bg-black/20 hover:bg-black/30 text-white border border-white/20"
                    disabled
                  >
                    All Support Payment
                  </Button>
                </div>

                {/* @discount(coupon) */}
                {coupon && discountAmount > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-white/80">
                      Discount Coupon
                    </span>
                    <span className="text-lg font-semibold text-white">
                      {coupon.coupon_code_name} -{" "}
                      {formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                {/* @total */}
                <div className="flex flex-col gap-1 pt-4 border-t border-white/20">
                  <span className="text-sm text-white/80">
                    Total (inc. Tax)
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
