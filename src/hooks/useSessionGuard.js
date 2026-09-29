import { useEffect, useRef } from "react";
import {
  SESSION_EXPIRED_EVENT,
  clearSession,
  getToken,
  tokenExpiresInMs,
} from "../services/TokenService";

const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * While `active`, calls `onExpired(reason)` when:
 * - the API rejects the token (axios dispatches SESSION_EXPIRED_EVENT),
 * - the JWT reaches its expiry time while the page is open,
 * - another tab logs out or signs in as a different user.
 */
export default function useSessionGuard(active, onExpired) {
  const handlerRef = useRef(onExpired);
  handlerRef.current = onExpired;

  useEffect(() => {
    if (!active) return undefined;
    let fired = false;
    const fire = (reason) => {
      if (fired) return;
      fired = true;
      // "switched": another tab stored a new valid token — keep it.
      if (reason !== "switched") clearSession();
      handlerRef.current?.(reason);
    };

    const startToken = getToken();
    if (!startToken) {
      fire("expired");
      return undefined;
    }

    const onEvent = (e) => fire(e?.detail?.reason || "expired");
    const onStorage = (e) => {
      if (e.key !== null && e.key !== "token") return;
      const next = getToken();
      if (next !== startToken) fire(next ? "switched" : "logged_out");
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && getToken() !== startToken) {
        fire(getToken() ? "switched" : "expired");
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onEvent);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);

    let timer = null;
    const left = tokenExpiresInMs(startToken);
    if (left !== null) {
      timer = setTimeout(() => fire("expired"), Math.min(Math.max(0, left), MAX_TIMER_MS));
    }

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onEvent);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearTimeout(timer);
    };
  }, [active]);
}

const NOTICE_KEY = "auth_notice";

function sessionEndMessage(reason) {
  if (reason === "switched") return "";
  if (reason === "logged_out") return "You were logged out in another tab.";
  if (reason === "user_logout") return "You have been logged out.";
  return "Your session has expired. Please sign in again.";
}

/** Hard-reload to the login page so nothing from the previous session stays in memory. */
export function resetToLogin(reason) {
  try {
    const msg = sessionEndMessage(reason);
    if (msg) sessionStorage.setItem(NOTICE_KEY, msg);
  } catch {
    /* ignore */
  }
  window.location.replace("/");
}

/** One-time message for the login page (set by resetToLogin). */
export function takeAuthNotice() {
  try {
    const msg = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    return msg || "";
  } catch {
    return "";
  }
}
