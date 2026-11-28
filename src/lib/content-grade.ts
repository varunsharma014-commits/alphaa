// Content graders for website/blog drafts: pure code, no AI, client-safe (the editor runs them on
// every keystroke; the publish flow shows the same card). They inform, they never block.
//
//   Direct answers: every question-style H2/H3 should open with a standalone 40-60 word answer
//                   (the paragraph AI assistants and Google lift as the answer).
//   Readability:    Flesch-Kincaid grade, average sentence length, long sentences (>25 words),
//                   passive voice estimate, paragraph length. Targets suit small-business blogs
//                   (grade 6-8, ~15-20 words a sentence, short paragraphs).

export type GradeLevel = "good" | "ok" | "fix"

export type AnswerCheck = {
  heading: string
  /** Words in the first paragraph under the heading (0 = none). */
  words: number
  /** leans = right length, but opens with "It"/"This"/"Yes"… so it doesn't read right quoted alone. */
  status: "good" | "short" | "long" | "missing" | "leans"
  /** A one-line, specific fix (null when good). */
  fix: string | null
}

export type Readability = {
  words: number
  sentences: number
  grade: number | null
  avgSentence: number | null
  /** Sentences over 25 words: their opening words + length. */
  longSentences: { start: string; words: number }[]
  /** Share of sentences that look passive (0-1), with a few examples. */
  passive: { share: number; count: number; examples: string[] }
  /** Paragraphs over 80 words or 4 sentences. */
  longParagraphs: { start: string; words: number; sentences: number }[]
}

export type Fix = { level: "fix" | "ok"; text: string }

export type ContentGrade = {
  /** 0-100, rounded. */
  score: number
  level: GradeLevel
  answers: { checks: AnswerCheck[]; passed: number; total: number; level: GradeLevel }
  readability: Readability & { level: GradeLevel; gradeLevel: GradeLevel; sentenceLevel: GradeLevel; passiveLevel: GradeLevel; paragraphLevel: GradeLevel }
  /** Specific fixes, most important first (max 8). */
  fixes: Fix[]
}

export const ANSWER_MIN = 40
export const ANSWER_MAX = 60
export const LONG_SENTENCE = 25
export const LONG_PARAGRAPH_WORDS = 80
export const LONG_PARAGRAPH_SENTENCES = 4

const QUESTION_START = /^(how|what|why|when|where|who|can|does|is)\b/i

