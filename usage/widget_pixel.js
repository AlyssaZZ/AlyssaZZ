const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/alyssazz/alyssazz/main/usage/sessions.json"

const ACCENT  = new Color("#7C3AED")
const BG_DARK = new Color("#0D0D0D")
const BG_CARD = new Color("#1A1A2E")
const DIM     = new Color("#888888")
const MID     = new Color("#CCCCCC")
const HI      = Color.white()
const GREEN   = new Color("#22C55E")

async function fetchData() {
  const req = new Request(GITHUB_RAW_URL)
  req.timeoutInterval = 10
  try { return await req.loadJSON() } catch (e) { return null }
}

function fmtMins(m) {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r === 0 ? `${h}h` : `${h}h ${r}m`
}

async function buildWidget(data) {
  const w = new ListWidget()
  w.backgroundColor = BG_DARK
  w.setPadding(14, 16, 14, 16)

  if (!data) {
    const t = w.addText("⚠️ No data")
    t.textColor = HI
    t.font = Font.systemFont(12)
    return w
  }

  const s = data.stats
  const goal = s.monthly_goal_minutes || 600
  const monthPct = Math.min(s.month_minutes / goal, 1)
  const refreshStr = new Date().toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})

  // ── Row 1: 像素小人 + 标题 + 刷新时间 ──
  const r1 = w.addStack()
  r1.layoutHorizontally()
  r1.centerAlignContent()

  const sprite = r1.addText("👾")
  sprite.font = Font.systemFont(18)

  r1.addSpacer(6)

  const titleTxt = r1.addText("Claude Code")
  titleTxt.font = Font.boldSystemFont(14)
  titleTxt.textColor = HI

  r1.addSpacer()

  const refreshTxt = r1.addText("⟳ " + refreshStr)
  refreshTxt.font = Font.systemFont(11)
  refreshTxt.textColor = DIM

  w.addSpacer(10)

  // ── Row 2: THIS MONTH 标签 + 进度数字 ──
  const mLabel = w.addText("THIS MONTH")
  mLabel.textColor = DIM
  mLabel.font = Font.mediumSystemFont(9)

  w.addSpacer(3)

  const mRow = w.addStack()
  mRow.layoutHorizontally()
  mRow.bottomAlignContent()

  const mVal = mRow.addText(fmtMins(s.month_minutes))
  mVal.textColor = HI
  mVal.font = Font.boldSystemFont(22)

  mRow.addSpacer(4)

  const mGoal = mRow.addText(`/ ${fmtMins(goal)}`)
  mGoal.textColor = DIM
  mGoal.font = Font.systemFont(12)

  mRow.addSpacer()

  const badge = mRow.addStack()
  badge.backgroundColor = monthPct >= 1 ? GREEN : ACCENT
  badge.cornerRadius = 6
  badge.setPadding(2, 7, 2, 7)
  const badgeTxt = badge.addText(monthPct >= 1 ? "✓" : `${Math.round(monthPct * 100)}%`)
  badgeTxt.textColor = HI
  badgeTxt.font = Font.boldSystemFont(10)

  w.addSpacer(6)

  // ── 进度条（永远是紫色）──
  const barBg = w.addStack()
  barBg.backgroundColor = new Color("#2A2A3E")
  barBg.cornerRadius = 4
  const barFill = barBg.addStack()
  barFill.backgroundColor = monthPct >= 1 ? GREEN : ACCENT
  barFill.cornerRadius = 4
  barFill.size = new Size(Math.max(8, Math.round(270 * monthPct)), 8)
  barBg.addSpacer()

  w.addSpacer(10)

  // ── Row 3: TODAY / WEEK / TOTAL 卡片 ──
  const row = w.addStack()
  row.layoutHorizontally()

  function addCard(parent, label, value, sub) {
    const card = parent.addStack()
    card.layoutVertically()
    card.backgroundColor = BG_CARD
    card.cornerRadius = 8
    card.setPadding(6, 8, 6, 8)
    const lbl = card.addText(label)
    lbl.textColor = DIM
    lbl.font = Font.mediumSystemFont(8)
    card.addSpacer(2)
    const val = card.addText(value)
    val.textColor = HI
    val.font = Font.boldSystemFont(15)
    const subTxt = card.addText(sub)
    subTxt.textColor = MID
    subTxt.font = Font.systemFont(9)
  }

  addCard(row, "TODAY", fmtMins(s.today_minutes), `${s.today_sessions} sessions`)
  row.addSpacer(8)
  addCard(row, "THIS WEEK", fmtMins(s.week_minutes), `${s.week_sessions} sessions`)
  row.addSpacer(8)
  addCard(row, "TOTAL", fmtMins(s.total_minutes), `${s.total_sessions} sessions`)

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
