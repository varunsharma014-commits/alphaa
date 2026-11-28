import { redirect } from "next/navigation"

// Old duplicate of /dashboard/sandbox.
export default function SandboxDuplicate() {
  redirect("/dashboard/sandbox")
}
