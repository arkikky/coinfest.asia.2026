import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// @get(customer by id_customers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idCustomers = searchParams.get("id_customers");

    if (!idCustomers) {
      return NextResponse.json(
        { error: "id_customers parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id_customers", idCustomers)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch customer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Customer fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Allow: "GET, OPTIONS",
      },
    }
  );
}
