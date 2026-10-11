// 日期工具
function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(input) {
  const d = (typeof input === 'number' || typeof input === 'string') ? new Date(input) : input;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function dayKey(ts) {
  return formatDate(ts);
}

// 返回最近 n 天（含今天）的日期对象数组，索引 0 为最早
function lastNDates(n) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push(d);
  }
  return arr;
}

// 距离今天的天数（向上取整到整天，至少 1）
function daysSince(dateStr) {
  const start = new Date(dateStr + 'T00:00:00');
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

module.exports = {
  pad,
  formatDate,
  dayKey,
  lastNDates,
  daysSince
};