/** A heading phrased as a question: ends in "?" or starts with how/what/why/when/where/who/can/does/is. */
export function isQuestionHeading(text: string): boolean {
  const t = text.replace(/[*_`]/g, "").trim()
  return /\?\s*$/.test(t) || QUESTION_START.test(t)
}

type Block = { kind: "h"; level: number; text: string } | { kind: "p"; text: string } | { kind: "li"; text: string }

/** Markdown → headings, paragraphs (consecutive lines joined) and list items. */
export function blocksOf(md: string): Block[] {
  const out: Block[] = []
  let para: string[] = []
  const flush = () => { if (para.length) { out.push({ kind: "p", text: para.join(" ") }); para = [] } }
  for (const raw of md.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim()
    if (!line || /^-{3,}$/.test(line)) { flush(); continue }
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*$/)
    if (h) { flush(); out.push({ kind: "h", level: h[1].length, text: h[2] }); continue }
    const li = line.match(/^(?:[-*+]|\d+[.)])\s+(.+)$/)
    if (li) { flush(); out.push({ kind: "li", text: li[1] }); continue }
    if (/^>\s?/.test(line)) { para.push(line.replace(/^>\s?/, "")); continue }
    para.push(line)
  }
  flush()
  return out
}

/** Inline markdown → plain text: links keep their text, emphasis/code marks go. */
export function plain(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function wordsOf(s: string): string[] {
  return plain(s).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
}

/** Sentences in a block of plain text (abbreviations like "e.g." and "Dr." don't split). */
export function sentencesOf(s: string): string[] {
  const t = plain(s)
    .replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|St|Jr|Sr|No|approx|incl)\./gi, (m) => m.replace(/\./g, "․"))
    .replace(/(\d)\.(\d)/g, "$1․$2")
  return t
    .split(/(?<=[.!?…])["')\]]*\s+(?=["'(\[]?[\p{Lu}\p{N}])/u)
    .map((x) => x.replace(/․/g, ".").trim())
    .filter((x) => wordsOf(x).length > 0)
}

/** Syllables in one English word (vowel groups, silent e, -le, -ed). Good enough for FK. */
export function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!w) return 0
  if (w.length <= 3) return 1
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, "").replace(/^y/, "")
  const groups = w.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

// "is/was/were/been… (+ adverb) + past participle". Irregulars that small-business copy uses most.
const BE = "(?:am|is|are|was|were|be|been|being|isn['’]t|aren['’]t|wasn['’]t|weren['’]t)"
const IRREGULAR = "(?:done|made|given|taken|seen|known|shown|built|paid|sent|told|found|kept|held|left|led|brought|bought|caught|taught|thought|written|driven|chosen|spoken|broken|stolen|frozen|hidden|forgotten|gotten|begun|run|cut|put|set|hit|hurt|read|won|worn|torn|sold|drawn|grown|thrown|eaten|fallen|felt|heard|meant|met|lost|spent|understood|undertaken)"
const PASSIVE = new RegExp(`\\b${BE}\\s+(?:\\w+ly\\s+)?(?:\\w{3,}ed|${IRREGULAR})\\b`, "i")
// "is based", "are located", "is closed": adjectives in practice; don't count them.
const NOT_PASSIVE = /\b(?:is|are|was|were)\s+(?:based|located|licensed|insured|interested|tired|excited|closed|open|used to|supposed|married|qualified|certified|dedicated|committed|experienced|skilled|trained|bonded|required|needed|allowed)\b/i

export function isPassive(sentence: string): boolean {
  return PASSIVE.test(sentence) && !NOT_PASSIVE.test(sentence)
}

const startOf = (s: string, n = 8) => {
  const w = plain(s).split(/\s+/)
  return w.slice(0, n).join(" ") + (w.length > n ? "…" : "")
}

/** Direct-answer check for every question-style H2/H3. */
export function gradeAnswers(md: string): AnswerCheck[] {
  const blocks = blocksOf(md)
  const out: AnswerCheck[] = []
  blocks.forEach((b, i) => {
    if (b.kind !== "h" || (b.level !== 2 && b.level !== 3) || !isQuestionHeading(b.text)) return
    const heading = plain(b.text)
    const next = blocks[i + 1]
    if (!next || next.kind === "h") {
      out.push({ heading, words: 0, status: "missing", fix: `“${heading}” has no answer under it. Add a 40-60 word paragraph that answers it directly.` })
      return
    }
    if (next.kind === "li") {
      out.push({ heading, words: 0, status: "missing", fix: `“${heading}” starts with a list. Put a 40-60 word answer paragraph first, then the list.` })
      return
    }
    const n = wordsOf(next.text).length
    const first = (wordsOf(next.text)[0] ?? "").toLowerCase().replace(/[^a-z]/g, "")
    const leansOnHeading = ["it", "this", "that", "they", "these", "those", "yes", "no"].includes(first)
    if (n < ANSWER_MIN) {
      out.push({ heading, words: n, status: "short", fix: `“${heading}”: the answer is ${n} words. Add ${ANSWER_MIN - n}+ words of specifics so it stands on its own (aim ${ANSWER_MIN}-${ANSWER_MAX}).` })
    } else if (n > ANSWER_MAX) {
      out.push({ heading, words: n, status: "long", fix: `“${heading}”: the first paragraph is ${n} words. Answer in the first ${ANSWER_MAX} words, then start a new paragraph for the detail.` })
    } else if (leansOnHeading) {
      out.push({ heading, words: n, status: "leans", fix: `“${heading}”: the answer opens with “${wordsOf(next.text)[0]}”. Name the subject in the first sentence so it reads right when quoted alone.` })
    } else {
      out.push({ heading, words: n, status: "good", fix: null })
    }
  })
  return out
}

/** Readability over the body (paragraphs + list items; headings are left out). */
export function readability(md: string): Readability {
  const blocks = blocksOf(md).filter((b) => b.kind !== "h")
  const sentences: string[] = []
  const longParagraphs: Readability["longParagraphs"] = []
  for (const b of blocks) {
    const ss = b.kind === "li" ? [plain(b.text)].filter((x) => wordsOf(x).length) : sentencesOf(b.text)
    sentences.push(...ss)
    if (b.kind === "p") {
      const w = wordsOf(b.text).length
      if (w > LONG_PARAGRAPH_WORDS || ss.length > LONG_PARAGRAPH_SENTENCES) longParagraphs.push({ start: startOf(b.text), words: w, sentences: ss.length })
    }
  }
  const words = sentences.flatMap((s) => wordsOf(s))
  const syl = words.reduce((n, w) => n + syllables(w), 0)
  const grade = words.length >= 30 && sentences.length ? Math.max(0, 0.39 * (words.length / sentences.length) + 11.8 * (syl / words.length) - 15.59) : null
  const longSentences = sentences
    .map((s) => ({ s, n: wordsOf(s).length }))
    .filter((x) => x.n > LONG_SENTENCE)
    .map((x) => ({ start: startOf(x.s), words: x.n }))
  const passiveSentences = sentences.filter(isPassive)
  return {
    words: words.length,
    sentences: sentences.length,
    grade: grade == null ? null : Math.round(grade * 10) / 10,
    avgSentence: sentences.length ? Math.round((words.length / sentences.length) * 10) / 10 : null,
    longSentences,
    passive: { share: sentences.length ? passiveSentences.length / sentences.length : 0, count: passiveSentences.length, examples: passiveSentences.slice(0, 3).map((s) => startOf(s, 10)) },
    longParagraphs,
  }
}

const lvl = (good: boolean, ok: boolean): GradeLevel => (good ? "good" : ok ? "ok" : "fix")
const pts = (l: GradeLevel) => (l === "good" ? 1 : l === "ok" ? 0.6 : 0.2)

/** The score card: both graders, one score, and the specific fixes. */
export function gradeContent(md: string): ContentGrade {
  const checks = gradeAnswers(md)
  const passed = checks.filter((c) => c.status === "good").length
  const ansShare = checks.length ? passed / checks.length : null
  const answersLevel: GradeLevel = ansShare == null ? "ok" : lvl(ansShare >= 0.8, ansShare >= 0.5)

  const r = readability(md)
  const gradeLevel: GradeLevel = r.grade == null ? "ok" : lvl(r.grade <= 8, r.grade <= 10)
  const sentenceLevel: GradeLevel = r.avgSentence == null ? "ok" : lvl(r.avgSentence <= 20 && r.longSentences.length <= 2, r.avgSentence <= 24)
  const passiveLevel: GradeLevel = lvl(r.passive.share <= 0.1, r.passive.share <= 0.2)
  const paragraphLevel: GradeLevel = lvl(r.longParagraphs.length === 0, r.longParagraphs.length <= 2)
  const readLevels = [gradeLevel, sentenceLevel, passiveLevel, paragraphLevel]
  const readScore = readLevels.reduce((n, l) => n + pts(l), 0) / readLevels.length
  const readLevel: GradeLevel = readScore >= 0.9 ? "good" : readScore >= 0.6 ? "ok" : "fix"

  // Answers weigh 40% when there are question headings, else readability is the whole score.
  const ansScore = ansShare == null ? null : checks.reduce((n, c) => n + (c.status === "good" ? 1 : c.status === "missing" ? 0 : c.status === "leans" ? 0.6 : 0.3), 0) / checks.length
  const raw = r.words < 30 && !checks.length ? 0 : ansScore == null ? readScore : 0.4 * ansScore + 0.6 * readScore
  const score = Math.round(raw * 100)

  const fixes: Fix[] = []
  for (const c of checks.filter((c) => c.status === "missing")) fixes.push({ level: "fix", text: c.fix! })
  // At most 4 answer fixes, so readability advice still shows; the rest are in the per-question list.
  const answerFixes = checks.filter((c) => c.status === "short" || c.status === "long" || c.status === "leans")
  for (const c of answerFixes.slice(0, 4)) fixes.push({ level: "ok", text: c.fix! })
  if (answerFixes.length > 4) fixes.push({ level: "ok", text: `${answerFixes.length - 4} more answers need the same: ${ANSWER_MIN}-${ANSWER_MAX} words that stand on their own.` })
  if (r.grade != null && gradeLevel !== "good") fixes.push({ level: gradeLevel === "fix" ? "fix" : "ok", text: `Reads at grade ${r.grade}. Aim for 8 or lower: shorter sentences and everyday words (“use” not “utilize”).` })
  for (const s of r.longSentences.slice(0, 3)) fixes.push({ level: "ok", text: `Split this ${s.words}-word sentence: “${s.start}”` })
  if (r.longSentences.length > 3) fixes.push({ level: "ok", text: `${r.longSentences.length - 3} more sentences run over ${LONG_SENTENCE} words.` })
  if (passiveLevel !== "good") fixes.push({ level: passiveLevel === "fix" ? "fix" : "ok", text: `${r.passive.count} sentences read passive (${Math.round(r.passive.share * 100)}%). Say who does it: “We fix it the same day”, not “It is fixed”. E.g. “${r.passive.examples[0] ?? ""}”` })
  for (const p of r.longParagraphs.slice(0, 2)) fixes.push({ level: "ok", text: `Break up the paragraph starting “${p.start}” (${p.words} words, ${p.sentences} sentences). Keep paragraphs to 2-4 sentences.` })
  if (!checks.length && r.words >= 150) fixes.push({ level: "ok", text: "No headings are phrased as customer questions. Turn a few into the questions people ask (“How much does … cost?”) and answer each one first." })

  const level: GradeLevel = score >= 80 ? "good" : score >= 60 ? "ok" : "fix"
  return {
    score,
    level,
    answers: { checks, passed, total: checks.length, level: answersLevel },
    readability: { ...r, level: readLevel, gradeLevel, sentenceLevel, passiveLevel, paragraphLevel },
    fixes: fixes.sort((a, b) => (a.level === b.level ? 0 : a.level === "fix" ? -1 : 1)).slice(0, 8),
  }
}
