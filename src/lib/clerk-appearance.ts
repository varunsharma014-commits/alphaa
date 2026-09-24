// Literal hex, not var(--ds-*): Clerk portals its modals (UserButton's "Manage
// account", "Update profile", etc.) directly to document.body, outside our
// [data-theme]-scoped wrappers, so CSS custom properties fail to resolve there
// and Clerk falls back to its own theme (which follows the OS colour scheme).
// Literal light-Apple values keep every Clerk surface consistent wherever it
// ends up in the DOM.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0071E3",
    colorBackground: "#ffffff",
    colorInputBackground: "#f5f5f7",
    colorInputText: "#1d1d1f",
    colorText: "#1d1d1f",
    colorTextSecondary: "#6e6e73",
    colorNeutral: "#6e6e73",
    borderRadius: "12px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: "16.5px",
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 600 },
  },
  // Apple ID sign-in feel: flat white card, hairline, blue pill button, no shadows.
  elements: {
    card: { boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "18px" },
    headerTitle: { fontSize: "26.4px", fontWeight: 600, letterSpacing: "-0.015em", color: "#1d1d1f" },
    headerSubtitle: { color: "#6e6e73" },
    formButtonPrimary: { backgroundColor: "#0071e3", borderRadius: "980px", boxShadow: "none", fontWeight: 400, fontSize: "16.5px", textTransform: "none" },
    socialButtonsBlockButton: { borderRadius: "12px", borderColor: "#d2d2d7" },
    formFieldInput: { borderRadius: "12px", borderColor: "#d2d2d7" },
    footerActionLink: { color: "#0066cc" },
  },
}
