// ── CONFIG (fill in your sessionKey in Scriptable, never share) ──
const SESSION_KEY = "YOUR_SESSION_KEY_HERE"
const ORG_UUID    = "0d81da43-03c2-4a3d-9de9-f4d3305fbdaa"
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/alyssazz/alyssazz/main/usage/sessions.json"

const BG    = new Color("#0a0a0a")
const AMBER = new Color("#ffb347")
const GOLD  = new Color("#ffe066")
const DIM   = new Color("#444444")
const WHITE = new Color("#f5f5f5")
const GREEN = new Color("#7fff7f")
const PINK  = new Color("#ff6eb4")
const CYAN  = new Color("#7fdfff")
const RED   = new Color("#ff5f5f")

async function fetchSessions() {
  const req = new Request(GITHUB_RAW_URL)
  req.timeoutInterval = 10
  try { return await req.loadJSON() } catch (e) { return null }
}

async function fetchClaudeUsage() {
  const url = `https://claude.ai/api/organizations/${ORG_UUID}/usage`
  const req = new Request(url)
  req.timeoutInterval = 10
  req.headers = {
    "Cookie": `sessionKey=${SESSION_KEY}`,
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json"
  }
  try { return await req.loadJSON() } catch (e) { return null }
}

function fmtMins(m) {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r === 0 ? `${h}h` : `${h}h${r}m`
}

function bar(pct, total) {
  const filled = Math.max(0, Math.min(total, Math.round(pct * total)))
  return "█".repeat(filled) + "░".repeat(total - filled)
}

function hearts(pct, total) {
  const filled = Math.max(0, Math.min(total, Math.round(pct * total)))
  return "♥".repeat(filled) + "♡".repeat(total - filled)
}

function limitColor(pct) {
  if (pct >= 0.9) return RED
  if (pct >= 0.6) return GOLD
  return GREEN
}

async function buildWidget(sessions, usage) {
  const w = new ListWidget()
  w.backgroundColor = BG
  w.setPadding(12, 16, 12, 16)

  const s = sessions?.stats
  const goal = s?.monthly_goal_minutes || 600
  const todayGoal  = Math.round(goal / 30)
  const todayPct   = s ? Math.min(s.today_minutes / todayGoal, 1) : 0
  const weekGoal   = Math.round(goal / 4)
  const weekPct    = s ? Math.min(s.week_minutes / weekGoal, 1) : 0

  const fiveHourPct  = usage ? (usage.five_hour?.utilization  ?? 0) / 100 : null
  const sevenDayPct  = usage ? (usage.seven_day?.utilization  ?? 0) / 100 : null

  const refreshStr = new Date().toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})

  // ── Row 1: sprite + name + refresh ──
  const r1 = w.addStack()
  r1.layoutHorizontally()
  r1.centerAlignContent()

  const sprite = r1.addStack()
  sprite.layoutVertically()
  for (const l of [" {-□-} ", "(  oo )", " ╰──╯  "]) {
    const t = sprite.addText(l)
    t.font = new Font("Courier New", 12)
    t.textColor = AMBER
  }

  r1.addSpacer(10)

  const nameCol = r1.addStack()
  nameCol.layoutVertically()

  const nameRow = nameCol.addStack()
  nameRow.layoutHorizontally()
  nameRow.centerAlignContent()
  const nameTxt = nameRow.addText("Claude")
  nameTxt.font = new Font("Courier New", 17)
  nameTxt.textColor = WHITE

  nameCol.addSpacer(4)
  const refTxt = nameCol.addText("⟳ " + refreshStr)
  refTxt.font = new Font("Courier New", 11)
  refTxt.textColor = DIM

  r1.addSpacer()

  w.addSpacer(10)

  // ── Claude.ai limits (most important) ──
  const limHdr = w.addText("── claude.ai limits ──")
  limHdr.font = new Font("Courier New", 10)
  limHdr.textColor = DIM

  w.addSpacer(5)

  // Current session (5h window)
  const r2 = w.addStack()
  r2.layoutHorizontally()
  r2.centerAlignContent()
  const r2lbl = r2.addText("session ")
  r2lbl.font = new Font("Courier New", 12)
  r2lbl.textColor = DIM
  if (fiveHourPct !== null) {
    const r2bar = r2.addText(bar(fiveHourPct, 8))
    r2bar.font = new Font("Courier New", 12)
    r2bar.textColor = limitColor(fiveHourPct)
    r2.addSpacer()
    const r2val = r2.addText(`${Math.round(fiveHourPct * 100)}%`)
    r2val.font = new Font("Courier New", 12)
    r2val.textColor = limitColor(fiveHourPct)
  } else {
    const r2err = r2.addText("── no data ──")
    r2err.font = new Font("Courier New", 12)
    r2err.textColor = DIM
  }

  w.addSpacer(5)

  // 7-day window
  const r3 = w.addStack()
  r3.layoutHorizontally()
  r3.centerAlignContent()
  const r3lbl = r3.addText("7-day   ")
  r3lbl.font = new Font("Courier New", 12)
  r3lbl.textColor = DIM
  if (sevenDayPct !== null) {
    const r3bar = r3.addText(bar(sevenDayPct, 8))
    r3bar.font = new Font("Courier New", 12)
    r3bar.textColor = limitColor(sevenDayPct)
    r3.addSpacer()
    const r3val = r3.addText(`${Math.round(sevenDayPct * 100)}%`)
    r3val.font = new Font("Courier New", 12)
    r3val.textColor = limitColor(sevenDayPct)
  } else {
    const r3err = r3.addText("── no data ──")
    r3err.font = new Font("Courier New", 12)
    r3err.textColor = DIM
  }

  w.addSpacer(8)

  // ── divider ──
  const div = w.addText("───────────────────────")
  div.font = new Font("Courier New", 9)
  div.textColor = DIM

  w.addSpacer(6)

  // ── Coding time (from sessions.json) ──
  const r4 = w.addStack()
  r4.layoutHorizontally()
  r4.centerAlignContent()
  const r4lbl = r4.addText("today  ")
  r4lbl.font = new Font("Courier New", 12)
  r4lbl.textColor = DIM
  const r4hearts = r4.addText(hearts(todayPct, 8))
  r4hearts.font = new Font("Courier New", 12)
  r4hearts.textColor = PINK
  r4.addSpacer()
  const r4val = r4.addText(s ? fmtMins(s.today_minutes) : "─")
  r4val.font = new Font("Courier New", 12)
  r4val.textColor = GOLD

  w.addSpacer(5)

  const r5 = w.addStack()
  r5.layoutHorizontally()
  r5.centerAlignContent()
  const r5lbl = r5.addText("week   ")
  r5lbl.font = new Font("Courier New", 12)
  r5lbl.textColor = DIM
  const r5blocks = r5.addText(bar(weekPct, 8))
  r5blocks.font = new Font("Courier New", 12)
  r5blocks.textColor = CYAN
  r5.addSpacer()
  const r5val = r5.addText(s ? fmtMins(s.week_minutes) : "─")
  r5val.font = new Font("Courier New", 12)
  r5val.textColor = GOLD

  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000)
  return w
}

const [sessions, usage] = await Promise.all([fetchSessions(), fetchClaudeUsage()])
const widget = await buildWidget(sessions, usage)
if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  widget.presentMedium()
}
Script.complete()
