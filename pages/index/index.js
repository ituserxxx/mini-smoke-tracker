const { getRecords, addRecord, getGoals } = require('../../utils/storage');
const { todayCount, streakDays, totalSaved, lastNDaily } = require('../../utils/calc');
const { formatDate } = require('../../utils/date');
const { ensureSession } = require('../../utils/auth');

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

Page({
  data: {
    greeting: '',
    dateStr: '',
    today: 0,
    streak: 0,
    saved: 0,
    trend: [],
    maxCount: 1
  },

  onLoad() {
    this.setData({ greeting: greeting(), dateStr: formatDate(Date.now()) });
  },

  // 会话门禁：未登录跳转到登录页
  async onShow() {
    const session = await ensureSession();
    if (!session) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.refresh();
  },

  async refresh() {
    try {
      const records = await getRecords();
      const goals = await getGoals();
      const trend = lastNDaily(records, 7);
      const maxCount = Math.max(1, ...trend.map(t => t.count));
      this.setData({
        today: todayCount(records),
        streak: streakDays(records, goals),
        saved: totalSaved(records, goals),
        trend,
        maxCount
      });
    } catch (e) {
      wx.showToast({ title: '读取失败，请检查网络', icon: 'none' });
    }
  },

  async quickLog() {
    try {
      await addRecord({ trigger: '随手', location: '', note: '' });
      wx.showToast({ title: '已记录 +1', icon: 'success' });
      this.refresh();
    } catch (e) {
      wx.showToast({ title: '记录失败，请重试', icon: 'none' });
    }
  },

  goRecord() {
    wx.navigateTo({ url: '/pages/record/record' });
  },

  goStats() {
    wx.switchTab({ url: '/pages/stats/stats' });
  }
});
