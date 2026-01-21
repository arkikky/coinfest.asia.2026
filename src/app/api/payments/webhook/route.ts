import { NextRequest, NextResponse } from "next/server";

// @notification(Log Error)
const logErr = [
  {
    error: {
      status: 405,
      name: "ForbiddenError",
      message: "Forbidden",
    },
  },
];

export async function POST(request: NextRequest) {
  const headersApiKey = request.headers.get("x-api-key");
  
  if (
    !headersApiKey ||
    headersApiKey !== process.env.SECRET_TOKEN_ENCRYPT
  ) {
    return NextResponse.json(logErr, { status: 405 });
  }

  // @data(body)
  const body = await request.json();
  const { paymentId } = body;
  
  if (!paymentId) {
    return NextResponse.json(logErr, { status: 400 });
  }
  
  try {
    const username = process.env.SECRET_XENDIT_TOKEN || process.env.NEXT_PUBLIC_XENDIT_TOKEN;
    const basicAuth = Buffer.from(`${username}:`).toString("base64");

    const rsGetWebhook = await fetch(
      `https://api.xendit.co/v2/invoices/${paymentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
      }
    );
    const rs = await rsGetWebhook.json();
    return NextResponse.json(rs, { status: 200 });
  } catch (error) {
    // console.error('Error handling callback:', error);
    return NextResponse.json(logErr, { status: 500 });
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
