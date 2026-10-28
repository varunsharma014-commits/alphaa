// Renders the weekly briefing email to HTML. Sample data by default;
// --user <id> builds it from that account's real briefing (reads the DB, sends nothing).
// --recap renders the monthly recap email (sample data) instead.
import { writeFileSync } from "fs"
import React from "react"
import { render } from "@react-email/render"
import BriefingEmail from "@/emails/BriefingEmail"
import MonthlyRecapEmail from "@/emails/MonthlyRecapEmail"
import { briefingEmailProps } from "@/lib/agent/briefing-email"

// tsx compiles JSX with the classic runtime; the email components expect a global React.
;(globalThis as { React?: typeof React }).React = React

async function main() {
  if (process.argv.includes("--recap")) {
    const out = process.argv[process.argv.indexOf("--out") + 1] || "recap-email.html"
    writeFileSync(out, await render(React.createElement(MonthlyRecapEmail, MonthlyRecapEmail.PreviewProps)))
    console.log(`wrote ${out}`)
    process.exit(0)
  }
  const i = process.argv.indexOf("--user")
  const props = i > 0 ? await briefingEmailProps(process.argv[i + 1], null) : BriefingEmail.PreviewProps
  if (!props) throw new Error("No such user")
  const out = process.argv[process.argv.indexOf("--out") + 1] || "briefing-email.html"
  writeFileSync(out, await render(React.createElement(BriefingEmail, props)))
  console.log(`wrote ${out}`)
  process.exit(0)
}
main()
