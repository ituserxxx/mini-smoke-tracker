const { getRecords, getGoals } = require('../../utils/storage');
const {
  streakDays, totalSaved, lessCount, lastNDaily, badges, weeklyReview, healthMinutes
} = require('../../utils/calc');
const { ensureSession } = require('../../utils/auth');
const {
  lifeLost, hoursSince, achievedCount, RECOVERY, formatSpan
} = require('../../utils/health');

Page({
  data: {
    total: 0,
    less: 0,
    saved: 0,
    streak: 0,
    healthMin: 0,
    badges: [],
    review: { total: 0, top: [] },
    trend: [],
    // 健康代价
    lifeText: '0 分钟',
    lifeLowText: '0 分钟',
    lifeHighText: '0 分钟',
    freeText: '暂无记录',
    achieved: 0,
    milestoneTotal: RECOVERY.length,
    progress: 0
  },

  // 会话门禁
  async onShow() {
    const s = await ensureSession();
    if (!s) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.refresh();
  },

  onReady() {
    // canvas 就绪后，若已有数据则重绘一次，确保首屏能画出图
    if (this.data.trend.length) this.refresh();
  },

  async refresh() {
    try {
      const records = await getRecords();
      const goals = await getGoals();
      const trend = lastNDaily(records, 14);

      // 健康代价：寿命损失 + 戒烟恢复里程碑进度
      const life = lifeLost(records.length);
      const last = records.length ? records[0].timestamp : null; // 倒序，第一条即最近一支
      const hours = hoursSince(last);
      const achieved = achievedCount(hours);
      const milestoneTotal = RECOVERY.length;

      this.setData({
        total: records.length,
        less: lessCount(records, goals),
        saved: totalSaved(records, goals),
        streak: streakDays(records, goals),
        healthMin: healthMinutes(records),
        badges: badges(records, goals),
        review: weeklyReview(records),
        trend,
        lifeText: life.text,
        lifeLowText: life.lowText,
        lifeHighText: life.highText,
        freeText: hours === null ? '暂无记录' : formatSpan(hours * 60),
        achieved,
        milestoneTotal,
        progress: milestoneTotal ? Math.round((achieved / milestoneTotal) * 100) : 0
      }, () => {
        this.drawTrend(trend);
      });
    } catch (e) {
      wx.showToast({ title: '读取失败，请检查网络', icon: 'none' });
    }
  },

  drawTrend(trend) {
    if (!trend || !trend.length) return;
    const query = wx.createSelectorQuery();
    query.select('#trend').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio;
      const w = res[0].width;
      const h = res[0].height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const pad = 16;
      const baseY = h - 28;
      const max = Math.max(1, ...trend.map(t => t.count));
      const bw = (w - pad * 2) / trend.length;
      const barW = bw * 0.56;

      trend.forEach((t, i) => {
        const x = pad + i * bw + (bw - barW) / 2;
        const bh = (t.count / max) * (baseY - 20);
        const y = baseY - bh;
        if (t.count === 0) {
          ctx.fillStyle = '#16213a';
        } else {
          const grad = ctx.createLinearGradient(x, y, x, y + bh);
          grad.addColorStop(0, '#5FE3FF');
          grad.addColorStop(1, '#1FA8E0');
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(45, 212, 255, 0.7)';
          ctx.shadowBlur = 8;
        }
        this.roundRect(ctx, x, y, barW, bh, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#7C8DB5';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.label, x + barW / 2, h - 8);
      });
    });
  },

  roundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, h));
    if (h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  },

  goShare() {
    wx.navigateTo({ url: '/pages/share/share' });
  },

  // 健康是 tabBar 页面，必须用 switchTab
  goHealth() {
    wx.switchTab({ url: '/pages/health/health' });
  }
});
