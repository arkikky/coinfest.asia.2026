import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// @validate(coupon)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      coupon_code,
      order_subtotal,
      grand_order_total,
      id_events,
      product_ids,
      order_items,
    } = body;

    if (!coupon_code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (order_subtotal === undefined) {
      return NextResponse.json(
        { error: "Order subtotal is required" },
        { status: 400 }
      );
    }
    const normalizedOrderItems =
      Array.isArray(order_items) && order_items.length > 0
        ? order_items
            .map((item: unknown) => {
              const orderItem = item as {
                id_products?: string | number;
                subtotal?: number;
              };
              return {
                id_products:
                  orderItem?.id_products !== undefined &&
                  orderItem?.id_products !== null
                    ? String(orderItem.id_products).trim()
                    : "",
                subtotal: Math.max(
                  0,
                  Number.isFinite(orderItem?.subtotal as number)
                    ? Number(orderItem?.subtotal)
                    : 0
                ),
              };
            })
            .filter((item) => item.id_products)
        : [];
    const supabase = await createClient();

    // @find(coupon by code)
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("*")
      .eq("coupon_code_name", coupon_code.toUpperCase())
      .eq("record_status", "published")
      .single();

    if (fetchError || !coupon) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid coupon code",
        },
        { status: 200 }
      );
    }

    // @check(correct event)
    if (id_events && coupon.id_events !== id_events) {
      return NextResponse.json(
        {
          valid: false,
          error: "This coupon is not valid for this event",
        },
        { status: 200 }
      );
    }

    // @check(expiration date)
    if (coupon?.expired_date) {
      const expiredDate = new Date(coupon.expired_date);
      const now = new Date();
      if (now > expiredDate) {
        return NextResponse.json(
          {
            valid: false,
            error: "This coupon has expired",
          },
          { status: 200 }
        );
      }
    }

    // @check(usage limit)
    if (
      coupon?.usage_limit !== null &&
      coupon?.current_usage >= coupon.usage_limit
    ) {
      return NextResponse.json(
        {
          valid: false,
          error: "This coupon has reached its usage limit",
        },
        { status: 200 }
      );
    }

    // @check(active promo & minimum total purchase)
    if (
      coupon?.is_active &&
      coupon?.min_total_purchase &&
      grand_order_total < coupon?.min_total_purchase
    ) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum purchase of ${coupon?.min_total_purchase} is required`,
        },
        { status: 200 }
      );
    }

    // @check(included products from coupon_products table)
    let validProductIds: string[] = [];
    let applicableSubtotal = order_subtotal;
    if (product_ids && Array.isArray(product_ids) && product_ids.length > 0) {
      const { data: couponProducts, error: couponProductsError } =
        await supabase
          .from("coupon_products")
          .select("id_products")
          .eq("id_coupons", coupon.id_coupons)
          .eq("record_status", "published");

      if (couponProductsError) {
        console.error("Error fetching coupon_products:", couponProductsError);
      } else if (couponProducts && couponProducts.length > 0) {
        validProductIds = couponProducts?.map((cp) =>
          String(cp.id_products).trim()
        );
        const normalizedProductIds = product_ids.map((id: string | number) =>
          String(id).trim()
        );

        // @debug(logging)
        // console.log("=== Coupon Products Validation Debug ===");
        // console.log("coupon.id_coupons:", coupon.id_coupons);
        // console.log("product_ids (from cart):", normalizedProductIds);
        // console.log("valid_product_ids (from coupon_products):", validProductIds);

        const hasValidProduct = normalizedProductIds.some((id: string) =>
          validProductIds.includes(id)
        );
        if (!hasValidProduct) {
          return NextResponse.json(
            {
              valid: false,
              error: "This coupon is not valid for selected products",
            },
            { status: 200 }
          );
        }

        if (normalizedOrderItems.length === 0) {
          return NextResponse.json(
            {
              valid: false,
              error:
                "Unable to calculate discount for product-specific coupon without order items",
            },
            { status: 200 }
          );
        }

        const scopedSubtotal = normalizedOrderItems
          .filter((item) => validProductIds.includes(item.id_products))
          .reduce((sum, item) => sum + item.subtotal, 0);

        if (scopedSubtotal <= 0) {
          return NextResponse.json(
            {
              valid: false,
              error: "This coupon is not valid for the selected products",
            },
            { status: 200 }
          );
        }

        applicableSubtotal = scopedSubtotal;
      }
    }

    // @calculate(discount amount)
    let discountAmount = 0;
    if (coupon?.type_coupon === "percentage" && coupon?.amount) {
      discountAmount = (applicableSubtotal * coupon?.amount) / 100;
    } else if (coupon?.type_coupon === "fixed_amount" && coupon?.amount) {
      discountAmount = Math.min(coupon?.amount, applicableSubtotal);
    }

    return NextResponse.json({
      valid: true,
      coupon,
      discountAmount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate coupon",
      },
      { status: 500 }
    );
  }
}

// @cors(handling)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Allow: "POST, OPTIONS, GET",
      },
    }
  );
}
