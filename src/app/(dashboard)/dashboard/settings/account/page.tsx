import { UserProfile } from "@clerk/nextjs"

export const metadata = { title: "Account Settings" }

export default function AccountSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-white font-semibold text-2xl mb-6">Account</h1>
      <UserProfile
        appearance={{
          variables: {
            colorPrimary: "#FF6B1A",
            colorBackground: "#13100C",
            colorInputBackground: "#1F1812",
            colorText: "#ffffff",
            colorTextSecondary: "#A8A29E",
            borderRadius: "12px",
          },
          elements: { card: "shadow-none border border-white/[0.08] bg-bg-secondary" },
        }}
      />
    </div>
  )
}
