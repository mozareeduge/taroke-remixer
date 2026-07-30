import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { dismissFeedback } from "../store/feedbackSlice.js";

const AUTO_DISMISS_MS = 5000;

/**
 * Shared aria-live receipt region (06_SELECTION_INSPECTOR_AND_ACTION_CONTRACTS.md
 * "Action states", A11Y-02). Every action's success/error is announced here so
 * screen-reader and sighted users get the same feedback, instead of a control
 * that returns silently.
 */
export function LiveRegion() {
  const dispatch = useAppDispatch();
  const message = useAppSelector((s) => s.feedback?.current ?? null);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => dispatch(dismissFeedback()), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [message, dispatch]);

  return (
    <div
      className={["tr-live-region", message ? `tr-live-region--${message.tone}` : ""].filter(Boolean).join(" ")}
      role={message?.tone === "error" ? "alert" : "status"}
      aria-live={message?.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {message?.text ?? ""}
    </div>
  );
}
