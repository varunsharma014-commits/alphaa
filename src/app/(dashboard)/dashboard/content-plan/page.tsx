import { redirect } from "next/navigation"

// "Google listing posts" lived here AND at /dashboard/posts (the same GbpPost rows twice, with a
// status line that said "Paused" and "no action needed" at once). One page now: /dashboard/posts.
// Once the content calendar takes ?channel=google (UI package 2), connected listings can go there.
export default function ContentPlanPage() {
  redirect("/dashboard/posts")
}
