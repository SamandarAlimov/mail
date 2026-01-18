import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  grant_type: string;
  code?: string;
  redirect_uri?: string;
  client_id: string;
  code_verifier?: string;
  refresh_token?: string;
}

// PKCE code challenge verification
async function verifyCodeChallenge(verifier: string, challenge: string, method: string): Promise<boolean> {
  if (method === "plain") {
    return verifier === challenge;
  }
  
  // S256
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return base64 === challenge;
}

// Generate secure token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "invalid_request", error_description: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: TokenRequest;
  
  const contentType = req.headers.get("content-type");
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    body = {
      grant_type: formData.get("grant_type") as string,
      code: formData.get("code") as string,
      redirect_uri: formData.get("redirect_uri") as string,
      client_id: formData.get("client_id") as string,
      code_verifier: formData.get("code_verifier") as string,
      refresh_token: formData.get("refresh_token") as string,
    };
  } else {
    body = await req.json();
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

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
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Handle authorization_code grant
  if (body.grant_type === "authorization_code") {
    if (!body.code || !body.redirect_uri) {
      return new Response(
        JSON.stringify({ error: "invalid_request", error_description: "Missing code or redirect_uri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find and validate authorization code
    const { data: authCode, error: codeError } = await supabaseAdmin
      .from("oauth_authorization_codes")
      .select("*")
      .eq("code", body.code)
      .eq("client_id", body.client_id)
      .is("used_at", null)
      .single();

    if (codeError || !authCode) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "Invalid or expired authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if code is expired
    if (new Date(authCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "Authorization code has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate redirect_uri matches
    if (authCode.redirect_uri !== body.redirect_uri) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "Redirect URI mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate PKCE code_verifier
    if (authCode.code_challenge) {
      if (!body.code_verifier) {
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Missing code_verifier" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyCodeChallenge(
        body.code_verifier,
        authCode.code_challenge,
        authCode.code_challenge_method || "S256"
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Invalid code_verifier" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Mark authorization code as used
    await supabaseAdmin
      .from("oauth_authorization_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", authCode.id);

    // Get user info
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(authCode.user_id);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "server_error", error_description: "Failed to get user info" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate tokens
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store access token
    const { data: storedAccessToken } = await supabaseAdmin
      .from("oauth_access_tokens")
      .insert({
        token: accessToken,
        client_id: body.client_id,
        user_id: authCode.user_id,
        scope: authCode.scope,
        expires_at: accessTokenExpiry.toISOString(),
      })
      .select()
      .single();

    // Store refresh token
    await supabaseAdmin.from("oauth_refresh_tokens").insert({
      token: refreshToken,
      access_token_id: storedAccessToken?.id,
      client_id: body.client_id,
      user_id: authCode.user_id,
      expires_at: refreshTokenExpiry.toISOString(),
    });

    // Prepare user info based on scopes
    const scopes = authCode.scope.split(" ");
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

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: authCode.scope,
        user: userInfo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Handle refresh_token grant
  if (body.grant_type === "refresh_token") {
    if (!body.refresh_token) {
      return new Response(
        JSON.stringify({ error: "invalid_request", error_description: "Missing refresh_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find and validate refresh token
    const { data: storedRefreshToken, error: refreshError } = await supabaseAdmin
      .from("oauth_refresh_tokens")
      .select("*, oauth_access_tokens(*)")
      .eq("token", body.refresh_token)
      .eq("client_id", body.client_id)
      .is("revoked_at", null)
      .single();

    if (refreshError || !storedRefreshToken) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "Invalid refresh token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if refresh token is expired
    if (new Date(storedRefreshToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "Refresh token has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Revoke old tokens
    await supabaseAdmin
      .from("oauth_access_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", storedRefreshToken.access_token_id);

    await supabaseAdmin
      .from("oauth_refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", storedRefreshToken.id);

    // Generate new tokens
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const scope = storedRefreshToken.oauth_access_tokens?.scope || "openid profile email";

    // Store new access token
    const { data: newAccessToken } = await supabaseAdmin
      .from("oauth_access_tokens")
      .insert({
        token: accessToken,
        client_id: body.client_id,
        user_id: storedRefreshToken.user_id,
        scope,
        expires_at: accessTokenExpiry.toISOString(),
      })
      .select()
      .single();

    // Store new refresh token
    await supabaseAdmin.from("oauth_refresh_tokens").insert({
      token: refreshToken,
      access_token_id: newAccessToken?.id,
      client_id: body.client_id,
      user_id: storedRefreshToken.user_id,
      expires_at: refreshTokenExpiry.toISOString(),
    });

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ error: "unsupported_grant_type", error_description: "Unsupported grant type" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
