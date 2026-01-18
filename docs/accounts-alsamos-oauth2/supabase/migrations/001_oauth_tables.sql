-- =====================================================
-- OAuth2 Authorization Server Tables
-- accounts.alsamos.com uchun
-- =====================================================

-- OAuth2 Clients (mail.alsamos.com, calendar.alsamos.com, etc.)
CREATE TABLE public.oauth_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_secret TEXT, -- NULL for public clients
    redirect_uris TEXT[] NOT NULL,
    allowed_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Authorization Codes (temporary, exchanged for tokens)
CREATE TABLE public.oauth_authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    client_id TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    scope TEXT NOT NULL,
    code_challenge TEXT, -- PKCE
    code_challenge_method TEXT DEFAULT 'S256',
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Access Tokens
CREATE TABLE public.oauth_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    client_id TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Refresh Tokens
CREATE TABLE public.oauth_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    access_token_id UUID REFERENCES public.oauth_access_tokens(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Consents (remember user's consent for each client)
CREATE TABLE public.oauth_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(user_id, client_id)
);

-- Enable RLS
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oauth_clients (public read for active clients)
CREATE POLICY "Active clients are publicly readable"
ON public.oauth_clients FOR SELECT
USING (is_active = true);

-- RLS Policies for oauth_consents
CREATE POLICY "Users can view their own consents"
ON public.oauth_consents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
ON public.oauth_consents FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_oauth_codes_code ON public.oauth_authorization_codes(code);
CREATE INDEX idx_oauth_codes_expires ON public.oauth_authorization_codes(expires_at);
CREATE INDEX idx_oauth_tokens_token ON public.oauth_access_tokens(token);
CREATE INDEX idx_oauth_tokens_user ON public.oauth_access_tokens(user_id);
CREATE INDEX idx_oauth_refresh_token ON public.oauth_refresh_tokens(token);

-- Insert default client for mail.alsamos.com
INSERT INTO public.oauth_clients (client_id, client_name, redirect_uris, allowed_scopes)
VALUES (
    'mail.alsamos.com',
    'Alsamos Mail',
    ARRAY[
        'http://localhost:5173/auth/callback',
        'http://localhost:3000/auth/callback',
        'https://mail.alsamos.com/auth/callback'
    ],
    ARRAY['openid', 'profile', 'email']
);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete expired and unused authorization codes
    DELETE FROM public.oauth_authorization_codes
    WHERE expires_at < now() OR used_at IS NOT NULL;
    
    -- Mark expired tokens as revoked
    UPDATE public.oauth_access_tokens
    SET revoked_at = now()
    WHERE expires_at < now() AND revoked_at IS NULL;
    
    UPDATE public.oauth_refresh_tokens
    SET revoked_at = now()
    WHERE expires_at < now() AND revoked_at IS NULL;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.oauth_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER oauth_clients_updated_at
BEFORE UPDATE ON public.oauth_clients
FOR EACH ROW EXECUTE FUNCTION public.oauth_update_updated_at();
