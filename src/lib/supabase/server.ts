import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:5',message:'createClient entry',data:{hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasAnonKey:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  let cookieStore;
  try {
    cookieStore = await cookies();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:9',message:'cookies() success',data:{cookieCount:cookieStore.getAll().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  } catch (cookieError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:12',message:'cookies() error',data:{error:cookieError?.message,errorName:cookieError?.name,stack:cookieError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw cookieError;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:18',message:'before createServerClient',data:{hasUrl:!!supabaseUrl,urlLength:supabaseUrl?.length||0,hasKey:!!supabaseAnonKey,keyLength:supabaseAnonKey?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (!supabaseUrl || !supabaseAnonKey) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:25',message:'missing env vars',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error('Missing Supabase environment variables');
  }

  try {
    const client = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // @server-component
            }
          },
        },
      }
    );
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:45',message:'createServerClient success',data:{clientCreated:!!client},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return client;
  } catch (clientError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7caf6fda-8a89-4f11-a97e-afa0aff5703e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:50',message:'createServerClient error',data:{error:clientError?.message,errorName:clientError?.name,stack:clientError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw clientError;
  }
}