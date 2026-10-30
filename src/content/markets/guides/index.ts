import type { MarketGuides } from "../guides-types"
import type { LocaleKey } from "@/content/locales"
import { guides as uk } from "./uk"
import { guides as de } from "./de"
import { guides as fr } from "./fr"
import { guides as it } from "./it"
import { guides as ae } from "./ae"
import { guides as ar } from "./ar"

export const GUIDES: Record<LocaleKey, MarketGuides> = { uk, de, fr, it, ae, ar }
