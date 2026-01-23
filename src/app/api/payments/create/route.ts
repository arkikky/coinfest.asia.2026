import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const body = await request.json();
  const { extrnlId, amount, payerEmail, fullname, order } = body;
  if (!extrnlId || !amount || !payerEmail || !fullname || !order) {
    return NextResponse.json(logErr, { status: 400 });
  }

  try {
    // @fetch(detail order from extrnlId - customer ID)
    const supabase = await createClient();

    const { data: order_checkout, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id_orders", order)
      .single();
    if (orderError || !order_checkout) {
      console.error("Failed to fetch order:", orderError);
      return NextResponse.json(
        { error: "Failed to fetch order details" },
        { status: 500 }
      );
    }

    // @log(order data)
    {process.env.NODE_ENV === "development" && (
      console.log("Order data:", order_checkout)
    )}

    // @fetch(order items with products)
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("id_orders", order)
      .eq("record_status", "published");
    if (orderItemsError) {
      console.error("Failed to fetch order items:", orderItemsError);
    }

    // @fetch(products for each order item)
    const orderItemsWithProducts = [];
    if (orderItems && orderItems?.length > 0) {
      for (const item of orderItems) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select(
            "id_products, product_name, product_description, price, price_sale, variant_product"
          )
          .eq("id_products", item.id_products)
          .single();
        if (!productError && product) {
          orderItemsWithProducts?.push({
            ...item,
            product: product,
          });
        } else {
          orderItemsWithProducts?.push({
            ...item,
            product: null,
          });
          console.error(
            `Failed to fetch product for order item ${item.id_order_items}:`,
            productError
          );
        }
      }
    }

    // @log(order items with products)
    {process.env.NODE_ENV === "development" && (
      console.log("Order items with products:", orderItemsWithProducts)
    )}

    // @create(basic auth)
    const basicAuth = Buffer.from(
      process.env.NEXT_PUBLIC_XENDIT_TOKEN || ""
    ).toString("base64");

    // @log(basic auth)
    {process.env.NODE_ENV === "development" && (
      console.log("Basic auth:", basicAuth)
    )}

    const Invoice = {
      external_id: `${extrnlId}`,
      amount: amount,
      payer_email: payerEmail,
      description: `Payment for order (#${order_checkout?.order_id}) at Tickets Coinfest Asia 2026`,
      customer: {
        given_names: fullname,
        surname: fullname,
        email: payerEmail,
      },
      // callback_url: `https://dev-icnhub.vercel.app/api/payments/webhook/invoice`,
      callback_url: process.env.NODE_ENV === "development" ? `https://ute-unmet-crowingly.ngrok-free.dev/api/payments/webhook/invoice` : `https://dev-icnhub.vercel.app/api/payments/webhook/invoice`,
      success_redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/order-received?process=${order}`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/order-failed?process=${order}`,
      currency: "IDR",
      items: [
        ...orderItemsWithProducts?.map((item) => ({
          name: item?.product?.product_name,
          quantity: item?.quantity,
          price: item?.product?.price ?? item?.product?.price_sale,
          category: "Tickets",
          url: "N/A",
        })),
      ],
      invoice_duration: 900,
      customer_notification_preference: {
        invoice_created: ["email"],
      },
      should_authenticate_credit_card: true,
    };

    const create_invoice = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(Invoice),
    });
    const create_payment = await create_invoice.json();

    // @update(order with payment_intent_id)
    if (create_payment?.id) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_provider: "Xendit",
          payment_intent_id: create_payment?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id_orders", order);
      if (updateError) {
        console.error(
          "Failed to update order with payment_intent_id:",
          updateError
        );
      }
    }

    return NextResponse.json(
      {
        data: create_payment,
        order: order_checkout,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
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
