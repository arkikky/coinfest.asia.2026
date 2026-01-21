"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderItem } from "@/types/store/orderItem";
import { Coupon } from "@/types/store/coupon";

type PerviewCartsProps = {
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  discountAmount: number;
  appliedCoupon: Coupon | null;
  couponMessage: string | null;
  couponError: string | null;
  couponCode: string;
  isApplyingCoupon: boolean;
  hasItems: boolean;
  formatPrice: (value: number) => string;
  onApplyCoupon: (e: React.FormEvent) => void;
  onRemoveCoupon: () => void;
  onSetCouponCode: (value: string) => void;
  onProceed: () => void;
};

export default function PerviewCarts({
  orderItems,
  subtotal,
  tax,
  grandTotal,
  discountAmount,
  appliedCoupon,
  couponMessage,
  couponError,
  couponCode,
  isApplyingCoupon,
  hasItems,
  formatPrice,
  onApplyCoupon,
  onRemoveCoupon,
  onSetCouponCode,
  onProceed,
}: PerviewCartsProps) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const couponInputRef = useRef<HTMLInputElement | null>(null);
  const applyButtonRef = useRef<HTMLButtonElement | null>(null);

  // @trigger(apply after)
  const handleApplyCouponFromList = (code: string) => {
    if (isApplyingCoupon || !code) return;
    onSetCouponCode(code);
    setTimeout(() => {
      couponInputRef.current?.focus();
      applyButtonRef.current?.click();
    }, 0);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const response = await fetch(
          "/api/v1/coupons?is_public=true&is_active=true&with_sale=true"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch coupons: ${response.status}`);
        }
        const result = await response.json();
        if (!isMounted) return;
        const coupons = Array.isArray(result?.data) ? result.data : [];
        setAvailableCoupons(coupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      } finally {
        if (isMounted) {
          setLoadingCoupons(false);
        }
      }
    };

    fetchCoupons();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:min-h-screen">
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div className="col-span-6">Ticket</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Subtotal</div>
        </div>

        <div className="divide-y divide-gray-200">
          {orderItems?.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Belum ada tiket yang dipilih. Kembali ke halaman tiket untuk
              memilih paket yang diinginkan.
            </div>
          )}

          {orderItems?.map((item) => {
            const metadata = item?.metadata as {
              name?: string;
              unitPrice?: number;
              variant_product?: string;
              description?: string;
            };
            const name = metadata?.name ?? `Ticket ${item?.id_products}`;
            const unitPrice =
              typeof metadata?.unitPrice === "number"
                ? metadata?.unitPrice
                : item?.quantity
                ? item?.subtotal / item?.quantity
                : 0;

            return (
              <div
                key={item?.id_order_items}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center"
                style={{ willChange: "transform, background-color" }}
              >
                <div className="col-span-6">
                  <p className="font-medium text-gray-900">{name}</p>
                  {metadata?.description && (
                    <p className="text-xs text-gray-500">
                      {metadata?.description}
                    </p>
                  )}
                </div>
                <div className="col-span-2 text-right text-gray-800">
                  {item?.quantity}
                </div>
                <div className="col-span-2 text-right text-gray-800">
                  {formatPrice(unitPrice)}
                </div>
                <div className="col-span-2 text-right font-semibold text-gray-900">
                  {formatPrice(item?.subtotal)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(subtotal)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm text-gray-600">
                Discount
                {appliedCoupon && (
                  <span className="ml-1">
                    ({appliedCoupon?.coupon_code_name})
                  </span>
                )}
              </span>
              <span className="text-sm font-medium">
                -{formatPrice(discountAmount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tax (11%)</span>
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(tax)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-300">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">Total</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(grandTotal)}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-4">
          {appliedCoupon ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Coupon Applied: {appliedCoupon?.coupon_code_name}
                </p>
                {appliedCoupon?.sale_label && (
                  <p className="text-xs text-gray-600 mt-1">
                    {appliedCoupon?.sale_label}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveCoupon();
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <form
              onSubmit={onApplyCoupon}
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="coupon"
                  className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1"
                >
                  Add coupon
                </label>
                <div className="relative">
                  <input
                    id="coupon"
                    type="text"
                    ref={couponInputRef}
                    value={couponCode}
                    onChange={(e) => {
                      e.preventDefault();
                      onSetCouponCode(e.target.value);
                    }}
                    placeholder="Enter coupon code"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 pr-28 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    disabled={isApplyingCoupon}
                  />
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    ref={applyButtonRef}
                    className="absolute right-1.5 top-1.5"
                    disabled={isApplyingCoupon || !couponCode.trim()}
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </Button>
                </div>
              </div>
            </form>
          )}
          {couponMessage && (
            <p className="mt-2 text-xs text-green-600">{couponMessage}</p>
          )}
          {couponError && (
            <p className="mt-1 text-xs text-red-600">{couponError}</p>
          )}
        </div>

        {/* @coupon(sale) */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Promo coupons
              </p>
              <p className="text-xs text-gray-500">
                Gunakan salah satu kupon publik berikut.
              </p>
            </div>
            {loadingCoupons && (
              <span className="text-[11px] text-gray-500">Loading...</span>
            )}
          </div>

          {availableCoupons.length === 0 && !loadingCoupons && (
            <p className="text-xs text-gray-500">
              Tidak ada kupon publik yang tersedia saat ini.
            </p>
          )}

          {availableCoupons?.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableCoupons?.map((coupon) => (
                <div
                  key={coupon?.id_coupons}
                  className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {coupon?.coupon_code_name}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {coupon?.sale_label}
                  </p>
                  {coupon?.sale_shortdesc && (
                    <p className="mt-1 text-xs text-gray-600">
                      {coupon?.sale_shortdesc}
                    </p>
                  )}
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      variant="secondary"
                      disabled={isApplyingCoupon}
                      onClick={(e) => {
                        e.preventDefault();
                        handleApplyCouponFromList(
                          coupon?.coupon_code_name || ""
                        );
                      }}
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply Coupon"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* @footers */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Link
            href="/tickets"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Adjust Tickets
          </Link>
          <Button onClick={onProceed} disabled={!hasItems} variant="primary">
            Continue to Billing
          </Button>
        </div>
      </div>
    </div>
  );
}
