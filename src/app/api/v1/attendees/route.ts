import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const generateAttendeeId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `A-${timestamp}${random}`;
};

const generateBillingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CS-${timestamp}${random}`;
};

type RawAttendee = {
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  position?: string;
  company_name?: string;
  company_focus?: string;
  company_size?: string;
  company_website?: string;
  custom_questions?: { question?: string; answer?: string }[];
  social_accounts?: { socialmedia?: string; url?: string }[];
  id_order_items?: string | number | null;
};

// @create(attendee and link to order items)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawAttendees: RawAttendee[] = Array.isArray(body?.attendees)
      ? (body.attendees as RawAttendee[])
      : body?.first_name || body?.email
      ? [body as RawAttendee]
      : [];

    if (!rawAttendees.length) {
      return NextResponse.json(
        { error: "No attendee data provided" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const orderId = cookieStore.get("grand_orders")?.value;
    const orderItemIdsCookie = cookieStore.get("grand_items")?.value;
    const guestSessionId = cookieStore.get("guest_sessions")?.value;

    if (!orderId || !orderItemIdsCookie) {
      return NextResponse.json(
        { error: "Missing order session (grand_orders or grand_items)" },
        { status: 400 }
      );
    }

    let orderItemIds: string[] = [];
    try {
      orderItemIds = JSON.parse(orderItemIdsCookie);
      if (!Array.isArray(orderItemIds)) {
        orderItemIds = [];
      }
    } catch {
      orderItemIds = [];
    }

    const allowedOrderItemIdsFromCookie = new Set(
      orderItemIds.map((id) => String(id).trim())
    );
    const sanitizedAttendees = rawAttendees?.map((att: RawAttendee) => ({
      first_name: (att?.first_name || "").trim(),
      last_name: att?.last_name?.trim() || null,
      email: (att?.email || "").trim(),
      country: att?.country?.trim() || null,
      position: att?.position?.trim() || null,
      company_name: att?.company_name?.trim() || null,
      company_focus: att?.company_focus?.trim() || null,
      company_size: att?.company_size?.trim() || null,
      company_website: att?.company_website?.trim() || null,
      custom_questions: Array.isArray(att?.custom_questions)
        ? att.custom_questions
            .map((q) => ({
              question: (q?.question || "").trim(),
              answer: (q?.answer || "").trim(),
            }))
            .filter((q) => q.question)
        : null,
      social_accounts: Array.isArray(att?.social_accounts)
        ? att.social_accounts
            .map((s) => ({
              socialmedia: (s?.socialmedia || "").trim(),
              url: (s?.url || "").trim(),
            }))
            .filter((s) => s.socialmedia || s.url)
        : null,
      id_order_items:
        att?.id_order_items !== undefined && att?.id_order_items !== null
          ? String(att?.id_order_items).trim()
          : "",
    }));

    const missingRequired = sanitizedAttendees.find(
      (att) => !att?.first_name || !att?.email
    );
    if (missingRequired) {
      return NextResponse.json(
        { error: "first_name and email are required for all attendees" },
        { status: 400 }
      );
    }

    const bodyOrderItemIds = sanitizedAttendees
      .map((att) => att.id_order_items)
      .filter((id): id is string => Boolean(id));

    const allowedOrderItemIds =
      allowedOrderItemIdsFromCookie.size > 0
        ? allowedOrderItemIdsFromCookie
        : new Set(bodyOrderItemIds);

    if (allowedOrderItemIds.size === 0) {
      return NextResponse.json(
        { error: "No order items found in session or request payload" },
        { status: 400 }
      );
    }

    const resolvedAttendees = sanitizedAttendees.map((att) => {
      if (att.id_order_items) {
        return att;
      }
      if (allowedOrderItemIds.size === 1) {
        return { ...att, id_order_items: Array.from(allowedOrderItemIds)[0] };
      }
      return att;
    });

    const invalidOrderItems = resolvedAttendees.filter(
      (att) =>
        !att.id_order_items || !allowedOrderItemIds.has(att.id_order_items)
    );

    if (invalidOrderItems.length > 0) {
      return NextResponse.json(
        { error: "Invalid or missing id_order_items for attendees" },
        { status: 400 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:154',message:'before createClient',data:{orderId,attendeesCount:resolvedAttendees.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    let supabase;
    try {
      supabase = await createClient();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:159',message:'createClient success',data:{hasClient:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (clientError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:163',message:'createClient error',data:{error:clientError?.message,errorName:clientError?.name,stack:clientError?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw clientError;
    }

    // @fetch(order to get event and creator info)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:171',message:'before fetch order',data:{orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id_orders, id_events, created_by, updated_by")
      .eq("id_orders", orderId)
      .single();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:179',message:'after fetch order',data:{hasOrder:!!order,hasError:!!orderError,errorCode:orderError?.code,errorMessage:orderError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (orderError || !order) {
      console.error("Failed to fetch order for attendee:", orderError);
      return NextResponse.json(
        { error: "Failed to fetch order for attendee" },
        { status: 500 }
      );
    }

    // @detect(first attendee and create customer)
    const firstAttendee = resolvedAttendees[0];
    let customerId: string | null = null;

    if (firstAttendee) {
      // @create(customer from first attendee)
      const billingName = `${firstAttendee?.first_name || ""} ${
        firstAttendee?.last_name || ""
      }`.trim();

      if (!billingName || !firstAttendee?.email) {
        return NextResponse.json(
          {
            error:
              "First attendee must have first_name, last_name, and email for customer creation",
          },
          { status: 400 }
        );
      }

      const customerPayload = {
        id_events: order.id_events,
        billing_id: generateBillingId(),
        billing_name: billingName,
        billing_email: firstAttendee?.email || null,
        billing_company: firstAttendee?.company_name || null,
        billing_country: firstAttendee?.country || null,
        billing_website_url: firstAttendee?.company_website || null,
        is_approved: false,
        created_by: null,
        updated_by: null,
        rank_record: 0,
        record_status: "published" as const,
      };

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:210',message:'before create customer',data:{billingName,billingEmail:!!firstAttendee?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert(customerPayload)
        .select("id_customers")
        .single();

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/attendees/route.ts:218',message:'after create customer',data:{hasCustomer:!!customer,hasError:!!customerError,errorCode:customerError?.code,errorMessage:customerError?.message,errorDetails:customerError?.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (customerError || !customer) {
        console.error("Failed to create customer:", customerError);
        return NextResponse.json(
          {
            error:
              customerError?.message ||
              "Failed to create customer from first attendee",
          },
          { status: 500 }
        );
      }
      customerId = customer.id_customers;

      // @update(order with customer id)
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          id_customers: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id_orders", orderId);

      if (orderUpdateError) {
        console.error("Failed to update order with customer:", orderUpdateError);
        return NextResponse.json(
          {
            error:
              orderUpdateError?.message ||
              "Failed to update order with customer",
          },
          { status: 500 }
        );
      }
    }

    const generatedAttendeeIds = resolvedAttendees.map(() =>
      generateAttendeeId()
    );

    // @create(attendees)
    const attendeePayload = resolvedAttendees.map((att, idx) => ({
      id_events: order.id_events,
      id_customers: customerId ?? null,
      attendee_id: generatedAttendeeIds[idx],
      first_name: att?.first_name,
      last_name: att?.last_name,
      email: att?.email,
      country: att?.country,
      position: att?.position,
      company_name: att?.company_name,
      company_focus: att?.company_focus,
      company_size: att?.company_size,
      company_website: att?.company_website,
      social_accounts: att?.social_accounts?.length
        ? att.social_accounts
        : null,
      custom_questions: att?.custom_questions?.length
        ? att?.custom_questions
        : null,
      self_edited: false,
      is_customer: idx === 0 ? true : false,
      is_approved: false,
      created_by: null,
      updated_by: null,
      record_status: "published",
    }));

    const { data: attendees, error: attendeeError } = await supabase
      .from("attendee")
      .insert(attendeePayload)
      .select("id_attendee, attendee_id");

    if (attendeeError || !attendees || attendees.length === 0) {
      console.error("Failed to create attendee:", attendeeError);
      return NextResponse.json(
        { error: attendeeError?.message || "Failed to create attendee" },
        { status: 500 }
      );
    }

    // @link(attendee to order items)
    const linkPayload = resolvedAttendees
      .map((att, idx) => ({
        id_order_items: att?.id_order_items,
        id_attendee: attendees?.[idx]?.id_attendee,
        created_by: null,
        updated_by: null,
        record_status: "published",
      }))
      .filter(
        (payload) =>
          payload?.id_order_items && payload?.id_attendee !== undefined
      );

    if (linkPayload.length !== resolvedAttendees.length) {
      return NextResponse.json(
        { error: "Failed to map attendees to order items" },
        { status: 500 }
      );
    }

    const { error: linkError } = await supabase
      .from("order_item_attendees")
      .insert(linkPayload);

    if (linkError) {
      console.error("Failed to link attendee to order items:", linkError);
      return NextResponse.json(
        {
          error: linkError.message || "Failed to link attendee to order items",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          attendee_ids: linkPayload.map((link) => link.id_attendee),
          customer_id: customerId,
        },
        message: "Attendees created and linked to order items successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating attendee:", error);
    return NextResponse.json(
      {
        error: "Failed to create attendee",
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
