import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, User, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import alsamosLogo from "@/assets/alsamos-logo.png";

/**
 * OAuth2 Authorization Page
 * 
 * Bu sahifa:
 * 1. Foydalanuvchi login/register qiladi
 * 2. Client haqida ma'lumot ko'rsatadi (mail.alsamos.com)
 * 3. Ruxsat so'raydi (consent screen)
 * 4. Authorization code bilan client ga redirect qiladi
 */

interface OAuthParams {
  clientId: string;
  clientName: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  mode: "login" | "signup";
}

const SCOPE_DESCRIPTIONS: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  openid: {
    icon: <Shield className="w-5 h-5" />,
    label: "Identity",
    description: "Verify your identity",
  },
  email: {
    icon: <Mail className="w-5 h-5" />,
    label: "Email",
    description: "Access your email address",
  },
  profile: {
    icon: <User className="w-5 h-5" />,
    label: "Profile",
    description: "Access your name and profile picture",
  },
};

export function AuthorizePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [oauthParams, setOauthParams] = useState<OAuthParams | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Parse OAuth parameters
  useEffect(() => {
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const state = searchParams.get("state");

    if (!clientId || !redirectUri || !state) {
      setError("Missing required OAuth parameters");
      setIsLoading(false);
      return;
    }

    setOauthParams({
      clientId,
      clientName: searchParams.get("client_name") || clientId,
      redirectUri,
      scope: searchParams.get("scope") || "openid profile email",
      state,
      codeChallenge: searchParams.get("code_challenge") || undefined,
      codeChallengeMethod: searchParams.get("code_challenge_method") || "S256",
      mode: (searchParams.get("mode") as "login" | "signup") || "login",
    });

    setIsLoginMode(searchParams.get("mode") !== "signup");
  }, [searchParams]);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle login/signup
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "You can now authorize the application.",
        });
      }
    } catch (err) {
      toast({
        title: "Authentication failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle authorization (consent)
  const handleAuthorize = async (granted: boolean) => {
    if (!oauthParams) return;

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("oauth-issue-code", {
        body: {
          client_id: oauthParams.clientId,
          redirect_uri: oauthParams.redirectUri,
          scope: oauthParams.scope,
          state: oauthParams.state,
          code_challenge: oauthParams.codeChallenge,
          code_challenge_method: oauthParams.codeChallengeMethod,
          consent_granted: granted,
        },
      });

      if (error) throw error;

      // Redirect to the client with the code
      if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      toast({
        title: "Authorization failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Handle "use different account"
  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Authorization Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!oauthParams) {
    return null;
  }

  const scopes = oauthParams.scope.split(" ").filter(s => SCOPE_DESCRIPTIONS[s]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {/* <img src={alsamosLogo} alt="Alsamos" className="w-16 h-16 mx-auto mb-4" /> */}
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">ALSAMOS</span>
            <span className="text-primary ml-1">ACCOUNT</span>
          </h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {!isAuthenticated ? (
            // Login/Signup Form
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold mb-1">
                  {isLoginMode ? "Sign in to continue" : "Create your account"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{oauthParams.clientName}</span> wants to access your account
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isLoginMode && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Full Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLoginMode}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isLoginMode ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-primary hover:underline"
                >
                  {isLoginMode ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          ) : (
            // Consent Screen
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">
                  Authorize {oauthParams.clientName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{userEmail}</span>
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  This will allow <span className="font-medium text-foreground">{oauthParams.clientName}</span> to:
                </p>
                
                {scopes.map((scope) => {
                  const scopeInfo = SCOPE_DESCRIPTIONS[scope];
                  return (
                    <div key={scope} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="text-primary">{scopeInfo.icon}</div>
                      <div>
                        <p className="font-medium text-sm">{scopeInfo.label}</p>
                        <p className="text-xs text-muted-foreground">{scopeInfo.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAuthorize(false)}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Deny
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAuthorize(true)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Allow
                    </>
                  )}
                </Button>
              </div>

              <button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
              >
                Use a different account
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to Alsamos's{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
}
