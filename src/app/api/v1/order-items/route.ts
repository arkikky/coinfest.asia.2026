import { NextRequest, NextResponse } from "next/server";

// @order(items by id_orders)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrders = searchParams.get("id_orders");

    if (!idOrders) {
      return NextResponse.json(
        { error: "Missing id_orders parameter" },
        { status: 400 }
      );
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // @order-items(id_orders)
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("id_orders", idOrders)
      .eq("record_status", "published");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch order items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      message: "Order items fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    return NextResponse.json(
      { error: "Failed to fetch order items" },
      { status: 500 }
    );
  }
}

// @create(new order items)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id_orders,
      id_products,
      quantity,
      subtotal,
      metadata,
      record_status = "published",
    } = body;

    // @validation
    if (!id_orders || !id_products || !quantity || subtotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("order_items")
      .insert({
        id_orders,
        id_products,
        quantity,
        subtotal,
        metadata: metadata || {},
        record_status,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create order item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
        message: "Order item created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order item:", error);
    return NextResponse.json(
      { error: "Failed to create order item" },
      { status: 500 }
    );
  }
}

// @delete(order items by id_orders - (for cleanup before re-sync))
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrders = searchParams.get("id_orders");

    if (!idOrders) {
      return NextResponse.json(
        { error: "Missing id_orders parameter" },
        { status: 400 }
      );
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // @delete(order items)
    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id_orders", idOrders)
      .eq("record_status", "published");

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete order items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Order items deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order items:", error);
    return NextResponse.json(
      { error: "Failed to delete order items" },
      { status: 500 }
    );
  }
}
