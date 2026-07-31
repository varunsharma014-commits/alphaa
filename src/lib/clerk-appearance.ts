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
  },
}
