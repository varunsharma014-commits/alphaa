import { pageTitle } from "@/lib/page-title"
import { WebsiteView } from "@/components/workspace/settings/WebsiteView"

export const metadata = { title: pageTitle("Your website") }

export default function WebsiteConnectionPage() {
  return <WebsiteView />
}
