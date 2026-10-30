import { LocalHome, localMeta } from "@/components/marketing/local/LocalHome"
import { MARKETS } from "@/content/locales"

export const metadata = localMeta(MARKETS.it.copy)

export default function Page() {
  return <LocalHome m={MARKETS.it} />
}
