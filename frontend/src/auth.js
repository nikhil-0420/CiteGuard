/**
 * CiteGuard Authentication & Session Store
 * Supports real provider contracts (GitHub OAuth, Magic Link) with honest configuration disclosure
 * and instant demo accounts for hackathon judges and local evaluators.
 */












export const DEMO_USERS = {
  sam: {
    id: "usr-sam",
    name: "Sam",
    handle: "sam",
    role: "reviewer",
    email: "sam@example.com",
    isAllowlisted: true,
    isDemo: true
  },
  nikhil: {
    id: "usr-nikhil",
    name: "Nikhil",
    handle: "nikhil-0420",
    role: "author",
    email: "nikhil@example.com",
    isAllowlisted: true,
    isDemo: true
  },
  nehaa: {
    id: "usr-nehaa",
    name: "Nehaa",
    handle: "nehaa",
    role: "auditor",
    email: "nehaa@example.com",
    isAllowlisted: true,
    isDemo: true
  },
  guest: {
    id: "usr-guest",
    name: "Guest Auditor",
    handle: "unauthorized_guest",
    role: "auditor",
    email: "guest@external.org",
    isAllowlisted: false, // demonstrates 403 authorization rejection
    isDemo: true
  }
};

const SESSION_KEY = "citeguard_auth_user";

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  // Dispatch custom event for reactive UI updates across tabs/components
  window.dispatchEvent(new Event("citeguard_auth_change"));
}

export function isGithubConfigured() {
  return Boolean(import.meta.env.VITE_GITHUB_CLIENT_ID);
}

export function isMagicLinkConfigured() {
  return Boolean(import.meta.env.VITE_EMAIL_SERVICE_CONFIGURED === "true");
}

export function generateOAuthState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem("citeguard_oauth_state", state);
  return state;
}

export function validateOAuthState(state) {
  const saved = sessionStorage.getItem("citeguard_oauth_state");
  sessionStorage.removeItem("citeguard_oauth_state");
  return Boolean(saved && saved === state);
}