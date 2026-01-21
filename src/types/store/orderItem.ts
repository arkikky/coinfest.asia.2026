// Mirrors public.order_items schema (record_status enum and metadata storage).
export type RecordStatus = "draft" | "published" | "archived";

export interface OrderItem {
  id?: number;
  id_order_items: string;
  id_orders: string;
  id_products: string;
  quantity: number;
  subtotal: number;
  metadata: Record<string, unknown>;
  created_by?: string | null;
  updated_by?: string | null;
  rank_record?: number;
  record_status: RecordStatus;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItemsState {
  orderItems: OrderItem[];
  loading: boolean;
  error: string | null;
}
