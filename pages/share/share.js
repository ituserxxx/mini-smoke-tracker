const { getRecords, getGoals } = require('../../utils/storage');
const { streakDays, lessCount, healthMinutes } = require('../../utils/calc');
const health = require('../../utils/health');

// 海报时间段选项（按吸烟记录的 smoked_at 过滤）
const RANGES = [
  { key: '7d', label: '最近7天', days: 7 },
  { key: '30d', label: '最近30天', days: 30 },
  { key: '3m', label: '最近3个月', days: 90 },
  { key: '6m', label: '最近半年', days: 180 },
  { key: '1y', label: '最近一年', days: 365 }
];
const { ensureSession } = require('../../utils/auth');

Page({
  data: {
    ranges: RANGES,
    rangeIndex: 1,
    rangeLabel: '最近30天',
    streak: 0,
    savedText: '−¥0',
    less: 0,
    total: 0,
    lifeLostText: '',
    healthMin: 0,
    drawing: false,
    posterStyle: '' // 由 JS 按屏宽计算：width/height(px)
  },

  // 会话门禁
  async onShow() {
    const s = await ensureSession();
    if (!s) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
  },

  onReady() {
    this.setupCanvasSize();
  },

  // 按设备屏宽计算海报画布显示尺寸（iPhone 17 Pro Max 440pt 宽 → 比例自适应）
  setupCanvasSize() {
    const info = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync());
    const sw = info.windowWidth || 375;
    const posterW = Math.round(sw * 0.86);
    const posterH = Math.round(posterW * 1.5);
    this.setData({ posterStyle: `width:${posterW}px;height:${posterH}px` }, () => this.load());
  },

  async load() {
    try {
      this.records = await getRecords();
      this.goals = await getGoals();
      this.refresh();
    } catch (e) {
      wx.showToast({ title: '读取失败，请检查网络', icon: 'none' });
    }
  },

  // 切换时间段
  onRangeTap(e) {
    const idx = Number(e.currentTarget.dataset.index);
    if (idx === this.data.rangeIndex) return;
    this.setData({ rangeIndex: idx }, () => this.refresh());
  },

  // 按所选时间段筛选并汇总海报数据
  refresh() {
    const range = RANGES[this.data.rangeIndex];
    const cutoff = Date.now() - range.days * 86400000;
    const recs = (this.records || []).filter(r => r.timestamp >= cutoff);
    const goals = this.goals || {};
    const perCig = (goals.pricePerPack || 30) / (goals.cigarettesPerPack || 20);
    const total = recs.length;
    const spent = total * perCig;
    const limit = goals.quitMode ? 0 : (goals.dailyLimit || 0);
    const baseline = range.days * limit;
    const less = Math.max(0, Math.round(baseline) - total);
    const streak = streakDays(this.records || [], goals);
    this.setData({
      total,
      lifeLostText: health.lifeLost(total).text,
      savedText: '−¥' + Math.round(spent),
      less,
      streak,
      rangeLabel: range.label
    }, () => this.drawPoster());
  },

  drawPoster() {
    const query = wx.createSelectorQuery();
    query.select('#poster').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const info = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync());
      const dpr = info.pixelRatio || 2;
      const w = res[0].width;
      const h = res[0].height;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const CYAN = '#5FE3FF';
      const MINT = '#3DF5B0';
      const PURPLE = '#B57BFF';
      const pad = w * 0.07;

      // —— 深空背景 + 顶部辉光 + 科技网格 ——
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0C1730');
      bg.addColorStop(1, '#060B16');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, w * 0.95);
      glow.addColorStop(0, 'rgba(45, 212, 255, 0.20)');
      glow.addColorStop(1, 'rgba(45, 212, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(120, 160, 220, 0.06)';
      ctx.lineWidth = 1;
      const step = w * 0.09;
      for (let gx = 0; gx <= w; gx += step) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy <= h; gy += step) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

      // —— 四角 HUD 角标 ——
      const m = w * 0.035, len = w * 0.06, lw = Math.max(1, w * 0.006);
      ctx.strokeStyle = 'rgba(45, 212, 255, 0.55)';
      ctx.lineWidth = lw;
      const corners = [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]];
      corners.forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * len); ctx.lineTo(x, y); ctx.lineTo(x + sx * len, y);
        ctx.stroke();
      });

      // —— 品牌区 ——
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(45, 212, 255, 0.6)';
      ctx.shadowBlur = Math.max(8, w * 0.03);
      ctx.fillStyle = CYAN;
      ctx.font = `bold ${w * 0.075}px sans-serif`;
      ctx.fillText('吸烟刺客', w / 2, h * 0.13);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#8FA6D6';
      ctx.font = `${w * 0.026}px sans-serif`;
      ctx.fillText('S M O K I N G   L O G   ·   健 康 洞 察', w / 2, h * 0.175);

      // 分隔线
      this.divider(ctx, pad, h * 0.205, w - pad, 'rgba(45, 212, 255, 0.25)');

      // —— 标题 ——
      ctx.fillStyle = '#EAF2FF';
      ctx.font = `bold ${w * 0.046}px sans-serif`;
      ctx.fillText('我的吸烟数据', w / 2, h * 0.265);

      ctx.fillStyle = '#7C8DB5';
      ctx.font = `${w * 0.03}px sans-serif`;
      ctx.fillText('（' + this.data.rangeLabel + '）', w / 2, h * 0.305);

      // —— HERO：吸烟数量（累计支数）——
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = Math.max(10, w * 0.035);
      ctx.fillStyle = CYAN;
      ctx.font = `bold ${w * 0.13}px sans-serif`;
      ctx.fillText(this.data.total + '', w / 2, h * 0.40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#BFE6FF';
      ctx.font = `${w * 0.032}px sans-serif`;
      ctx.fillText('累计吸烟（支）', w / 2, h * 0.45);

      // —— 健康数据胶囊：寿命已缩短 ——
      const pillW = w * 0.80, pillH = w * 0.13;
      const pillX = (w - pillW) / 2, pillY = h * 0.475;
      ctx.fillStyle = 'rgba(60, 28, 44, 0.55)';
      this.roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 122, 147, 0.55)';
      ctx.lineWidth = Math.max(1, w * 0.004);
      ctx.shadowColor = 'rgba(255, 122, 147, 0.4)';
      ctx.shadowBlur = Math.max(6, w * 0.02);
      this.roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF7A93';
      ctx.font = `bold ${w * 0.036}px sans-serif`;
      ctx.fillText('寿命已缩短约 ' + this.data.lifeLostText, w / 2, pillY + pillH * 0.42);
      ctx.fillStyle = '#F3C9D5';
      ctx.font = `${w * 0.025}px sans-serif`;
      ctx.fillText('每支烟平均 −11 分钟（BMJ 2000）', w / 2, pillY + pillH * 0.78);

      // 分隔线
      this.divider(ctx, pad, h * 0.62, w - pad, 'rgba(45, 212, 255, 0.25)');

      // —— 三项进度数据（等宽列 + 竖分隔）——
      const cellW = (w - 2 * pad) / 3;
      const items = [
        { v: this.data.streak + ' 天', l: '连续达标', c: CYAN },
        { v: this.data.savedText, l: '累计省下', c: MINT },
        { v: this.data.less + ' 支', l: '少抽支数', c: PURPLE }
      ];
      // 竖分隔
      ctx.strokeStyle = 'rgba(120, 160, 220, 0.18)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const x = pad + cellW * i;
        ctx.beginPath(); ctx.moveTo(x, h * 0.67); ctx.lineTo(x, h * 0.86); ctx.stroke();
      }
      items.forEach((it, i) => {
        const cx = pad + cellW * (i + 0.5);
        ctx.textAlign = 'center';
        ctx.fillStyle = it.c;
        ctx.shadowColor = it.c;
        ctx.shadowBlur = Math.max(6, w * 0.02);
        ctx.font = `bold ${w * 0.07}px sans-serif`;
        ctx.fillText(it.v, cx, h * 0.77);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#9FB4DD';
        ctx.font = `${w * 0.03}px sans-serif`;
        ctx.fillText(it.l, cx, h * 0.83);
      });

      // —— 标语 ——
      ctx.textAlign = 'center';
      ctx.fillStyle = '#DCE7FF';
      ctx.font = `${w * 0.032}px sans-serif`;
      ctx.fillText('记录吸烟，看清健康代价', w / 2, h * 0.915);

      // —— 页脚 ——
      const dt = this.formatDate(new Date());
      ctx.fillStyle = '#6E80A8';
      ctx.font = `${w * 0.024}px sans-serif`;
      ctx.fillText(dt + '  ·  吸烟刺客', w / 2, h * 0.955);
    });
  },

  divider(ctx, x1, y, x2, color) {
    const grad = ctx.createLinearGradient(x1, 0, x2, 0);
    grad.addColorStop(0, 'rgba(45,212,255,0)');
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, 'rgba(45,212,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  },

  formatDate(d) {
    const p = (n) => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
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

  savePoster() {
    if (this.data.drawing) return;
    this.setData({ drawing: true });
    const query = wx.createSelectorQuery();
    query.select('#poster').fields({ node: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        this.setData({ drawing: false });
        return;
      }
      const canvas = res[0].node;
      wx.canvasToTempFilePath({
        canvas,
        success: (r) => {
          wx.saveImageToPhotosAlbum({
            filePath: r.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: (err) => {
              if (/auth|deny/.test(err.errMsg)) {
                wx.showModal({ title: '需要相册权限', content: '请在设置中允许保存到相册后重试', showCancel: false });
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            },
            complete: () => this.setData({ drawing: false })
          });
        },
        fail: () => this.setData({ drawing: false })
      });
    });
  },

  onShareAppMessage() {
    return {
      title: '我在「吸烟刺客」累计记录 ' + this.data.total + ' 支，寿命已缩短约 ' + this.data.lifeLostText,
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '我在「吸烟刺客」累计记录 ' + this.data.total + ' 支 · 看清健康代价'
    };
  }
});
