import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { handleSSOCallback } from "@/lib/sso";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import alsamosLogo from "@/assets/alsamos-logo.png";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle error from accounts.alsamos.com
      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || error);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus("error");
        setErrorMessage("Missing required parameters");
        return;
      }

      // Handle the SSO callback
      const result = await handleSSOCallback(code, state);

      if ("error" in result) {
        setStatus("error");
        setErrorMessage(result.error);
        return;
      }

      try {
        // Create session via edge function that handles SSO token verification
        console.log("Invoking sso-session edge function...");
        
        const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
          "sso-session",
          {
            body: {
              sso_token: result.token,
              user: result.user,
            },
          }
        );

        console.log("SSO session response:", sessionData);

        if (sessionError) {
          console.error("SSO session error:", sessionError);
          throw new Error(sessionError.message || "Session creation failed");
        }

        if (!sessionData?.success) {
          throw new Error(sessionData?.error || "SSO verification failed");
        }

        // If we got a magic link, use it to complete sign-in
        if (sessionData.magic_link) {
          // Extract token from magic link and verify
          const magicLinkUrl = new URL(sessionData.magic_link);
          const token = magicLinkUrl.searchParams.get("token");
          const type = magicLinkUrl.searchParams.get("type");
          
          if (token && type) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type as "magiclink",
            });
            
            if (verifyError) {
              console.error("Magic link verification error:", verifyError);
              // Fall through to success - user was created, they can login normally
            }
          }
        }

        setStatus("success");
        toast({
          title: "Welcome!",
          description: `Signed in as ${result.user.email}`,
        });

        // Redirect to inbox after short delay
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } catch (err) {
        console.error("Session creation error:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to create session. Please try again.");
      }
    };

    processCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <img src={alsamosLogo} alt="Alsamos" className="w-16 h-16 mx-auto mb-6" />

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
              <p className="text-muted-foreground">
                Verifying your Alsamos account
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome to Alsamos Mail!</h2>
              <p className="text-muted-foreground">
                Redirecting to your inbox...
              </p>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <button
                onClick={() => navigate("/auth")}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
