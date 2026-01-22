import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// @generate-order
function generateOrderId(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `ORD-${random}${timestamp}`;
}

// @create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id_events = "06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a",
      id_customers = null,
      order_merchant = "online",
      record_status = "published",
    } = body;

    // Validation
    if (!id_customers) {
      return NextResponse.json(
        { error: "id_customers is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate short-lived session (20 minutes)
    const sessionToken = id_customers;
    const sessionExpiresAt = new Date(
      Date.now() + 20 * 60 * 1000
    ).toISOString();

    // Create empty order
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id_events,
        id_customers: null,
        order_id: generateOrderId(),
        order_subtotal: 0,
        discount_amount: 0,
        grand_order_total: 0,
        payment_status: "pending",
        order_merchant,
        record_status,
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// @get(order by id_orders)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrders = searchParams.get("id_orders");

    if (!idOrders) {
      return NextResponse.json(
        { error: "id_orders parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id_orders", idOrders)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Order fetched successfully",
    });
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// @update
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrders = searchParams.get("id_orders");

    if (!idOrders) {
      return NextResponse.json(
        { error: "id_orders parameter is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      id_coupons,
      order_subtotal,
      discount_amount,
      grand_order_total,
      payment_method,
      payment_provider,
      payment_status,
      record_status,
    } = body;

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (id_coupons !== undefined) updateData.id_coupons = id_coupons;
    if (order_subtotal !== undefined)
      updateData.order_subtotal = order_subtotal;
    if (discount_amount !== undefined)
      updateData.discount_amount = discount_amount;
    if (grand_order_total !== undefined)
      updateData.grand_order_total = grand_order_total;
    if (payment_method) updateData.payment_method = payment_method;
    if (payment_provider) updateData.payment_provider = payment_provider;
    if (payment_status) updateData.payment_status = payment_status;
    if (record_status) updateData.record_status = record_status;

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id_orders", idOrders)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
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
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Allow: "GET, POST, PATCH, OPTIONS",
      },
    }
  );
}
