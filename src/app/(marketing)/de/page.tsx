import { LocalHome, localMeta } from "@/components/marketing/local/LocalHome"
import { LOCALES } from "@/content/locales"

export const metadata = localMeta(LOCALES.de)

export default function Page() {
  return <LocalHome l={LOCALES.de} />
}
