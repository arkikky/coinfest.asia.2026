"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { createStore, StoreApi, useStore as useZustandStore } from "zustand";
import {
  OrderItem,
  OrderItemsState,
  RecordStatus,
} from "@/types/store/orderItem";
import { Coupon } from "@/types/store/coupon";
import {
  getGuestSessionId,
  setGuestSessionId,
  clearGuestSessionId,
  getOrderItemIds,
  setOrderItemIds,
  addOrderItemId,
  removeOrderItemId,
  clearOrderItemIds,
  getOrderId,
  setOrderId,
  clearOrderId,
} from "@/lib/cookies";
import {
  fetchOrderItems,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  deleteOrderItemsBySession,
} from "@/lib/OrderItemsAPI";
import CalculateOrderTotals from "@/lib/store/CalculationOrders";

interface OrderStore extends OrderItemsState {
  setOrderItems: (orderItems: OrderItem[]) => void;
  addOrderItem: (orderItem: OrderItem) => void;
  updateOrderItem: (
    id_order_items: string,
    updates: Partial<Omit<OrderItem, "id_order_items">>
  ) => void;
  removeOrderItem: (id_order_items: string) => void;
  clearOrderItems: () => void;
  setRecordStatus: (
    id_order_items: string,
    record_status: RecordStatus
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getTotalQuantity: () => number;
  getTotalSubtotal: () => number;
  guestSessionId: string | null;
  currentOrderId: string | null;
  initGuestSession: () => void;
  createOrder: (idEvents?: string) => Promise<string | null>;
  clearSession: () => void;
  syncToServer: () => Promise<void>;
  fetchFromServer: () => Promise<void>;
  // Coupon states
  appliedCoupon: Coupon | null;
  discountAmount: number;
  orderData: {
    id_events?: string;
    id_coupons?: string;
    discount_amount: number;
  } | null;
  couponError: string | null;
  couponMessage: string | null;
  isApplyingCoupon: boolean;
  couponCode: string;
  // Coupon actions
  setCouponCode: (code: string) => void;
  fetchOrderData: (orderId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const createGuestId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createOrderStore = () =>
  createStore<OrderStore>((set, get) => ({
    orderItems: [],
    loading: false,
    error: null,
    guestSessionId: null,
    currentOrderId: null,
    // Coupon states
    appliedCoupon: null,
    discountAmount: 0,
    orderData: null,
    couponError: null,
    couponMessage: null,
    isApplyingCoupon: false,
    couponCode: "",

    setOrderItems: (orderItems) => {
      set({ orderItems });
      // Store order item IDs in cookies
      const ids = orderItems.map((item) => item.id_order_items);
      setOrderItemIds(ids);
    },

    addOrderItem: (orderItem) => {
      set(({ orderItems }) => {
        const filtered = orderItems.filter(
          (item) => item.id_order_items !== orderItem.id_order_items
        );
        const newItems = [...filtered, orderItem];

        // Add ID to cookies
        addOrderItemId(orderItem.id_order_items);
        return { orderItems: newItems };
      });
    },

    // @update(items)
    updateOrderItem: (id_order_items, updates) => {
      set(({ orderItems }) => ({
        orderItems: orderItems.map((item) =>
          item.id_order_items === id_order_items
            ? { ...item, ...updates }
            : item
        ),
      }));
    },

    // @remove(items)
    removeOrderItem: (id_order_items) => {
      set(({ orderItems }) => {
        const filtered = orderItems.filter(
          (item) => item.id_order_items !== id_order_items
        );

        removeOrderItemId(id_order_items);
        return { orderItems: filtered };
      });
    },

    // @clear(order items)
    clearOrderItems: () => {
      set({ orderItems: [] });
      clearOrderItemIds();
    },

    // @saved(order items)
    setRecordStatus: (id_order_items, record_status) => {
      set(({ orderItems }) => ({
        orderItems: orderItems.map((item) =>
          item.id_order_items === id_order_items
            ? { ...item, record_status }
            : item
        ),
      }));
    },
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    initGuestSession: async () => {
      const existingId = getGuestSessionId();
      const nextId = existingId || get().guestSessionId || createGuestId();

      if (!existingId) {
        setGuestSessionId(nextId);
      }

      // @check(existing order ID)
      const existingOrderId = getOrderId();

      // Default: set new guest session without existing order
      let validOrderId: string | null = null;

      if (existingOrderId) {
        try {
          const response = await fetch(
            `/api/v1/orders?id_orders=${encodeURIComponent(existingOrderId)}`
          );
          if (response.ok) {
            const result = await response.json();
            const order = result?.data;

            const expiresAt = order?.session_expires_at
              ? new Date(order.session_expires_at)
              : null;
            const now = new Date();

            if (expiresAt && expiresAt > now) {
              // Session still valid
              validOrderId = existingOrderId;
            } else {
              // Session expired: clear all local sessions & cookies
              get().clearSession();
            }
          } else {
            // If fetch fails, treat as no valid order
            get().clearSession();
          }
        } catch (error) {
          console.error("Failed to validate existing order session:", error);
          get().clearSession();
        }
      }

      set({
        guestSessionId: nextId,
        currentOrderId: validOrderId,
      });

      if (validOrderId) {
        get().fetchFromServer();
      }
    },

    createOrder: async (idEvents?: string) => {
      const { guestSessionId } = get();
      if (!guestSessionId) {
        console.error("No guest session ID available");
        set({ error: "Guest session not initialized" });
        return null;
      }
      set({ loading: true, error: null });

      try {
        const response = await fetch("/api/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_events: idEvents,
            id_customers: guestSessionId, // @guest(session as customers)
            order_merchant: "online",
            record_status: "published",
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create order: ${response.status}`);
        }
        const result = await response.json();
        const orderId = result?.data?.id_orders;

        // @set(order id to cookies)
        setOrderId(orderId);
        set({ currentOrderId: orderId, loading: false });

        return orderId;
      } catch (error) {
        console.error("Failed to create order:", error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to create order",
          loading: false,
        });
        return null;
      }
    },

    // @clear
    clearSession: () => {
      clearGuestSessionId();
      clearOrderItemIds();
      clearOrderId();
      set({
        orderItems: [],
        guestSessionId: null,
        currentOrderId: null,
        appliedCoupon: null,
        discountAmount: 0,
        orderData: null,
        couponError: null,
        couponMessage: null,
        couponCode: "",
      });
    },
    getTotalQuantity: () =>
      get().orderItems.reduce((total, item) => total + item.quantity, 0),
    getTotalSubtotal: () =>
      get().orderItems.reduce((total, item) => total + item.subtotal, 0),

    // @sync(state to server)
    syncToServer: async () => {
      const { orderItems, currentOrderId } = get();
      if (!currentOrderId) {
        console.warn("No order ID available for sync");
        return;
      }
      set({ loading: true, error: null });

      try {
        // @create(new items with correct id_orders)
        await deleteOrderItemsBySession(currentOrderId);
        const createPromises = orderItems.map((item) =>
          createOrderItem({
            id_orders: currentOrderId,
            id_products: item.id_products,
            quantity: item.quantity,
            subtotal: item.subtotal,
            metadata: item.metadata,
            record_status: item.record_status,
          })
        );

        const syncedItems = await Promise.all(createPromises);
        set({ orderItems: syncedItems, loading: false });

        // @Update(cookies with new IDs)
        const ids = syncedItems?.map((item) => item.id_order_items);
        setOrderItemIds(ids);

        // @update(order totals)
        const { order_subtotal, grand_order_total } =
          CalculateOrderTotals(syncedItems);

        // @check(coupon validation after order update)
        const { orderData, appliedCoupon } = get();
        let shouldRemoveCoupon = false;
        let finalGrandTotal = grand_order_total;
        let finalDiscountAmount = 0;

        if (orderData?.id_coupons && appliedCoupon) {
          const productIds = syncedItems
            .map((item) => item?.id_products)
            .filter((id): id is string => Boolean(id))
            .map((id) => String(id).trim());
          const orderItemsPayload = syncedItems.map((item) => ({
            id_products: item.id_products,
            subtotal: item.subtotal,
          }));

          try {
            const validateResponse = await fetch("/api/v1/coupons/validate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                coupon_code: appliedCoupon.coupon_code_name,
                order_subtotal,
                grand_order_total,
                id_events:
                  orderData?.id_events ||
                  "06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a",
                product_ids: productIds,
                order_items: orderItemsPayload,
              }),
            });

            if (validateResponse.ok) {
              const validation = await validateResponse.json();

              if (validation?.valid) {
                const recalculatedDiscount = validation?.discountAmount || 0;
                const subtotalAfterDiscount = Math.max(
                  0,
                  order_subtotal - recalculatedDiscount
                );
                const taxAfterDiscount = subtotalAfterDiscount * 0.11;

                finalDiscountAmount = recalculatedDiscount;
                finalGrandTotal = subtotalAfterDiscount + taxAfterDiscount;
              } else {
                shouldRemoveCoupon = true;
              }
            } else {
              shouldRemoveCoupon = true;
            }
          } catch (error) {
            console.error("Failed to validate coupon products:", error);
            shouldRemoveCoupon = true;
          }
        }

        // @update(order with or without coupons)
        await fetch(`/api/v1/orders?id_orders=${currentOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_subtotal,
            grand_order_total: finalGrandTotal,
            discount_amount: finalDiscountAmount,
            ...(shouldRemoveCoupon && {
              id_coupons: null,
            }),
          }),
        });

        // @remove(coupon from state if validation fails)
        if (shouldRemoveCoupon) {
          set({
            appliedCoupon: null,
            discountAmount: 0,
            orderData: {
              ...orderData,
              id_coupons: undefined,
              discount_amount: 0,
            },
            couponMessage: null,
            couponError: null,
          });
        } else if (orderData?.id_coupons && appliedCoupon) {
          // @update(discount amount dengan nilai yang sudah di-recalculate)
          set({
            discountAmount: finalDiscountAmount,
            orderData: {
              ...orderData,
              discount_amount: finalDiscountAmount,
            },
          });
        }

        // @fetch(order data to sync coupon info)
        await get().fetchOrderData(currentOrderId);
      } catch (error) {
        console.error("Failed to sync to server:", error);
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to sync order items",
          loading: false,
        });
      }
    },

    // @sync(server)
    fetchFromServer: async () => {
      const { currentOrderId } = get();

      if (!currentOrderId) {
        console.warn("No order ID available for fetch");
        return;
      }
      set({ loading: true, error: null });

      try {
        const items = await fetchOrderItems(undefined, currentOrderId);
        set({ orderItems: items, loading: false });

        // @update
        const ids = items.map((item) => item.id_order_items);
        setOrderItemIds(ids);

        // Also fetch order data for coupon info
        await get().fetchOrderData(currentOrderId);
      } catch (error) {
        console.error("Failed to fetch from server:", error);
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch order items",
          loading: false,
        });
      }
    },

    // @set(coupon code)
    setCouponCode: (code: string) => {
      set({ couponCode: code });
      // @clear(errors/messages)
      if (get().couponError || get().couponMessage) {
        set({ couponError: null, couponMessage: null });
      }
    },

    // @fetch(order data)
    fetchOrderData: async (orderId: string) => {
      try {
        const response = await fetch(
          `/api/v1/orders?id_orders=${encodeURIComponent(orderId)}`
        );
        if (response.ok) {
          const result = await response.json();
          const order = result?.data;

          // @set(order & discount amount)
          set({
            orderData: {
              id_events: order?.id_events,
              id_coupons: order?.id_coupons,
              discount_amount: order?.discount_amount || 0,
            },
            discountAmount: order?.discount_amount || 0,
          });

          // @fetch(coupon details if order has coupon)
          if (order?.id_coupons) {
            try {
              const couponResponse = await fetch(
                `/api/v1/coupons?id_coupons=${encodeURIComponent(
                  order.id_coupons
                )}`
              );
              if (couponResponse.ok) {
                const couponResult = await couponResponse.json();
                if (couponResult?.data) {
                  set({
                    appliedCoupon: couponResult.data as Coupon,
                  });
                }
              }
            } catch (couponError) {
              console.error("Failed to fetch coupon details:", couponError);
            }
          } else {
            set({ appliedCoupon: null });
          }
        }
      } catch (error) {
        console.error("Failed to fetch order data:", error);
      }
    },

    // @apply(coupon)
    applyCoupon: async (code: string) => {
      const { currentOrderId, orderItems, orderData, isApplyingCoupon } = get();
      const orderId = currentOrderId || getOrderId();

      if (!code.trim() || isApplyingCoupon) return;
      if (!orderId) {
        set({ couponError: "Order not found. Please refresh the page." });
        return;
      }

      // @check(order items exists)
      if (!orderItems || orderItems.length === 0) {
        set({
          couponError: "Please add items to your cart before applying a coupon",
          couponCode: "",
          isApplyingCoupon: false,
        });
        return;
      }

      set({ isApplyingCoupon: true, couponError: null, couponMessage: null });

      try {
        const subtotal = orderItems.reduce(
          (sum, item) => sum + (item?.subtotal || 0),
          0
        );
        const { grand_order_total } = CalculateOrderTotals(orderItems);
        const orderItemsPayload = orderItems.map((item) => ({
          id_products: item.id_products,
          subtotal: item.subtotal,
        }));

        // @prepare(product ids for validation)
        const productIds = orderItems
          .map((item) => item?.id_products)
          .filter((id): id is string => Boolean(id))
          .map((id) => String(id).trim());

        // @validate(coupon)
        const validateResponse = await fetch("/api/v1/coupons/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coupon_code: code.trim().toUpperCase(),
            order_subtotal: subtotal,
            grand_order_total,
            id_events:
              orderData?.id_events || "06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a",
            product_ids: productIds,
            order_items: orderItemsPayload,
          }),
        });
        if (!validateResponse.ok) {
          throw new Error(`Validation failed: ${validateResponse.status}`);
        }
        const validation = await validateResponse.json();

        // @check(validation result)
        if (!validation?.valid || !validation?.coupon) {
          set({
            couponError: validation?.error || "Invalid coupon code",
            couponCode: "",
            isApplyingCoupon: false,
          });
          return;
        }
        const coupon = validation?.coupon as Coupon;
        const discount = validation?.discountAmount || 0;

        // @update(order with coupons)
        const updateResponse = await fetch(
          `/api/v1/orders?id_orders=${orderId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_coupons: coupon.id_coupons,
              discount_amount: discount,
              order_subtotal: subtotal,
              grand_order_total:
                subtotal - discount + (subtotal - discount) * 0.11,
            }),
          }
        );

        // @check(update response)
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          throw new Error(
            errorData?.error || "Failed to apply coupon to order"
          );
        }

        // @set(local state)
        set({
          appliedCoupon: coupon,
          discountAmount: discount,
          orderData: {
            ...orderData,
            id_events:
              orderData?.id_events || "06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a",
            id_coupons: coupon.id_coupons,
            discount_amount: discount,
          },
          couponMessage: `Coupon "${coupon.coupon_code_name}" applied successfully!`,
          couponCode: "",
          isApplyingCoupon: false,
        });

        // @fetch(order data)
        await get().fetchOrderData(orderId);
      } catch (error) {
        console.error("Error applying coupon:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to apply coupon. Please try again.";
        set({
          couponError: errorMessage,
          couponCode: "",
          isApplyingCoupon: false,
        });
      }
    },

    removeCoupon: async () => {
      const { currentOrderId, orderItems } = get();
      const orderId = currentOrderId || getOrderId();
      if (!orderId) return;

      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

      try {
        const updateResponse = await fetch(
          `/api/v1/orders?id_orders=${orderId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_coupons: null,
              discount_amount: 0,
              order_subtotal: subtotal,
              grand_order_total: subtotal + subtotal * 0.11,
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error("Failed to remove coupon");
        }

        set({
          appliedCoupon: null,
          discountAmount: 0,
          orderData: {
            ...get().orderData,
            id_coupons: undefined,
            discount_amount: 0,
          },
          couponMessage: null,
          couponError: null,
        });

        await get().fetchOrderData(orderId);
      } catch (error) {
        console.error("Error removing coupon:", error);
        set({
          couponError: "Failed to remove coupon. Please try again.",
        });
      }
    },
  }));

const OrderStoreContext = createContext<StoreApi<OrderStore> | null>(null);
export function OrderItemsProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createOrderStore(), []);

  useEffect(() => {
    store.getState().initGuestSession();
  }, [store]);

  return (
    <OrderStoreContext.Provider value={store}>
      {children}
    </OrderStoreContext.Provider>
  );
}

export function useOrderStore(): OrderStore;
export function useOrderStore<T>(selector: (state: OrderStore) => T): T;
export function useOrderStore<T>(selector?: (state: OrderStore) => T) {
  const store = useContext(OrderStoreContext);
  if (!store) {
    throw new Error("useOrderStore must be used within an OrderItemsProvider");
  }
  return selector ? useZustandStore(store, selector) : useZustandStore(store);
}
