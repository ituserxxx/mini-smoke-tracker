const { addRecord } = require('../../utils/storage');
const { ensureSession } = require('../../utils/auth');

const TRIGGERS = ['焦虑', '压力', '无聊', '放松', '饭后', '喝酒', '社交', '熬夜', '习惯', '其他'];

Page({
  data: {
    triggers: TRIGGERS,
    selected: [],
    location: '',
    note: '',
    timeStr: ''
  },

  onLoad() {
    const d = new Date();
    this.setData({
      timeStr: d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
    });
  },

  // 会话门禁
  async onShow() {
    const s = await ensureSession();
    if (!s) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
  },

  toggle(e) {
    const t = e.currentTarget.dataset.t;
    const sel = this.data.selected.slice();
    const i = sel.indexOf(t);
    if (i >= 0) sel.splice(i, 1);
    else sel.push(t);
    this.setData({ selected: sel });
  },

  onLocation(e) {
    this.setData({ location: e.detail.value });
  },

  onNote(e) {
    this.setData({ note: e.detail.value });
  },

  async save() {
    if (this.data.selected.length === 0) {
      wx.showModal({
        title: '提示',
        content: '至少选择一个诱因，或返回首页用「快速记录」',
        showCancel: false
      });
      return;
    }
    try {
      await addRecord({
        trigger: this.data.selected.join('/'),
        location: this.data.location,
        note: this.data.note
      });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (e) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  }
});
