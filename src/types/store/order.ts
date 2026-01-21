export type OrderPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type OrderMerchant = "online" | "offline";
export type RecordStatus = "draft" | "published" | "archived";

export interface Order {
  id?: number;
  id_orders: string;
  id_events?: string | null;
  id_customers: string;
  id_coupons?: string | null;
  order_id: string; // @format("ORD-{random}")
  order_notes?: string | null;
  order_subtotal: number;
  discount_amount: number;
  grand_order_total: number;
  payment_method?: string | null;
  payment_provider?: string | null;
  payment_intent_id?: string | null;
  payment_status: OrderPaymentStatus;
  expired_at?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  refunded_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  rank_record?: number;
  order_merchant: OrderMerchant;
  record_status: RecordStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderPayload {
  id_events?: string;
  id_customers: string;
  order_merchant?: OrderMerchant;
  record_status?: RecordStatus;
}

export interface OrderState {
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}
