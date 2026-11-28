import { UserProfile } from "@clerk/nextjs"
import { PageHeader } from "@/components/workspace/ui"
import { SettingsTabs } from "@/components/workspace/settings/SettingsTabs"
import { pageTitle } from "@/lib/page-title"

export const metadata = { title: pageTitle("Your account") }

// Clerk's profile, fitted to the settings column in the workspace look: full width, soft card,
// blue actions, no "Secured by" footer. Literal hex, not CSS variables: the modals this opens
// (Update profile, Add email…) are portaled to document.body, outside `.ax`, so variables would
// not resolve there (see the ClerkProvider appearance in src/app/layout.tsx).
const appearance = {
  variables: {
    colorPrimary: "#0071e3",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1d1d1f",
    colorText: "#1d1d1f",
    colorTextSecondary: "#6e6e73",
    colorNeutral: "#6e6e73",
    borderRadius: "12px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", maxWidth: "100%", boxShadow: "0 2px 12px rgba(0,0,0,.035), 0 1px 2px rgba(0,0,0,.025)", border: "1px solid rgba(0,0,0,.065)", borderRadius: "22px" },
    navbar: { background: "#fafafc", borderRight: "1px solid rgba(0,0,0,.065)" },
    scrollBox: { borderRadius: "0 22px 22px 0" },
    footer: { display: "none" },
    formButtonPrimary: { borderRadius: "980px", boxShadow: "none", textTransform: "none" as const },
    formFieldInput: { borderRadius: "12px", borderColor: "#d2d2d7" },
  },
}

export default function AccountSettingsPage() {
  return (
    <>
      <PageHeader title="Your account" sub="Your name, sign-in emails, password and the devices you’re signed in on." tabs={<SettingsTabs />} />
      <div className="xs-stack xs-clerk">
        <UserProfile appearance={appearance} />
      </div>
    </>
  )
}
