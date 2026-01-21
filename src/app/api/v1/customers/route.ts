import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// @get(customer by id_customers)
export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:5',message:'GET customers entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  try {
    const { searchParams } = new URL(request.url);
    const idCustomers = searchParams.get("id_customers");

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:10',message:'parsed searchParams',data:{idCustomers:!!idCustomers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!idCustomers) {
      return NextResponse.json(
        { error: "id_customers parameter is required" },
        { status: 400 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:19',message:'before createClient',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    let supabase;
    try {
      supabase = await createClient();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:23',message:'createClient success',data:{hasClient:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (clientError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:27',message:'createClient error',data:{error:clientError?.message,errorName:clientError?.name,stack:clientError?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw clientError;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:33',message:'before supabase query',data:{idCustomers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id_customers", idCustomers)
      .single();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:41',message:'after supabase query',data:{hasData:!!data,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,errorDetails:error?.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch customer" },
        { status: 500 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:51',message:'GET customers success',data:{hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      data,
      message: "Customer fetched successfully",
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/v1/customers/route.ts:60',message:'GET customers catch error',data:{error:error?.message,errorName:error?.name,stack:error?.stack?.substring(0,400)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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
