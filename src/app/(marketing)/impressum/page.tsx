import type { Metadata } from "next"
import Link from "next/link"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/article.css"

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und Anbieterkennzeichnung von Alphaa, betrieben von 9629033 Canada INC. / Legal notice for Alphaa.",
  alternates: { canonical: "/impressum" },
}

// Anbieterkennzeichnung nach § 5 DDG (Germany) and § 18 Abs. 2 MStV.
export default function ImpressumPage() {
  return (
    <V3Page>
      <Frame top>
      <Section flush>
      <div lang="de" className="rd3 lgl3-prose">
        <h1 className="v3-h1 v3-h1--md" style={{ marginBottom: 8 }}>Impressum</h1>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          9629033 Canada INC. (handelnd als „Alphaa“)
          <br />1000 Innovation Drive, Suite 500
          <br />Kanata, ON K2K 3E7
          <br />Kanada
        </p>

        <h2>Vertreten durch</h2>
        <p>Varun Sharma, Director</p>

        <h2>Kontakt</h2>
        <p>E-Mail: <a href="mailto:hi@alphaa.app">hi@alphaa.app</a></p>

        <h2>Registereintrag</h2>
        <p>Kanadische Bundeskapitalgesellschaft, eingetragen bei Corporations Canada (Innovation, Science and Economic Development Canada), Unternehmensnummer 962903-3.</p>

        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>Varun Sharma, Anschrift wie oben.</p>

        <h2>Verbraucherstreitbeilegung</h2>
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

        <hr />

        <h2 lang="en" style={{ marginTop: 0 }}>Legal notice (English)</h2>
        <p lang="en">
          Alphaa is operated by 9629033 Canada INC, 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada, a federal
          corporation registered with Corporations Canada (corporation number 962903-3), represented by Varun Sharma, Director.
          Contact: hi@alphaa.app. See also our <Link href="/privacy">privacy policy</Link> and{" "}
          <Link href="/terms">terms</Link>.
        </p>
      </div>
      </Section>
      </Frame>
    </V3Page>
  )
}
