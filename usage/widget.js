// Claude Code Usage Widget — Scriptable (iOS)
// 1. Install Scriptable from App Store
// 2. Paste this script, set GITHUB_RAW_URL below
// 3. Add a Scriptable widget to your home screen, choose this script

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/alyssazz/alyssazz/main/usage/sessions.json"

const ACCENT   = new Color("#7C3AED")  // purple
const BG_DARK  = new Color("#0D0D0D")
const BG_CARD  = new Color("#1A1A2E")
const TEXT_DIM = new Color("#888888")
const TEXT_MID = new Color("#CCCCCC")
const TEXT_HI  = Color.white()
const GREEN    = new Color("#22C55E")
const YELLOW   = new Color("#EAB308")
const RED      = new Color("#EF4444")

async function fetchData() {
  const req = new Request(GITHUB_RAW_URL)
  req.timeoutInterval = 10
  try {
    return await req.loadJSON()
  } catch (e) {
    return null
  }
}

function progressColor(pct) {
  if (pct >= 1.0) return GREEN
  if (pct >= 0.6) return ACCENT
  if (pct >= 0.3) return YELLOW
  return RED
}

function fmtMins(m) {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r === 0 ? `${h}h` : `${h}h ${r}m`
}

function drawBar(stack, pct, w, h) {
  const bar = stack.addStack()
  bar.size = new Size(w, h)
  bar.cornerRadius = h / 2
  bar.backgroundColor = new Color("#2A2A3E")

  const fill = bar.addStack()
  fill.size = new Size(Math.max(6, w * Math.min(pct, 1)), h)
  fill.cornerRadius = h / 2
  fill.backgroundColor = progressColor(pct)
  bar.addSpacer()
}

async function buildWidget(data) {
  const w = new ListWidget()
  w.backgroundColor = BG_DARK
  w.setPadding(14, 16, 14, 16)
  w.url = "scriptable:///run/" + Script.name()

  if (!data) {
    const t = w.addText("⚠️ Failed to load data")
    t.textColor = RED
    t.font = Font.mediumSystemFont(12)
    return w
  }

  const s = data.stats
  const goal = s.monthly_goal_minutes || 600
  const monthPct = s.month_minutes / goal
  const todayGoal = Math.round(goal / 30)
  const todayPct  = s.today_minutes / todayGoal

  // ── Title row ──
  const titleRow = w.addStack()
  titleRow.layoutHorizontally()
  titleRow.centerAlignContent()

  const icon = titleRow.addText("⚡")
  icon.font = Font.systemFont(13)

  titleRow.addSpacer(4)

  const title = titleRow.addText("Claude Code")
  title.textColor = TEXT_HI
  title.font = Font.boldSystemFont(13)

  titleRow.addSpacer()

  const badge = titleRow.addStack()
  badge.backgroundColor = monthPct >= 1 ? GREEN : ACCENT
  badge.cornerRadius = 6
  badge.setPadding(2, 6, 2, 6)
  const badgeText = badge.addText(monthPct >= 1 ? "✓ Done" : `${Math.round(monthPct * 100)}%`)
  badgeText.textColor = TEXT_HI
  badgeText.font = Font.boldSystemFont(10)

  w.addSpacer(10)

  // ── Monthly progress ──
  const monthLabel = w.addText("THIS MONTH")
  monthLabel.textColor = TEXT_DIM
  monthLabel.font = Font.mediumSystemFont(9)

  w.addSpacer(3)

  const monthNums = w.addStack()
  monthNums.layoutHorizontally()
  monthNums.bottomAlignContent()

  const monthVal = monthNums.addText(fmtMins(s.month_minutes))
  monthVal.textColor = TEXT_HI
  monthVal.font = Font.boldSystemFont(22)

  monthNums.addSpacer(4)

  const monthGoalTxt = monthNums.addText(`/ ${fmtMins(goal)}`)
  monthGoalTxt.textColor = TEXT_DIM
  monthGoalTxt.font = Font.systemFont(12)

  w.addSpacer(5)
  drawBar(w, monthPct, 0, 8)

  w.addSpacer(10)

  // ── Today & Week row ──
  const statsRow = w.addStack()
  statsRow.layoutHorizontally()

  // Today card
  const todayCard = statsRow.addStack()
  todayCard.layoutVertically()
  todayCard.backgroundColor = BG_CARD
  todayCard.cornerRadius = 8
  todayCard.setPadding(6, 8, 6, 8)

  const todayTitle = todayCard.addText("TODAY")
  todayTitle.textColor = TEXT_DIM
  todayTitle.font = Font.mediumSystemFont(8)

  todayCard.addSpacer(2)

  const todayVal = todayCard.addText(fmtMins(s.today_minutes))
  todayVal.textColor = progressColor(todayPct)
  todayVal.font = Font.boldSystemFont(15)

  const todaySess = todayCard.addText(`${s.today_sessions} sessions`)
  todaySess.textColor = TEXT_MID
  todaySess.font = Font.systemFont(9)

  statsRow.addSpacer(8)

  // Week card
  const weekCard = statsRow.addStack()
  weekCard.layoutVertically()
  weekCard.backgroundColor = BG_CARD
  weekCard.cornerRadius = 8
  weekCard.setPadding(6, 8, 6, 8)

  const weekTitle = weekCard.addText("THIS WEEK")
  weekTitle.textColor = TEXT_DIM
  weekTitle.font = Font.mediumSystemFont(8)

  weekCard.addSpacer(2)

  const weekVal = weekCard.addText(fmtMins(s.week_minutes))
  weekVal.textColor = TEXT_HI
  weekVal.font = Font.boldSystemFont(15)

  const weekSess = weekCard.addText(`${s.week_sessions} sessions`)
  weekSess.textColor = TEXT_MID
  weekSess.font = Font.systemFont(9)

  statsRow.addSpacer()

  // Total
  const totalCard = statsRow.addStack()
  totalCard.layoutVertically()
  totalCard.backgroundColor = BG_CARD
  totalCard.cornerRadius = 8
  totalCard.setPadding(6, 8, 6, 8)

  const totalTitle = totalCard.addText("TOTAL")
  totalTitle.textColor = TEXT_DIM
  totalTitle.font = Font.mediumSystemFont(8)

  totalCard.addSpacer(2)

  const totalVal = totalCard.addText(fmtMins(s.total_minutes))
  totalVal.textColor = TEXT_HI
  totalVal.font = Font.boldSystemFont(15)

  const totalSess = totalCard.addText(`${s.total_sessions} sessions`)
  totalSess.textColor = TEXT_MID
  totalSess.font = Font.systemFont(9)

  w.addSpacer(8)

  // ── Last updated ──
  const updatedAt = s.last_updated
    ? new Date(s.last_updated).toLocaleDateString("zh-CN", {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})
    : "—"
  const footer = w.addText(`Updated ${updatedAt}`)
  footer.textColor = TEXT_DIM
  footer.font = Font.systemFont(9)

  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000) // refresh every 15 min
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
