import { create } from "zustand";
import { Ticket, StoreState } from "@/types/ticket";

type TicketApiItem = {
  id_products: string;
  product_name: string;
  product_description: string;
  price: number;
  is_sale_active: boolean;
  price_sale: number;
  product_stock: number;
  product_usage: number;
  is_group: boolean;
  variant_product?: string;
  total_group?: number;
};

type TicketApiResponse = {
  data?: TicketApiItem[];
};

interface Store extends StoreState {
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateQuantity: (ticketId: string, delta: number) => void;
  resetQuantities: () => void;
  fetchTickets: (eventId?: string) => Promise<void>;
  calculateTotal: () => number;
  hasSelectedTickets: () => boolean;
}

export const useStore = create<Store>((set, get) => ({
  tickets: [],
  quantities: {},
  loading: false,
  error: null,

  setTickets: (tickets) => {
    const { quantities: prevQuantities } = get();
    const nextQuantities: Record<string, number> = {};

    tickets?.forEach((ticket) => {
      nextQuantities[ticket?.id] = prevQuantities?.[ticket?.id] ?? 0;
    });
    set({ tickets, quantities: nextQuantities });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // @update(qty)
  updateQuantity: (ticketId, delta) => {
    const { tickets, quantities } = get();
    const currentQuantity = quantities[ticketId] || 0;
    const ticket = tickets.find((t) => t.id === ticketId);

    if (!ticket) return;
    const newQuantity = Math.max(
      0,
      Math.min(currentQuantity + delta, ticket.quantityAvailable)
    );

    set({
      quantities: {
        ...quantities,
        [ticketId]: newQuantity,
      },
    });
  },

  // @reset(qty)
  resetQuantities: () => {
    const { tickets } = get();
    const initialQuantities: Record<string, number> = {};
    tickets.forEach((ticket) => {
      initialQuantities[ticket?.id] = 0;
    });
    set({ quantities: initialQuantities });
  },

  // @fetch(tickets)
  fetchTickets: async (eventId = "06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a") => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `/api/v1/products?events=${eventId}&sort=created_at:asc`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response?.status}`);
      }
      const result: TicketApiResponse = await response.json();

      if (result?.data) {
        const mappedTickets: Ticket[] = result.data.map((item) => ({
          id: item?.id_products,
          name: item?.product_name,
          description: item?.product_description,
          price: item?.price,
          originalPrice:
            item?.is_sale_active && item?.price_sale > 0
              ? item?.price_sale
              : null,
          quantityAvailable: item?.product_stock - item?.product_usage,
          isGroup: item?.is_group,
          variant_product: item?.variant_product,
          total_group: item?.total_group,
        }));

        get()?.setTickets(mappedTickets);
      }
      set({ loading: false });
    } catch (error) {
      console.error("Error fetching tickets:", error);
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch tickets",
      });
    }
  },

  // @calculate(total)
  calculateTotal: () => {
    const { tickets, quantities } = get();
    return tickets.reduce((total, ticket) => {
      const quantity = quantities[ticket.id] || 0;
      const subtotal =
        quantity === 0
          ? 0
          : ticket?.isGroup
            ? ticket?.price
            : ticket?.price * quantity;
      return total + subtotal;
    }, 0);
  },

  // @hasSelectedTickets(tickets)
  hasSelectedTickets: () => {
    const { quantities } = get();
    return Object.values(quantities).some((qty) => qty > 0);
  },
}));
