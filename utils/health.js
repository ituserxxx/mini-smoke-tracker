// 健康影响换算：基于公开流行病学研究数据
// 说明：以下均为群体层面的统计结论，用于科普与自我激励，不构成个人医学建议。

// 每支烟平均缩短的寿命（分钟）
// BMJ 2000（Shaw/Mitchell/Dorling，基于 Doll 英国医生队列）：约 11 分钟
// 伦敦大学学院团队《Addiction》更新估算：长期吸烟者男性约 17 分钟、女性约 22 分钟
const LIFE_MIN_PER_CIG = 11
const LIFE_MIN_LOW = 11
const LIFE_MIN_HIGH = 22

// 烟草烟雾成分：>7000 种化学物质，至少 69 种已知致癌物（CDC / 中国疾控）
const CHEMICALS = 7000
const CARCINOGENS = 69

// 距最后一次吸烟的小时数（无记录返回 null）
function hoursSince(ts) {
  if (!ts) return null
  return (Date.now() - ts) / 3600000
}

function formatSpan(minutes) {
  if (!minutes) return '0 分钟'
  if (minutes < 60) return Math.round(minutes) + ' 分钟'
  if (minutes < 1440) return (minutes / 60).toFixed(1) + ' 小时'
  const days = minutes / 1440
  if (days < 365) return days.toFixed(1) + ' 天'
  return (days / 365).toFixed(2) + ' 年'
}

// 累计寿命损失换算
function lifeLost(count) {
  const minutes = count * LIFE_MIN_PER_CIG
  return {
    count,
    minutes,
    lowMinutes: count * LIFE_MIN_LOW,
    highMinutes: count * LIFE_MIN_HIGH,
    text: formatSpan(minutes),
    lowText: formatSpan(count * LIFE_MIN_LOW),
    highText: formatSpan(count * LIFE_MIN_HIGH)
  }
}

// 「每多吸一支烟」的代价（卡片数据）
const PER_CIG = [
  { v: '−11 分钟', l: '预期寿命', d: 'BMJ 2000 经典估算，更新研究为 17–22 分钟', c: '#5FE3FF' },
  { v: '7000+', l: '化学物质', d: '烟草烟雾中检出的化学物质总数', c: '#B57BFF' },
  { v: '69 种', l: '已知致癌物', d: '其中至少 69 种被证实可致癌', c: '#FF7A93' },
  { v: '×25', l: '肺癌风险', d: '吸烟者患肺癌风险约为不吸烟者 25 倍（CDC）', c: '#FFC24B' }
]

// 疾病风险（相对非吸烟者）
const RISKS = [
  { name: '肺癌', level: '约 25 倍', src: 'CDC' },
  { name: '冠心病 / 脑卒中', level: '2–4 倍', src: 'WHO' },
  { name: '每天仅 1–4 支', level: '心脏病死亡约 3 倍', src: 'Tobacco Control' },
  { name: '家人二手烟暴露', level: '风险 +25–30%', src: 'WHO' }
]

// 戒烟后身体恢复时间轴（WHO《戒烟的健康益处》+ WHO EMRO）
// hours 为达成该里程碑所需的小时数
const RECOVERY = [
  { hours: 0.34, time: '20 分钟', desc: '心率和血压下降' },
  { hours: 8, time: '8 小时', desc: '血液尼古丁降至峰值的 6.25%' },
  { hours: 12, time: '12 小时', desc: '一氧化碳降至正常，血氧回升' },
  { hours: 24, time: '24 小时', desc: '体内尼古丁被完全清除' },
  { hours: 72, time: '48–72 小时', desc: '神经末梢再生，味觉嗅觉改善' },
  { hours: 240, time: '10 天–2 周', desc: '牙龈牙齿血液循环接近非吸烟者' },
  { hours: 336, time: '2–12 周', desc: '循环改善，肺功能提升可达 30%' },
  { hours: 730, time: '1–9 个月', desc: '纤毛再生，咳嗽与气短减少' },
  { hours: 8760, time: '1 年', desc: '冠心病风险降至吸烟者的一半' },
  { hours: 43800, time: '5 年', desc: '中风风险降至非吸烟者水平' },
  { hours: 87600, time: '10 年', desc: '肺癌死亡风险降至吸烟者的一半' },
  { hours: 131400, time: '15 年', desc: '冠心病风险等同从未吸烟者' }
]

// 根据距最后一支烟的小时数，标注各里程碑是否已达成
function recoveryState(hours) {
  return RECOVERY.map((m) => ({
    ...m,
    done: hours !== null && hours >= m.hours
  }))
}

function achievedCount(hours) {
  if (hours === null) return 0
  return RECOVERY.filter((m) => hours >= m.hours).length
}

const SOURCES = [
  'WHO《戒烟的健康益处》问答（2020）',
  'WHO 世界无烟日 2018：烟草伤心，请选择健康',
  'BMJ 2000：One cigarette reduces your life by 11 minutes',
  '伦敦大学学院团队《Addiction》：男性约 17 分钟 / 女性约 22 分钟',
  '美国 CDC：卷烟烟雾含 7000+ 化学物质，至少 69 种致癌',
  '《中国吸烟危害健康报告 2020》：中国吸烟者超 3 亿，年死亡超 100 万',
  'Tobacco Control：每天 1–4 支，心脏病死亡风险近 3 倍'
]

module.exports = {
  LIFE_MIN_PER_CIG,
  LIFE_MIN_LOW,
  LIFE_MIN_HIGH,
  CHEMICALS,
  CARCINOGENS,
  PER_CIG,
  RISKS,
  RECOVERY,
  SOURCES,
  hoursSince,
  lifeLost,
  recoveryState,
  achievedCount,
  formatSpan
}
