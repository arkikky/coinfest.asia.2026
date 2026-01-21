export interface Ticket {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  quantityAvailable: number;
  isGroup: boolean;
  variant_product?: string;
  total_group?: number;
}

export interface StoreState {
  tickets: Ticket[];
  quantities: Record<string, number>;
  loading: boolean;
  error: string | null;
}
