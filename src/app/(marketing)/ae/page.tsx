import { LocalHome, localMeta } from "@/components/marketing/local/LocalHome"
import { LOCALES } from "@/content/locales"

export const metadata = localMeta(LOCALES.ae)

export default function Page() {
  return <LocalHome l={LOCALES.ae} />
}
