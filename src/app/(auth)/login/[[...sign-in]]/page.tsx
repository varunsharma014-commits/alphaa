import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  return (
    <SignIn
      appearance={{
        variables: {
          colorPrimary: "#FF6B1A",
          colorBackground: "#13100C",
          colorInputBackground: "#1F1812",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#A8A29E",
          borderRadius: "12px",
          fontFamily: "Inter Tight, sans-serif",
        },
        elements: {
          card: "shadow-none border border-white/[0.08]",
          headerTitle: "text-white font-semibold",
          headerSubtitle: "text-muted",
          formButtonPrimary: "bg-brand-orange hover:bg-brand-orange-light rounded-full shadow-glow",
          footerActionLink: "text-brand-orange hover:text-brand-orange-light",
          formFieldInput: "border-white/10",
        },
      }}
    />
  )
}
