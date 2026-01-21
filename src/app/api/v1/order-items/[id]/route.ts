import { NextRequest, NextResponse } from "next/server";

// @get(single order item by id_order_items)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("id_order_items", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch order item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Order item fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching order item:", error);
    return NextResponse.json(
      { error: "Failed to fetch order item" },
      { status: 500 }
    );
  }
}

// @update(order items)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const { quantity, subtotal, metadata, record_status } = body;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("order_items")
      .update({
        quantity,
        subtotal,
        metadata,
        record_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id_order_items", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update order item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Order item updated successfully",
    });
  } catch (error) {
    console.error("Error updating order item:", error);
    return NextResponse.json(
      { error: "Failed to update order item" },
      { status: 500 }
    );
  }
}

// @delete(order items)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id_order_items", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete order item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Order item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order item:", error);
    return NextResponse.json(
      { error: "Failed to delete order item" },
      { status: 500 }
    );
  }
}
