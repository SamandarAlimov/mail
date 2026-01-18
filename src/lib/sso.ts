/**
 * SSO Integration with accounts.alsamos.com
 * 
 * This module handles the OAuth-like flow between mail.alsamos.com and accounts.alsamos.com
 */

// Configuration - Update these when deploying
const SSO_CONFIG = {
  // The Alsamos Accounts server URL
  accountsUrl: "https://accounts.alsamos.com",
  // This app's identifier
  clientId: "mail.alsamos.com",
  // Where accounts.alsamos.com should redirect after auth
  redirectUri: typeof window !== "undefined" 
    ? `${window.location.origin}/auth/callback`
    : "",
  // Scopes to request
  scopes: ["openid", "profile", "email"],
};

/**
 * Generate a random state for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
  
  // Create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  
  // Base64URL encode
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return { verifier, challenge };
}

/**
 * Redirect to accounts.alsamos.com for authentication
 */
export async function redirectToSSO(mode: "login" | "signup" = "login"): Promise<void> {
  // Generate state and PKCE
  const state = generateState();
  const { verifier, challenge } = await generatePKCE();
  
  // Store state and verifier for verification on callback
  sessionStorage.setItem("sso_state", state);
  sessionStorage.setItem("sso_code_verifier", verifier);
  sessionStorage.setItem("sso_mode", mode);
  
  // Build authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SSO_CONFIG.clientId,
    redirect_uri: SSO_CONFIG.redirectUri,
    scope: SSO_CONFIG.scopes.join(" "),
    state: state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    mode: mode, // Tell accounts.alsamos.com whether to show login or signup
  });
  
  // Redirect to accounts.alsamos.com
  window.location.href = `${SSO_CONFIG.accountsUrl}/authorize?${params.toString()}`;
}

/**
 * Handle the callback from accounts.alsamos.com
 */
export async function handleSSOCallback(
  code: string,
  state: string
): Promise<{ token: string; user: SSOUser } | { error: string }> {
  // Verify state matches
  const savedState = sessionStorage.getItem("sso_state");
  if (state !== savedState) {
    return { error: "Invalid state parameter. Possible CSRF attack." };
  }
  
  // Get code verifier
  const codeVerifier = sessionStorage.getItem("sso_code_verifier");
  if (!codeVerifier) {
    return { error: "Missing code verifier. Please try again." };
  }
  
  // Clean up session storage
  sessionStorage.removeItem("sso_state");
  sessionStorage.removeItem("sso_code_verifier");
  sessionStorage.removeItem("sso_mode");
  
  try {
    // Exchange code for token via Edge Function on accounts.alsamos.com
    const tokenUrl = `${SSO_CONFIG.accountsUrl}/functions/v1/oauth-token`;
    console.log("Exchanging code for token at:", tokenUrl);
    
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SSO_CONFIG.redirectUri,
        client_id: SSO_CONFIG.clientId,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", errorText);
      try {
        const error = JSON.parse(errorText);
        return { error: error.error || error.message || "Failed to exchange code for token" };
      } catch {
        return { error: "Failed to exchange code for token" };
      }
    }
    
    const data = await response.json();
    console.log("Token exchange successful, user:", data.user?.email);
    
    return {
      token: data.access_token,
      user: data.user,
    };
  } catch (error) {
    console.error("SSO callback error:", error);
    return { error: "Failed to complete authentication" };
  }
}

/**
 * Verify a token with accounts.alsamos.com
 */
export async function verifySSOToken(token: string): Promise<SSOUser | null> {
  try {
    const response = await fetch(`${SSO_CONFIG.accountsUrl}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * User data from SSO
 */
export interface SSOUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified: boolean;
}

/**
 * Get the SSO configuration (for accounts.alsamos.com to validate)
 */
export function getSSOConfig() {
  return {
    clientId: SSO_CONFIG.clientId,
    redirectUri: SSO_CONFIG.redirectUri,
    accountsUrl: SSO_CONFIG.accountsUrl,
  };
}
