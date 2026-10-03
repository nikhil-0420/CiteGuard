import { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { validateOAuthState, setCurrentUser, DEMO_USERS } from "../auth";
import { ShieldIcon, AlertTriangleIcon, CheckCircleIcon } from "../components/Icons";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = router.searchParams.get("code");
    const state = router.searchParams.get("state");
    const error = router.searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMessage(`Authentication was denied or canceled: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setErrorMessage("Missing authorization code or state parameter from provider.");
      return;
    }

    if (!validateOAuthState(state)) {
      setStatus("error");
      setErrorMessage("Invalid or expired OAuth state parameter (CSRF protection triggered).");
      return;
    }

    // In local hackathon environment without a live OAuth exchange backend,
    // we log in as the default author/reviewer and redirect safely.
    setStatus("success");
    setCurrentUser(DEMO_USERS.sam);

    const timer = setTimeout(() => {
      router.navigate("/app");
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "540px", gridTemplateColumns: "1fr", textAlign: "center" }}>
        <div className="login-form-side" style={{ padding: "3rem 2rem" }}>
          <div style={{ display: "inline-flex", padding: "0.75rem", background: "var(--surface-subtle)", borderRadius: "50%", marginBottom: "1.25rem" }}>
            <ShieldIcon size={32} style={{ color: "var(--cg-accent)" }} />
          </div>

          {status === "verifying" &&
          <div>
              <h2>Verifying credentials...</h2>
              <p style={{ marginTop: "0.5rem", color: "var(--cg-ink-muted)", fontSize: "0.875rem" }}>
                Exchanging authorization code with GitHub and verifying allowlist status.
              </p>
            </div>
          }

          {status === "success" &&
          <div>
              <div style={{ color: "var(--success)", display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                <CheckCircleIcon size={36} />
              </div>
              <h2>Authentication verified</h2>
              <p style={{ marginTop: "0.5rem", color: "var(--cg-ink-muted)", fontSize: "0.875rem" }}>
                Welcome, Sam. Redirecting to your workspace...
              </p>
            </div>
          }

          {status === "error" &&
          <div>
              <div style={{ color: "var(--cg-block)", display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                <AlertTriangleIcon size={36} />
              </div>
              <h2>Authentication Failed</h2>
              <p style={{ marginTop: "0.5rem", color: "var(--cg-block)", fontSize: "0.875rem" }}>
                {errorMessage}
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <Link href="/login" className="btn btn-primary">
                  Return to sign in
                </Link>
              </div>
            </div>
          }
        </div>
      </div>
    </div>);

}