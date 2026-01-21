"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TicketOrderItems } from "@/components/Customs/Card/TicketOrderItems";
import { useStore } from "@/stores/Store";
import { useOrderStore } from "@/stores/OrderStore";
import { OrderItem, RecordStatus } from "@/types/store/orderItem";

export default function PerviewTickets() {
  const {
    tickets,
    quantities,
    loading,
    updateQuantity,
    calculateTotal,
    hasSelectedTickets,
  } = useStore();
  const router = useRouter();
  const setOrderItems = useOrderStore((state) => state.setOrderItems);
  const syncToServer = useOrderStore((state) => state.syncToServer);
  const createOrder = useOrderStore((state) => state.createOrder);
  const currentOrderId = useOrderStore((state) => state.currentOrderId);
  const guestSessionId = useOrderStore((state) => state.guestSessionId);
  const [isProcessing, setIsProcessing] = useState(false);

  // @build(store)
  const buildOrderItems = useCallback(
    (orderId: string) => {
      return tickets
        ?.map((ticket) => {
          const qty = quantities[ticket?.id] || 0;
          if (qty <= 0) return null;

          const subtotal = ticket?.isGroup
            ? ticket?.price
            : ticket?.price * qty;
          const metadata = {
            name: ticket?.name,
            variant_product: ticket?.variant_product,
            description: ticket?.description,
            unitPrice: ticket?.price,
            guest_sessions: guestSessionId,
          };

          const id_order_items =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${ticket?.id}-${Date.now()}-${qty}`;

          const orderItem: OrderItem = {
            id_order_items,
            id_orders: orderId,
            id_products: ticket?.id,
            quantity: qty,
            subtotal,
            metadata,
            record_status: "published" as RecordStatus,
          };

          return orderItem;
        })
        .filter((item): item is OrderItem => item !== null);
    },
    [quantities, tickets, guestSessionId]
  );

  // @continue
  const onContinue = useCallback(async () => {
    if (!hasSelectedTickets() || isProcessing) return;
    setIsProcessing(true);

    try {
      let orderId = currentOrderId;
      if (!orderId) {
        // @create(new empty order)
        orderId = await createOrder("06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a"); // @default(event id)
        if (!orderId) {
          console.error("Failed to create order");
          setIsProcessing(false);
          return;
        }
      }

      // @build(order items with the order ID)
      const selectedOrderItems = buildOrderItems(orderId);
      if (selectedOrderItems?.length) {
        setOrderItems(selectedOrderItems);
        await syncToServer();
      }

      // @redirect(to cart)
      router.push("/cart");
    } catch (error) {
      console.error("Error processing order:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    hasSelectedTickets,
    isProcessing,
    currentOrderId,
    createOrder,
    buildOrderItems,
    setOrderItems,
    syncToServer,
    router,
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // @loading(tickets)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:min-h-screen">
      <div className="lg:w-1/2 bg-[#005EFF] relative flex flex-col items-end justify-end">
        <div className="inline-flex flex-col items-start justify-start px-12 py-12 text-white sticky bottom-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 tracking-tight">
            CoinFest Asia 2026
          </h1>
          <h2 className="font-zalando-expanded text-4xl sm:text-5xl lg:text-8xl font-bold mb-3 sm:mb-4 lg:mb-6 tracking-tight">
            The Future of Crypto and Web3
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-6 lg:mb-8">
            20-21 AUG 2026 • BALI, INDONESIA
          </p>
        </div>
      </div>
      <div className="lg:w-1/2 bg-white flex flex-col lg:min-h-screen">
        <div className="flex-1 p-4 sm:p-6 lg:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
            Get your tickets now!
          </h2>

          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-gray-300 font-semibold text-gray-700 text-sm uppercase">
              <div className="col-span-5">TICKET</div>
              <div className="col-span-3 text-right">PRICE</div>
              <div className="col-span-4 text-right">QUANTITY</div>
            </div>

            {/* @tickets */}
            {tickets?.map((ticket) => (
              <TicketOrderItems
                key={ticket?.id}
                ticket={ticket}
                quantity={quantities[ticket?.id] || 0}
                onQuantityChange={(delta) => {
                  const currentQuantity = quantities[ticket?.id] || 0;
                  const limitDelta = (next: number) => {
                    if (next > 10) return 10 - currentQuantity;
                    if (next < 0) return -currentQuantity;
                    return next - currentQuantity;
                  };
                  if (ticket?.isGroup && ticket?.total_group) {
                    const targetQuantity = delta > 0 ? ticket.total_group : 0;
                    const nextDelta = limitDelta(targetQuantity);
                    if (nextDelta !== 0) {
                      updateQuantity(ticket?.id, nextDelta);
                    }
                    return;
                  }
                  const nextQuantity = currentQuantity + delta;
                  const nextDelta = limitDelta(nextQuantity);
                  if (nextDelta !== 0) {
                    updateQuantity(ticket?.id, nextDelta);
                  }
                }}
                formatPrice={formatPrice}
              />
            ))}

            {hasSelectedTickets() && (
              <div className="py-4 border-t-2 border-gray-300 mt-6">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            )}

            <Button
              type="button"
              disabled={!hasSelectedTickets() || isProcessing}
              onClick={onContinue}
              className={`w-full mt-6 py-6 text-lg font-semibold ${
                hasSelectedTickets() && !isProcessing
                  ? "bg-[#005EFF] hover:bg-[#0047CC] text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isProcessing ? "PROCESSING..." : "CONTINUE"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 lg:p-12 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <p>
              © Coinfest Asia. All rights reserved. Coinfest Asia is organized
              by Coinvestasi, a subsidiary of Indonesia Crypto Network.
            </p>
            <div className="flex gap-4 mt-2 sm:mt-0">
              <a href="#" className="hover:text-gray-900 transition-colors">
                About
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
