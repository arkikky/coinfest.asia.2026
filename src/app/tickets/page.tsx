"use client";
import { Suspense, useEffect, useRef } from "react";
import PerviewTickets from "@/layouts/Store/PerviewTickets";
import { useOrderStore } from "@/stores/OrderStore";
import { useStore } from "@/stores/Store";

export default function Tickets() {
  const { fetchTickets, tickets, updateQuantity } = useStore();
  const orderItems = useOrderStore((state) => state?.orderItems);
  const fetchFromServer = useOrderStore((state) => state.fetchFromServer);
  const guestSessionId = useOrderStore((state) => state.guestSessionId);
  const hydratedRef = useRef(false);

  // @fetch(tickets from products API)
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // @sync(order items with server)
  useEffect(() => {
    if (guestSessionId) {
      fetchFromServer();
    }
  }, [guestSessionId, fetchFromServer]);
  useEffect(() => {
    hydratedRef.current = false;
  }, [guestSessionId]);

  // @sync(order items with server)
  useEffect(() => {
    if (hydratedRef.current) return;
    if (orderItems?.length === 0 || tickets?.length === 0) return;
    const { quantities } = useStore.getState();

    // @sync(order items with server)
    orderItems?.forEach((item) => {
      const ticket = tickets.find((t) => t.id === item?.id_products);
      if (!ticket) return;

      const currentQuantity = quantities[ticket?.id] || 0;
      if (currentQuantity === item?.quantity) return;

      const delta = item?.quantity - currentQuantity;
      updateQuantity(ticket?.id, delta);
    });

    hydratedRef.current = true;
  }, [orderItems, tickets, updateQuantity]);

  useEffect(() => {
    hydratedRef.current = false;
  }, [guestSessionId, orderItems]);

  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg text-gray-600">Loading cart...</div>
          </div>
        }
      >
        <PerviewTickets />
      </Suspense>
    </>
  );
}
