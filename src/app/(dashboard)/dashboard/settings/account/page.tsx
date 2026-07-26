import { UserProfile } from "@clerk/nextjs"

export const metadata = { title: "Account Settings" }

export default function AccountSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-fg font-semibold text-2xl mb-6">Account</h1>
      <UserProfile
        appearance={{
          // Literal hex, not var(--ds-*): nested modals this opens (Update
          // profile, Add email, etc.) are portaled to document.body, outside
          // our [data-theme]-scoped wrapper, so CSS custom properties would
          // fail to resolve there. See the ClerkProvider appearance in
          // src/app/layout.tsx for the full explanation — this just repeats
          // the same light palette explicitly for this instance.
          variables: {
            colorPrimary: "#0071E3",
            colorBackground: "#ffffff",
            colorInputBackground: "#f5f5f7",
            colorInputText: "#1d1d1f",
            colorText: "#1d1d1f",
            colorTextSecondary: "#6e6e73",
            borderRadius: "12px",
          },
          elements: { card: "shadow-none border border-line/[0.08]" },
        }}
      />
    </div>
  )
}
