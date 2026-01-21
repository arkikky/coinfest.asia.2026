import { OrderItem } from "@/types/store/orderItem";

export default function CalculateOrderTotals(items: OrderItem[]) {
  const order_subtotal =
    items?.reduce((sum, item) => sum + item?.subtotal, 0) || 0;
  const tax = order_subtotal * 0.11;
  const grand_order_total = order_subtotal + tax;
  return { order_subtotal, tax, grand_order_total };
}
