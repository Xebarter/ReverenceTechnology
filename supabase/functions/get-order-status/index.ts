import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  orderNumber?: string;
  token?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Payload | null = null;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    payload = null;
  }

  const orderNumber = (payload?.orderNumber || "").trim();
  const token = (payload?.token || "").trim();

  if (!orderNumber || !token) {
    return new Response(JSON.stringify({ error: "Missing orderNumber or token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase env vars missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("orders")
    .select("payment_status, payment_reference, order_status")
    .eq("order_number", orderNumber)
    .eq("status_token", token)
    .maybeSingle();

  if (error) {
    console.error("[get-order-status] supabase error", error);
    return new Response(JSON.stringify({ error: "Failed to fetch order" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      payment_status: data.payment_status ?? null,
      payment_reference: data.payment_reference ?? null,
      order_status: data.order_status ?? null,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
