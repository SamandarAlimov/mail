import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * This endpoint is called by the Authorize page after user logs in and consents
 * It generates an authorization code and returns the redirect URL
 */

interface IssueCodeRequest {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
  consent_granted: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify user is authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get user from token
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body: IssueCodeRequest = await req.json();

  // Validate client
  const { data: client, error: clientError } = await supabaseAdmin
    .from("oauth_clients")
    .select("*")
    .eq("client_id", body.client_id)
    .eq("is_active", true)
    .single();

  if (clientError || !client) {
    return new Response(
      JSON.stringify({ error: "invalid_client", error_description: "Unknown or inactive client" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate redirect URI
  if (!client.redirect_uris.includes(body.redirect_uri)) {
    return new Response(
      JSON.stringify({ error: "invalid_request", error_description: "Invalid redirect_uri" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if consent was granted
  if (!body.consent_granted) {
    // User denied - redirect with error
    const redirectUrl = new URL(body.redirect_uri);
    redirectUrl.searchParams.set("error", "access_denied");
    redirectUrl.searchParams.set("error_description", "User denied the authorization request");
    redirectUrl.searchParams.set("state", body.state);

    return new Response(
      JSON.stringify({ redirect_url: redirectUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Store or update consent
  const { error: consentError } = await supabaseAdmin
    .from("oauth_consents")
    .upsert(
      {
        user_id: user.id,
        client_id: body.client_id,
        scope: body.scope,
        granted_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "user_id,client_id" }
    );

  if (consentError) {
    console.error("Failed to store consent:", consentError);
  }

  // Generate authorization code
  const code = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { error: codeError } = await supabaseAdmin.from("oauth_authorization_codes").insert({
    code,
    client_id: body.client_id,
    user_id: user.id,
    redirect_uri: body.redirect_uri,
    scope: body.scope,
    code_challenge: body.code_challenge,
    code_challenge_method: body.code_challenge_method || "S256",
    expires_at: expiresAt.toISOString(),
  });

  if (codeError) {
    console.error("Failed to create authorization code:", codeError);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: "Failed to create authorization code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Build redirect URL with code
  const redirectUrl = new URL(body.redirect_uri);
  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", body.state);

  return new Response(
    JSON.stringify({ redirect_url: redirectUrl.toString() }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
