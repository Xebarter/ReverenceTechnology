// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InquiryPayload = {
  full_name?: string;
  fullName?: string;
  email?: string;
  message?: string;
  phone_number?: string;
  phone?: string;
  company_name?: string;
  company?: string;
  interested_package?: string;
  service_interest?: string;
  source?: string;
  submitted_at?: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: InquiryPayload;
  try {
    payload = (await req.json()) as InquiryPayload;
  } catch (error) {
    console.error("Failed to parse request body", error);
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const normalized = {
    full_name: payload.full_name?.trim() ?? payload.fullName?.trim() ?? "",
    email: payload.email?.trim() ?? "",
    message: payload.message?.trim() ?? "",
    phone_number: payload.phone_number?.trim() ?? payload.phone?.trim() ?? "",
    company_name: payload.company_name?.trim() ?? payload.company?.trim() ?? "",
    interested_package:
      payload.interested_package?.trim() ?? payload.service_interest?.trim() ?? "",
    source: payload.source?.trim() ?? "contact",
    submitted_at: payload.submitted_at ?? new Date().toISOString(),
  };

  if (!normalized.full_name || !normalized.email || !normalized.message) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not configured");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const toAddress = Deno.env.get("NOTIFY_EMAIL") ?? "reverencetech1@gmail.com";
  const fromAddress = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "onboarding@resend.dev";

  const subject = `New inquiry from ${normalized.full_name}`;
  const messageBody = escapeHtml(normalized.message).replace(/\n/g, "<br />");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="color: #1f2937;">New inquiry submitted (${escapeHtml(normalized.source)})</h2>
      <p><strong>Name:</strong> ${escapeHtml(normalized.full_name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(normalized.email)}</p>
      ${normalized.phone_number ? `<p><strong>Phone:</strong> ${escapeHtml(normalized.phone_number)}</p>` : ""}
      ${normalized.company_name ? `<p><strong>Company:</strong> ${escapeHtml(normalized.company_name)}</p>` : ""}
      ${normalized.interested_package ? `<p><strong>Interested In:</strong> ${escapeHtml(normalized.interested_package)}</p>` : ""}
      <p><strong>Submitted At:</strong> ${escapeHtml(new Date(normalized.submitted_at).toLocaleString())}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <p><strong>Message:</strong></p>
      <p>${messageBody}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      subject,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to send email", errorText);
    let providerError: unknown = null;
    try {
      providerError = JSON.parse(errorText);
    } catch {
      providerError = errorText;
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        provider: providerError,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const result = await response.json();

  return new Response(JSON.stringify({ status: "sent", id: result.id ?? null }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
