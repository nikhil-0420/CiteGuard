import { RouterProvider, useRouter, Link } from "./router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import MethodologyPage from "./pages/MethodologyPage";
import OverviewPage from "./pages/OverviewPage";
import AuditsListPage from "./pages/AuditsListPage";
import NewAuditPage from "./pages/NewAuditPage";
import AuditWorkspacePage from "./pages/AuditWorkspacePage";
import ReviewsPage from "./pages/ReviewsPage";
import SourcesPage from "./pages/SourcesPage";
import PoliciesPage from "./pages/PoliciesPage";
import EvalPage from "./pages/EvalPage";
import SettingsPage from "./pages/SettingsPage";
import { ArrowLeftIcon } from "./components/Icons";

function RouteSwitch() {
  const { pathname, searchParams } = useRouter();

  // Backward compatibility: If accessed via legacy query string `/?report=...`
  if (pathname === "/" && searchParams.get("report")) {
    const reportId = searchParams.get("report") || "blocked";
    return <AuditWorkspacePage auditId={reportId} isSampleMode={true} />;
  }

  // Backward compatibility: If accessed via legacy `/?view=eval`
  if (pathname === "/" && searchParams.get("view") === "eval") {
    return <EvalPage />;
  }

  // 1. Mandatory Public Hero Landing Page at /
  if (pathname === "/") {
    return <LandingPage />;
  }

  // 2. Mandatory Dedicated Login Page at /login
  if (pathname === "/login") {
    return <LoginPage />;
  }

  // 3. Provider OAuth Callback at /auth/callback
  if (pathname === "/auth/callback") {
    return <AuthCallbackPage />;
  }

  // 4. Public Methodology Page at /methodology
  if (pathname === "/methodology") {
    return <MethodologyPage />;
  }

  // 5. Sample Workspace Routes: /demo and /demo/audits/:auditId
  if (pathname === "/demo") {
    return <AuditWorkspacePage auditId="blocked" isSampleMode={true} />;
  }
  if (pathname.startsWith("/demo/audits/")) {
    const auditId = pathname.replace("/demo/audits/", "") || "blocked";
    return <AuditWorkspacePage auditId={auditId} isSampleMode={true} />;
  }

  // 6. Workspace Overview at /app
  if (pathname === "/app") {
    return <OverviewPage />;
  }

  // 7. Audit History at /app/audits
  if (pathname === "/app/audits") {
    return <AuditsListPage />;
  }

  // 8. New Audit Wizard at /app/audits/new
  if (pathname === "/app/audits/new") {
    return <NewAuditPage />;
  }

  // 9. Primary Report / Evidence Workspace at /app/audits/:auditId
  if (pathname.startsWith("/app/audits/")) {
    const auditId = pathname.replace("/app/audits/", "") || "blocked";
    return <AuditWorkspacePage auditId={auditId} isSampleMode={false} />;
  }

  // 10. Review Queue at /app/reviews
  if (pathname === "/app/reviews") {
    return <ReviewsPage />;
  }

  // 11. Source Library at /app/sources
  if (pathname === "/app/sources") {
    return <SourcesPage />;
  }

  // 12. Policy Viewer at /app/policies
  if (pathname === "/app/policies") {
    return <PoliciesPage />;
  }

  // 13. Evaluation Results at /app/results
  if (pathname === "/app/results") {
    return <EvalPage />;
  }

  // 14. Settings & Integrations at /app/settings & /app/settings/integrations
  if (pathname === "/app/settings" || pathname === "/app/settings/integrations") {
    return <SettingsPage />;
  }

  // 15. Clean 404 Fallback
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cg-canvas)", padding: "2rem" }}>
      <div style={{ maxWidth: "480px", background: "var(--cg-surface)", border: "1px solid var(--cg-line)", borderRadius: "8px", padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--cg-block)", fontWeight: 700, marginBottom: "0.5rem" }}>
          HTTP 404 &bull; NOT FOUND
        </div>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Document or Route Not Found</h1>
        <p style={{ color: "var(--cg-ink-muted)", fontSize: "0.875rem", lineHeight: 1.55, marginBottom: "1.5rem" }}>
          The requested path <code>{pathname}</code> is not a recognized CiteGuard endpoint.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: "inline-flex", gap: "0.4rem" }}>
          <ArrowLeftIcon size={14} /> Return to CiteGuard Home
        </Link>
      </div>
    </div>);

}

export default function App() {
  return (
    <RouterProvider>
      <RouteSwitch />
    </RouterProvider>);

}