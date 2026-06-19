const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/alyssazz/alyssazz/main/usage/sessions.json"

const BG     = new Color("#0f0f1a")
const GREEN  = new Color("#39ff14")
const YELLOW = new Color("#ffe600")
const ORANGE = new Color("#ff8c00")
const RED    = new Color("#ff3333")
const WHITE  = new Color("#f0f0f0")
const DIM    = new Color("#444466")
const DIMBAR = new Color("#1e1e2e")

async function fetchData() {
  const req = new Request(GITHUB_RAW_URL)
  req.timeoutInterval = 10
  try { return await req.loadJSON() } catch (e) { return null }
}

function fmtMins(m) {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r === 0 ? `${h}h` : `${h}h${r}m`
}

function barColor(pct) {
  if (pct >= 0.8) return GREEN
  if (pct >= 0.5) return YELLOW
  if (pct >= 0.3) return ORANGE
  return RED
}

function pixelBar(pct, total) {
  const filled = Math.max(1, Math.round(pct * total))
  return "█".repeat(filled) + "░".repeat(total - filled)
}

async function buildWidget(data) {
  const w = new ListWidget()
  w.backgroundColor = BG
  w.setPadding(14, 16, 14, 16)

  if (!data) {
    const t = w.addText("NO DATA")
    t.textColor = RED
    t.font = new Font("Menlo", 14)
    return w
  }

  const s = data.stats
  const goal = s.monthly_goal_minutes || 600
  const weekGoal = Math.round(goal / 4)
  const todayGoal = Math.round(goal / 30)
  const weekPct  = Math.min(s.week_minutes / weekGoal, 1)
  const todayPct = Math.min(s.today_minutes / todayGoal, 1)
  const refreshStr = new Date().toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})

  // ── ROW 1: icon + title + refresh time ──
  const r1 = w.addStack()
  r1.layoutHorizontally()
  r1.centerAlignContent()

  const ico = r1.addText("👾")
  ico.font = Font.systemFont(20)

  r1.addSpacer(8)

  const titleTxt = r1.addText("CLAUDE.EXE")
  titleTxt.font = new Font("Menlo", 13)
  titleTxt.textColor = GREEN

  r1.addSpacer()

  const refreshTxt = r1.addText("⟳ " + refreshStr)
  refreshTxt.font = new Font("Menlo", 11)
  refreshTxt.textColor = DIM

  w.addSpacer(10)

  // ── ROW 2: TODAY label + big number ──
  const r2 = w.addStack()
  r2.layoutHorizontally()
  r2.bottomAlignContent()

  const todayLbl = r2.addText("TODAY  ")
  todayLbl.font = new Font("Menlo", 11)
  todayLbl.textColor = DIM

  const todayVal = r2.addText(fmtMins(s.today_minutes))
  todayVal.font = new Font("Menlo", 28)
  todayVal.textColor = barColor(todayPct)

  r2.addSpacer()

  const todayGoalTxt = r2.addText("/ " + fmtMins(todayGoal))
  todayGoalTxt.font = new Font("Menlo", 11)
  todayGoalTxt.textColor = DIM

  w.addSpacer(5)

  // ── ROW 3: TODAY bar ──
  const todayBarTxt = w.addText(pixelBar(todayPct, 28))
  todayBarTxt.font = new Font("Menlo", 11)
  todayBarTxt.textColor = barColor(todayPct)

  w.addSpacer(10)

  // ── DIVIDER ──
  const div = w.addText("┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄")
  div.font = new Font("Menlo", 7)
  div.textColor = DIM

  w.addSpacer(8)

  // ── ROW 4: WEEK label + numbers ──
  const r4 = w.addStack()
  r4.layoutHorizontally()
  r4.centerAlignContent()

  const weekLbl = r4.addText("WEEK  ")
  weekLbl.font = new Font("Menlo", 11)
  weekLbl.textColor = DIM

  const weekVal = r4.addText(fmtMins(s.week_minutes))
  weekVal.font = new Font("Menlo", 16)
  weekVal.textColor = barColor(weekPct)

  r4.addSpacer()

  const weekGoalTxt = r4.addText(Math.round(weekPct * 100) + "%  / " + fmtMins(weekGoal))
  weekGoalTxt.font = new Font("Menlo", 11)
  weekGoalTxt.textColor = DIM

  w.addSpacer(4)

  // ── ROW 5: WEEK bar ──
  const weekBarTxt = w.addText(pixelBar(weekPct, 28))
  weekBarTxt.font = new Font("Menlo", 11)
  weekBarTxt.textColor = barColor(weekPct)

  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000)
  return w
}

const data = await fetchData()
const widget = await buildWidget(data)
if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  widget.presentMedium()
}
Script.complete()
