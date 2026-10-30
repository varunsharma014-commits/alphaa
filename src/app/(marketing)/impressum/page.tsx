import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und Anbieterkennzeichnung von Alphaa, betrieben von 9629033 Canada Inc. / Legal notice for Alphaa.",
  alternates: { canonical: "/impressum" },
}

// Anbieterkennzeichnung nach § 5 DDG (Germany) and § 18 Abs. 2 MStV.
export default function ImpressumPage() {
  return (
    <div lang="de" className="pt-28 pb-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-fg">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] mb-8">Impressum</h1>

        <h2 className="text-lg font-semibold mt-8 mb-2">Angaben gemäß § 5 DDG</h2>
        <p className="leading-relaxed">
          9629033 Canada Inc. (handelnd als „Alphaa“)
          <br />500-1000 Innovation Drive
          <br />Ottawa (Kanata), ON K2K 3E7
          <br />Kanada
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Vertreten durch</h2>
        <p>Varun Sharma, Director</p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Kontakt</h2>
        <p>E-Mail: <a className="underline" href="mailto:hi@alphaa.app">hi@alphaa.app</a></p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Registereintrag</h2>
        <p>Kanadische Bundeskapitalgesellschaft, eingetragen bei Corporations Canada (Innovation, Science and Economic Development Canada), Unternehmensnummer 962903-3.</p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>Varun Sharma, Anschrift wie oben.</p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Verbraucherstreitbeilegung</h2>
        <p className="leading-relaxed">Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

        <hr className="my-10 border-line/[0.12]" />

        <h2 lang="en" className="text-lg font-semibold mb-2">Legal notice (English)</h2>
        <p lang="en" className="leading-relaxed">
          Alphaa is operated by 9629033 Canada Inc., 500-1000 Innovation Drive, Ottawa (Kanata), ON K2K 3E7, Canada, a federal
          corporation registered with Corporations Canada (corporation number 962903-3), represented by Varun Sharma, Director.
          Contact: hi@alphaa.app. See also our <Link className="underline" href="/privacy">privacy policy</Link> and{" "}
          <Link className="underline" href="/terms">terms</Link>.
        </p>
      </div>
    </div>
  )
}
