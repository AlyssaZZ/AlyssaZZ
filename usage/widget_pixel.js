const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/alyssazz/alyssazz/main/usage/sessions.json"

const BG    = new Color("#0a0a0a")
const AMBER = new Color("#ffb347")
const GOLD  = new Color("#ffe066")
const DIM   = new Color("#555555")
const WHITE = new Color("#f5f5f5")
const GREEN = new Color("#7fff7f")
const PINK  = new Color("#ff6eb4")

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

// 心心进度（今日）: 最多10颗心
function hearts(pct, total) {
  const filled = Math.max(0, Math.round(pct * total))
  return "♥".repeat(filled) + "♡".repeat(total - filled)
}

// 方块进度（本周）: 最多10格
function blocks(pct, total) {
  const filled = Math.max(0, Math.round(pct * total))
  return "■".repeat(filled) + "□".repeat(total - filled)
}

// 等级：每10小时升一级
function level(totalMins) {
  return Math.floor(totalMins / 600)
}

async function buildWidget(data) {
  const w = new ListWidget()
  w.backgroundColor = BG
  w.setPadding(12, 16, 12, 16)

  if (!data) {
    const t = w.addText("NO SIGNAL")
    t.textColor = AMBER
    t.font = new Font("Courier New", 12)
    return w
  }

  const s = data.stats
  const goal = s.monthly_goal_minutes || 600
  const todayGoal = Math.round(goal / 30)   // ~20m/day
  const weekGoal  = Math.round(goal / 4)    // ~150m/week
  const todayPct  = Math.min(s.today_minutes / todayGoal, 1)
  const weekPct   = Math.min(s.week_minutes  / weekGoal,  1)
  const lv        = level(s.total_minutes)
  const refreshStr = new Date().toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})

  // ── 像素小人 + 名字 + 刷新时间 ──
  const r1 = w.addStack()
  r1.layoutHorizontally()
  r1.centerAlignContent()

  // 像素小人列
  const spriteCol = r1.addStack()
  spriteCol.layoutVertically()
  spriteCol.centerAlignContent()

  const lines = [" {-□-} ", "(  oo )", " ╰──╯  "]
  for (const l of lines) {
    const t = spriteCol.addText(l)
    t.font = new Font("Courier New", 10)
    t.textColor = AMBER
  }

  r1.addSpacer(10)

  // 名字 + lv
  const nameCol = r1.addStack()
  nameCol.layoutVertically()

  const nameRow = nameCol.addStack()
  nameRow.layoutHorizontally()
  nameRow.centerAlignContent()
  const nameTxt = nameRow.addText("Claude")
  nameTxt.font = new Font("Courier New", 13)
  nameTxt.textColor = WHITE
  nameRow.addSpacer(6)
  const lvBadge = nameRow.addStack()
  lvBadge.backgroundColor = new Color("#ff6b35")
  lvBadge.cornerRadius = 4
  lvBadge.setPadding(1, 5, 1, 5)
  const lvTxt = lvBadge.addText(`Lv ${lv}`)
  lvTxt.font = new Font("Courier New", 9)
  lvTxt.textColor = WHITE

  nameCol.addSpacer(4)

  const refTxt = nameCol.addText("⟳ " + refreshStr)
  refTxt.font = new Font("Courier New", 9)
  refTxt.textColor = DIM

  r1.addSpacer()

  w.addSpacer(10)

  // ── 今日进度（心心）──
  const todayRow = w.addStack()
  todayRow.layoutHorizontally()
  todayRow.centerAlignContent()

  const todayLbl = todayRow.addText("today  ")
  todayLbl.font = new Font("Courier New", 11)
  todayLbl.textColor = DIM

  const heartsTxt = todayRow.addText(hearts(todayPct, 10))
  heartsTxt.font = new Font("Courier New", 11)
  heartsTxt.textColor = PINK

  todayRow.addSpacer()

  const todayVal = todayRow.addText(fmtMins(s.today_minutes))
  todayVal.font = new Font("Courier New", 11)
  todayVal.textColor = GOLD

  w.addSpacer(6)

  // ── 本周进度（方块）──
  const weekRow = w.addStack()
  weekRow.layoutHorizontally()
  weekRow.centerAlignContent()

  const weekLbl = weekRow.addText("week   ")
  weekLbl.font = new Font("Courier New", 11)
  weekLbl.textColor = DIM

  const blocksTxt = weekRow.addText(blocks(weekPct, 10))
  blocksTxt.font = new Font("Courier New", 11)
  blocksTxt.textColor = GREEN

  weekRow.addSpacer()

  const weekVal = weekRow.addText(fmtMins(s.week_minutes))
  weekVal.font = new Font("Courier New", 11)
  weekVal.textColor = GOLD

  w.addSpacer(8)

  // ── 分隔线 ──
  const div = w.addText("─────────────────────────────")
  div.font = new Font("Courier New", 8)
  div.textColor = DIM

  w.addSpacer(6)

  // ── 底部数据 ──
  const statsRow = w.addStack()
  statsRow.layoutHorizontally()

  function statItem(parent, label, value) {
    const col = parent.addStack()
    col.layoutVertically()
    const lbl = col.addText(label)
    lbl.font = new Font("Courier New", 8)
    lbl.textColor = DIM
    const val = col.addText(value)
    val.font = new Font("Courier New", 11)
    val.textColor = WHITE
  }

  statItem(statsRow, "sessions", `${s.today_sessions}`)
  statsRow.addSpacer()
  statItem(statsRow, "this week", `${s.week_sessions}`)
  statsRow.addSpacer()
  statItem(statsRow, "total", fmtMins(s.total_minutes))

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
