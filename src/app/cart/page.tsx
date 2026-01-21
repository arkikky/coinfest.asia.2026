"use client";
import { useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/stores/OrderStore";
import { getOrderId } from "@/lib/cookies";
import Container from "@/components/Customs/Container";
import PerviewCarts from "@/layouts/Store/PerviewCarts";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export default function Carts() {
  const router = useRouter();
  const orderItems = useOrderStore((state) => state?.orderItems);
  const fetchFromServer = useOrderStore((state) => state?.fetchFromServer);
  const currentOrderId = useOrderStore((state) => state?.currentOrderId);
  const loading = useOrderStore((state) => state?.loading);
  const clearSession = useOrderStore((state) => state?.clearSession);

  // @state(coupon store)
  const couponCode = useOrderStore((state) => state?.couponCode);
  const appliedCoupon = useOrderStore((state) => state?.appliedCoupon);
  const discountAmount = useOrderStore((state) => state?.discountAmount);
  const couponError = useOrderStore((state) => state?.couponError);
  const couponMessage = useOrderStore((state) => state?.couponMessage);
  const isApplyingCoupon = useOrderStore((state) => state?.isApplyingCoupon);

  // @coupons(action store)
  const setCouponCode = useOrderStore((state) => state?.setCouponCode);
  const applyCoupon = useOrderStore((state) => state?.applyCoupon);
  const removeCoupon = useOrderStore((state) => state?.removeCoupon);

  // @fetch(order items from server)
  useEffect(() => {
    const orderId = currentOrderId || getOrderId();
    if (orderId) {
      fetchFromServer();
    }
  }, [currentOrderId, fetchFromServer]);

  // @session(redirect when expired)
  useEffect(() => {
    const orderId = currentOrderId || getOrderId();
    if (!orderId) return;

    const controller = new AbortController();

    const verifySession = async () => {
      try {
        const response = await fetch(`/api/v1/orders?id_orders=${orderId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Order fetch failed: ${response.status}`);
        }

        const result = await response.json();
        const expiresAt = result?.data?.session_expires_at;
        const expiresMs = expiresAt ? Date.parse(expiresAt) : NaN;

        if (Number.isFinite(expiresMs) && expiresMs <= Date.now()) {
          clearSession();
          router.replace("/tickets");
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to verify order session:", error);
      }
    };

    verifySession();

    return () => controller.abort();
  }, [currentOrderId, clearSession, router]);

  // @calculate(store)
  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.subtotal, 0),
    [orderItems]
  );
  const tax = useMemo(
    () => (subtotal - discountAmount) * 0.11,
    [subtotal, discountAmount]
  );
  const grandTotal = useMemo(
    () => subtotal - discountAmount + tax,
    [subtotal, discountAmount, tax]
  );
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || isApplyingCoupon) return;
    await applyCoupon(couponCode);
  };

  const hasItems = orderItems.length > 0;

  const handleProceedToCheckout = () => {
    if (!hasItems) return;
    router.push("/checkout");
  };

  // @loading(store)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading cart...</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading cart...</div>
        </div>
      }
    >
      <Container>
        <PerviewCarts
          orderItems={orderItems}
          subtotal={subtotal}
          tax={tax}
          grandTotal={grandTotal}
          discountAmount={discountAmount}
          appliedCoupon={appliedCoupon}
          couponMessage={couponMessage}
          couponError={couponError}
          couponCode={couponCode}
          isApplyingCoupon={isApplyingCoupon}
          hasItems={hasItems}
          formatPrice={formatPrice}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={removeCoupon}
          onSetCouponCode={setCouponCode}
          onProceed={handleProceedToCheckout}
        />
      </Container>
    </Suspense>
  );
}
