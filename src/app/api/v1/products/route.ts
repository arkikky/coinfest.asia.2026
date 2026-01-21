import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId =
      searchParams.get("events") || "06bf98b9-31ec-49dd-b1b7-8ca1e66ca81a";
    const sort = searchParams.get("sort") || "created_at:desc";

    const response = await fetch(
      `https://dev-icnhub.vercel.app/api/perviews/products?events=${eventId}&sort=${sort}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response?.status}`);
    }

    const data = await response.json();
    console.log(
      `https://dev-icnhub.vercel.app/api/perviews/products?events=${eventId}&sort=${sort}`
    );
    console.log(data);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Allow: "GET, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        data: null,
      },
      {
        status: 500,
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
