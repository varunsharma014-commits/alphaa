import { UserProfile } from "@clerk/nextjs"

export const metadata = { title: "Account Settings" }

export default function AccountSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-fg font-semibold text-2xl mb-6">Account</h1>
      <UserProfile
        appearance={{
          variables: {
            colorPrimary: "var(--ds-accent)",
            colorBackground: "var(--ds-surface)",
            colorInputBackground: "var(--ds-surface-2)",
            colorText: "var(--ds-text)",
            colorTextSecondary: "var(--ds-text-mute)",
            borderRadius: "12px",
          },
          elements: { card: "shadow-none border border-line/[0.08] bg-bg-secondary" },
        }}
      />
    </div>
  )
}
