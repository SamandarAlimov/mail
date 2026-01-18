import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get token from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "invalid_token", error_description: "Missing or invalid Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find the access token
  const { data: accessToken, error: tokenError } = await supabaseAdmin
    .from("oauth_access_tokens")
    .select("*")
    .eq("token", token)
    .is("revoked_at", null)
    .single();

  if (tokenError || !accessToken) {
    return new Response(
      JSON.stringify({ error: "invalid_token", error_description: "Token not found or revoked" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if token is expired
  if (new Date(accessToken.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: "invalid_token", error_description: "Token has expired" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get user info
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(accessToken.user_id);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "server_error", error_description: "Failed to get user info" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Prepare user info based on scopes
  const scopes = accessToken.scope.split(" ");
  const userInfo: Record<string, unknown> = {
    id: user.id,
    email_verified: user.email_confirmed_at !== null,
  };

  if (scopes.includes("email")) {
    userInfo.email = user.email;
  }

  if (scopes.includes("profile")) {
    userInfo.name = user.user_metadata?.full_name || user.user_metadata?.name;
    userInfo.avatar_url = user.user_metadata?.avatar_url;
  }

  // Token introspection response
  return new Response(
    JSON.stringify({
      active: true,
      scope: accessToken.scope,
      client_id: accessToken.client_id,
      token_type: "Bearer",
      exp: Math.floor(new Date(accessToken.expires_at).getTime() / 1000),
      iat: Math.floor(new Date(accessToken.created_at).getTime() / 1000),
      sub: user.id,
      user: userInfo,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
