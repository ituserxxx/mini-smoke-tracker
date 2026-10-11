const { getGoals, setGoals, clearAll } = require('../../utils/storage');
const { ensureSession } = require('../../utils/auth');

Page({
  data: {
    dailyLimit: 10,
    pricePerPack: 30,
    cigarettesPerPack: 20,
    startDate: '',
    quitMode: false
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
      const g = await getGoals();
      this.setData({
        dailyLimit: g.dailyLimit,
        pricePerPack: g.pricePerPack,
        cigarettesPerPack: g.cigarettesPerPack,
        startDate: g.startDate,
        quitMode: g.quitMode
      });
    } catch (e) {
      wx.showToast({ title: '读取失败，请检查网络', icon: 'none' });
    }
  },

  onLimit(e) { this.setData({ dailyLimit: Number(e.detail.value) || 0 }); },
  onPrice(e) { this.setData({ pricePerPack: Number(e.detail.value) || 0 }); },
  onPack(e) { this.setData({ cigarettesPerPack: Number(e.detail.value) || 0 }); },
  onDate(e) { this.setData({ startDate: e.detail.value }); },
  onQuit(e) { this.setData({ quitMode: e.detail.value }); },

  async save() {
    try {
      await setGoals({
        dailyLimit: this.data.dailyLimit,
        pricePerPack: this.data.pricePerPack,
        cigarettesPerPack: this.data.cigarettesPerPack,
        startDate: this.data.startDate,
        quitMode: this.data.quitMode
      });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  clearData() {
    wx.showModal({
      title: '确认清空',
      content: '将删除云端所有吸烟记录，且不可恢复。',
      confirmColor: '#E24B4A',
      success: (r) => {
        if (r.confirm) {
          clearAll()
            .then(() => wx.showToast({ title: '已清空', icon: 'success' }))
            .catch(() => wx.showToast({ title: '清空失败', icon: 'none' }));
        }
      }
    });
  }
});
