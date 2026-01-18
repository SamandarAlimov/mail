import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
  mode?: "login" | "signup";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Parse query parameters
  const params: AuthorizeRequest = {
    response_type: url.searchParams.get("response_type") || "",
    client_id: url.searchParams.get("client_id") || "",
    redirect_uri: url.searchParams.get("redirect_uri") || "",
    scope: url.searchParams.get("scope") || "openid profile email",
    state: url.searchParams.get("state") || "",
    code_challenge: url.searchParams.get("code_challenge") || undefined,
    code_challenge_method: url.searchParams.get("code_challenge_method") || "S256",
    mode: (url.searchParams.get("mode") as "login" | "signup") || "login",
  };

  // Validate required parameters
  if (params.response_type !== "code") {
    return new Response(
      JSON.stringify({ error: "unsupported_response_type", error_description: "Only 'code' response type is supported" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!params.client_id || !params.redirect_uri || !params.state) {
    return new Response(
      JSON.stringify({ error: "invalid_request", error_description: "Missing required parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate client
  const { data: client, error: clientError } = await supabaseAdmin
    .from("oauth_clients")
    .select("*")
    .eq("client_id", params.client_id)
    .eq("is_active", true)
    .single();

  if (clientError || !client) {
    return new Response(
      JSON.stringify({ error: "invalid_client", error_description: "Unknown or inactive client" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate redirect URI
  if (!client.redirect_uris.includes(params.redirect_uri)) {
    return new Response(
      JSON.stringify({ error: "invalid_request", error_description: "Invalid redirect_uri" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate scopes
  const requestedScopes = params.scope.split(" ");
  const invalidScopes = requestedScopes.filter(s => !client.allowed_scopes.includes(s));
  if (invalidScopes.length > 0) {
    return new Response(
      JSON.stringify({ error: "invalid_scope", error_description: `Invalid scopes: ${invalidScopes.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if user is already authenticated
  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    userId = user?.id || null;
  }

  // If user is authenticated, check for existing consent
  if (userId) {
    const { data: consent } = await supabaseAdmin
      .from("oauth_consents")
      .select("*")
      .eq("user_id", userId)
      .eq("client_id", params.client_id)
      .is("revoked_at", null)
      .single();

    // If consent exists and covers all requested scopes, issue code directly
    if (consent) {
      const consentScopes = consent.scope.split(" ");
      const hasAllScopes = requestedScopes.every(s => consentScopes.includes(s));

      if (hasAllScopes) {
        // Generate authorization code
        const code = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await supabaseAdmin.from("oauth_authorization_codes").insert({
          code,
          client_id: params.client_id,
          user_id: userId,
          redirect_uri: params.redirect_uri,
          scope: params.scope,
          code_challenge: params.code_challenge,
          code_challenge_method: params.code_challenge_method,
          expires_at: expiresAt.toISOString(),
        });

        // Redirect back with code
        const redirectUrl = new URL(params.redirect_uri);
        redirectUrl.searchParams.set("code", code);
        redirectUrl.searchParams.set("state", params.state);

        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: redirectUrl.toString(),
          },
        });
      }
    }
  }

  // User needs to login or consent - redirect to authorize page
  const authorizePageUrl = new URL(Deno.env.get("ACCOUNTS_URL") || "https://accounts.alsamos.com");
  authorizePageUrl.pathname = "/authorize";
  
  // Pass all OAuth parameters to the authorize page
  authorizePageUrl.searchParams.set("client_id", params.client_id);
  authorizePageUrl.searchParams.set("redirect_uri", params.redirect_uri);
  authorizePageUrl.searchParams.set("scope", params.scope);
  authorizePageUrl.searchParams.set("state", params.state);
  authorizePageUrl.searchParams.set("response_type", "code");
  if (params.code_challenge) {
    authorizePageUrl.searchParams.set("code_challenge", params.code_challenge);
    authorizePageUrl.searchParams.set("code_challenge_method", params.code_challenge_method || "S256");
  }
  authorizePageUrl.searchParams.set("mode", params.mode || "login");
  authorizePageUrl.searchParams.set("client_name", client.client_name);

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: authorizePageUrl.toString(),
    },
  });
});
