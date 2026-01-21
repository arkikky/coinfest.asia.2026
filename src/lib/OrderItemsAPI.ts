import { OrderItem, RecordStatus } from "@/types/store/orderItem";

export interface CreateOrderItemPayload {
  id_orders: string;
  id_products: string;
  quantity: number;
  subtotal: number;
  metadata: Record<string, unknown>;
  record_status?: RecordStatus;
  guest_sessions?: string;
}

export interface UpdateOrderItemPayload {
  quantity?: number;
  subtotal?: number;
  metadata?: Record<string, unknown>;
  record_status?: RecordStatus;
}

// @fetch(order items)
export async function fetchOrderItems(
  guestSessionId?: string,
  idOrders?: string
): Promise<OrderItem[]> {
  const params = new URLSearchParams();
  if (guestSessionId) params.append("guest_sessions", guestSessionId);
  if (idOrders) params.append("id_orders", idOrders);
  console.log(params?.toString());
  console.log(idOrders);

  const response = await fetch(`/api/v1/order-items?${params?.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch order items: ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}

// @create(new order items)
export async function createOrderItem(
  payload: CreateOrderItemPayload
): Promise<OrderItem> {
  const response = await fetch("/api/v1/order-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create order item: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// @update(order items)
export async function updateOrderItem(
  id_order_items: string,
  payload: UpdateOrderItemPayload
): Promise<OrderItem> {
  const response = await fetch(`/api/v1/order-items/${id_order_items}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order item: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// @delete(order items)
export async function deleteOrderItem(id_order_items: string): Promise<void> {
  const response = await fetch(`/api/v1/order-items/${id_order_items}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete order item: ${response.status}`);
  }
}

// @delete(all order items)
export async function deleteOrderItemsBySession(
  idOrders: string
): Promise<void> {
  const response = await fetch(`/api/v1/order-items?id_orders=${idOrders}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to delete order items by order: ${response.status}`
    );
  }
}

// @batch(create order items)
export async function batchCreateOrderItems(
  items: CreateOrderItemPayload[]
): Promise<OrderItem[]> {
  const promises = items.map((item) => createOrderItem(item));
  return Promise.all(promises);
}

// @sync(order items with server)
export async function syncOrderItemsToServer(
  orderItems: OrderItem[],
  guestSessionId: string
): Promise<OrderItem[]> {
  await deleteOrderItemsBySession(guestSessionId);

  // @create(new items)
  const payloads: CreateOrderItemPayload[] = orderItems.map((item) => ({
    id_orders: item?.id_orders,
    id_products: item?.id_products,
    quantity: item?.quantity,
    subtotal: item?.subtotal,
    metadata: { ...item?.metadata, guest_sessions: guestSessionId },
    record_status: item?.record_status,
    guest_sessions: guestSessionId,
  }));

  return batchCreateOrderItems(payloads);
}
