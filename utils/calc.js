// 业务计算：基于 records 与目标 goals 派生各类指标
const { formatDate, dayKey, lastNDates, daysSince } = require('./date');

function dailyMap(records) {
  const map = {};
  records.forEach(r => {
    const k = dayKey(r.timestamp);
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}

// 今日吸烟支数
function todayCount(records) {
  const t = dayKey(Date.now());
  return records.filter(r => dayKey(r.timestamp) === t).length;
}

// 连续达标天数（含今天）：每天支数 <= 上限 即视为达标
function streakDays(records, goals) {
  const limit = goals.quitMode ? 0 : (goals.dailyLimit || 0);
  const map = dailyMap(records);
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 366; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const full = formatDate(d);
    const c = map[full] || 0;
    if (c <= limit) streak++;
    else break;
  }
  return streak;
}

// 累计省钱：以「若不控制应抽的支数」为基线，减去实际支数，乘单价
function totalSaved(records, goals) {
  const perCig = (goals.pricePerPack || 30) / (goals.cigarettesPerPack || 20);
  const days = daysSince(goals.startDate);
  const baseline = days * (goals.quitMode ? (goals.dailyLimit || 0) : (goals.dailyLimit || 0));
  const actual = records.length;
  const less = Math.max(0, baseline - actual);
  return Math.round(less * perCig);
}

// 累计少抽支数
function lessCount(records, goals) {
  const days = daysSince(goals.startDate);
  const baseline = days * (goals.dailyLimit || 0);
  return Math.max(0, baseline - records.length);
}

// 最近 n 天每天支数
function lastNDaily(records, n) {
  const map = dailyMap(records);
  return lastNDates(n).map(d => {
    const full = formatDate(d);
    return {
      full,
      label: (d.getMonth() + 1) + '/' + d.getDate(),
      count: map[full] || 0
    };
  });
}

// 徽章体系
function badges(records, goals) {
  const saved = totalSaved(records, goals);
  const streak = streakDays(records, goals);
  const activeDays = new Set(records.map(r => dayKey(r.timestamp))).size;
  const list = [
    { id: 'first', name: '初次记录', desc: '完成第一次吸烟记录', icon: '🌱', unlocked: records.length > 0 },
    { id: 'week', name: '坚持一周', desc: '累计记录满 7 天', icon: '🌿', unlocked: activeDays >= 7 },
    { id: 'save100', name: '省钱达人', desc: '累计省下 ¥100', icon: '💰', unlocked: saved >= 100 },
    { id: 'streak3', name: '三日达标', desc: '连续 3 天达标', icon: '🔥', unlocked: streak >= 3 },
    { id: 'streak7', name: '一周达标', desc: '连续 7 天达标', icon: '🏆', unlocked: streak >= 7 },
    { id: 'save500', name: '财富自由', desc: '累计省下 ¥500', icon: '🎉', unlocked: saved >= 500 }
  ];
  return list;
}

// 本周诱因复盘：统计最近 7 天各诱因出现次数，给出 Top3
function weeklyReview(records) {
  const week = records.filter(r => Date.now() - r.timestamp < 7 * 86400000);
  const counter = {};
  week.forEach(r => {
    const t = r.trigger || '未标注';
    counter[t] = (counter[t] || 0) + 1;
  });
  const top = Object.keys(counter)
    .map(k => ({ trigger: k, count: counter[k] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return { total: week.length, top };
}

// 健康收益换算（粗略科普向）：每支烟约缩短 11 分钟寿命
function healthMinutes(records) {
  return records.length * 11;
}

module.exports = {
  todayCount,
  streakDays,
  totalSaved,
  lessCount,
  lastNDaily,
  badges,
  weeklyReview,
  healthMinutes,
  dailyMap
};
