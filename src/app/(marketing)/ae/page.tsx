import { LocalHome, localMeta } from "@/components/marketing/local/LocalHome"
import { MARKETS } from "@/content/locales"

export const metadata = localMeta(MARKETS.ae.copy)

export default function Page() {
  return <LocalHome m={MARKETS.ae} />
}
