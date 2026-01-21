import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idCoupons = searchParams.get("id_coupons");
    const isPublic = searchParams.get("is_public");
    const isActive = searchParams.get("is_active");
    const withSale = searchParams.get("with_sale");

    const supabase = await createClient();

    // @get(single coupon by id)
    if (idCoupons) {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id_coupons", idCoupons)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: error.message || "Failed to fetch coupon" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data,
        message: "Coupon fetched successfully",
      });
    }

    // @list(coupons with optional filters)
    let query = supabase
      .from("coupons")
      .select("*")
      .eq("record_status", "published");

    if (isPublic === "true") {
      query = query.eq("is_public", true);
    }
    if (isActive === "true") {
      query = query.eq("is_active", true);
    }
    if (withSale === "true") {
      query = query
        .not("sale_label", "is", null)
        .not("sale_shortdesc", "is", null)
        .neq("sale_label", "")
        .neq("sale_shortdesc", "");
    }

    const { data, error } = await query.order("rank_record", {
      ascending: true,
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch coupons" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      message: "Coupons fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
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
        "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Allow: "GET, OPTIONS, POST",
      },
    }
  );
}
