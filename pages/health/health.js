const { getRecords } = require('../../utils/storage');
const { ensureSession } = require('../../utils/auth');
const {
  lifeLost, hoursSince, recoveryState, achievedCount,
  PER_CIG, RISKS, SOURCES, formatSpan
} = require('../../utils/health');

Page({
  data: {
    total: 0,
    lifeText: '0 分钟',
    lowText: '0 分钟',
    highText: '0 分钟',
    freeText: '暂无记录',
    achieved: 0,
    recovery: [],
    perCig: PER_CIG,
    risks: RISKS,
    sources: SOURCES,
    loading: true
  },

  // 会话门禁
  async onShow() {
    const s = await ensureSession();
    if (!s) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.load();
  },

  async load() {
    try {
      const records = await getRecords();
      const total = records.length;
      const life = lifeLost(total);
      // 记录按 smoked_at 倒序返回，第一条即最近一支
      const last = records.length ? records[0].timestamp : null;
      const hours = hoursSince(last);
      const recovery = recoveryState(hours);

      this.setData({
        total,
        lifeText: life.text,
        lowText: life.lowText,
        highText: life.highText,
        freeText: hours === null ? '暂无记录' : formatSpan(hours * 60),
        achieved: achievedCount(hours),
        recovery,
        loading: false
      });
    } catch (e) {
      wx.showToast({ title: '读取失败，请检查网络', icon: 'none' });
      this.setData({ loading: false });
    }
  }
});
