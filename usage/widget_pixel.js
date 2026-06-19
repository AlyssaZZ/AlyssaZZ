// Claude Code Pixel Widget — Scriptable (iOS)
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/alyssazz/alyssazz/main/usage/sessions.json"

// Pixel palette
const BG       = new Color("#0a0a0a")
const GREEN1   = new Color("#00ff41")  // Matrix green
const GREEN2   = new Color("#00c832")
const GREEN3   = new Color("#006418")
const YELLOW   = new Color("#ffe600")
const ORANGE   = new Color("#ff8c00")
const RED      = new Color("#ff2222")
const DIM      = new Color("#3a3a3a")
const WHITE    = new Color("#e8e8e8")
const GRAY     = new Color("#666666")

async function fetchData() {
  const req = new Request(GITHUB_RAW_URL)
  req.timeoutInterval = 10
  try { return await req.loadJSON() } catch (e) { return null }
}

function fmtMins(m) {
  if (m < 60) return `${m}MIN`
  const h = Math.floor(m / 60), r = m % 60
  return r === 0 ? `${h}H` : `${h}H${r}M`
}

function pixelBar(filled, total, char_fill, char_empty) {
  return char_fill.repeat(filled) + char_empty.repeat(total - filled)
}

function barColor(pct) {
  if (pct >= 0.8) return GREEN1
  if (pct >= 0.5) return YELLOW
  if (pct >= 0.3) return ORANGE
  return RED
}

// Pixel characters for the little sprite
const SPRITES = [
  "  ▄███▄  ",
  " █(O O)█ ",
  "  █▀█▀█  ",
  "  ▌   ▐  ",
]

async function buildWidget(data) {
  const w = new ListWidget()
  w.backgroundColor = BG
  w.setPadding(12, 14, 12, 14)

  if (!data) {
    const t = w.addText("ERR: NO DATA")
    t.textColor = RED
    t.font = new Font("Courier New", 12)
    return w
  }

  const s = data.stats
  const goal = s.monthly_goal_minutes || 600
  const weekGoal = Math.round(goal / 4)
  const todayGoal = Math.round(goal / 30)

  const weekPct  = Math.min(s.week_minutes / weekGoal, 1)
  const todayPct = Math.min(s.today_minutes / todayGoal, 1)

  const now = new Date()
  const refreshStr = now.toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})

  // ── TOP: pixel character + TODAY ──
  const topRow = w.addStack()
  topRow.layoutHorizontally()
  topRow.centerAlignContent()

  // Sprite column
  const spriteCol = topRow.addStack()
  spriteCol.layoutVertically()
  spriteCol.centerAlignContent()
  for (const line of SPRITES) {
    const t = spriteCol.addText(line)
    t.font = new Font("Courier New", 9)
    t.textColor = GREEN1
  }

  topRow.addSpacer(10)

  // Today stats column
  const todayCol = topRow.addStack()
  todayCol.layoutVertically()

  const todayLabel = todayCol.addText("▶ TODAY")
  todayLabel.font = new Font("Courier New", 9)
  todayLabel.textColor = GRAY

  todayCol.addSpacer(2)

  const todayVal = todayCol.addText(fmtMins(s.today_minutes))
  todayVal.font = new Font("Courier New", 22)
  todayVal.textColor = barColor(todayPct)

  todayCol.addSpacer(3)

  // Today pixel bar (10 chars)
  const todayFilled = Math.round(todayPct * 10)
  const todayBarTxt = todayCol.addText("[" + pixelBar(todayFilled, 10, "█", "░") + "]")
  todayBarTxt.font = new Font("Courier New", 10)
  todayBarTxt.textColor = barColor(todayPct)

  todayCol.addSpacer(3)

  const refreshTxt = todayCol.addText("⟳ " + refreshStr)
  refreshTxt.font = new Font("Courier New", 9)
  refreshTxt.textColor = GRAY

  topRow.addSpacer()

  w.addSpacer(10)

  // ── DIVIDER ──
  const divider = w.addText("╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌")
  divider.font = new Font("Courier New", 8)
  divider.textColor = GREEN3

  w.addSpacer(8)

  // ── BOTTOM: WEEK PROGRESS ──
  const weekLabel = w.addText("▶ THIS WEEK")
  weekLabel.font = new Font("Courier New", 9)
  weekLabel.textColor = GRAY

  w.addSpacer(4)

  // Big week bar (20 chars)
  const weekFilled = Math.round(weekPct * 20)
  const weekBar = w.addText("[" + pixelBar(weekFilled, 20, "█", "░") + "]")
  weekBar.font = new Font("Courier New", 12)
  weekBar.textColor = barColor(weekPct)

  w.addSpacer(4)

  // Week numbers row
  const weekNumRow = w.addStack()
  weekNumRow.layoutHorizontally()

  const weekTime = weekNumRow.addText(fmtMins(s.week_minutes) + " / " + fmtMins(weekGoal))
  weekTime.font = new Font("Courier New", 11)
  weekTime.textColor = WHITE

  weekNumRow.addSpacer()

  const weekPctTxt = weekNumRow.addText(Math.round(weekPct * 100) + "%")
  weekPctTxt.font = new Font("Courier New", 11)
  weekPctTxt.textColor = barColor(weekPct)

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
