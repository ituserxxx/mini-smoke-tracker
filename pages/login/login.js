const { wechatLogin, ensureSession } = require('../../utils/auth')

Page({
  data: {
    loading: false,
    error: ''
  },

  onLoad() {
    // 已有会话则直接进入应用
    ensureSession().then((s) => {
      if (s) this.goApp()
    })
  },

  async onWechatLogin() {
    if (this.data.loading) return
    this.setData({ loading: true, error: '' })
    try {
      await wechatLogin()
      this.goApp()
    } catch (err) {
      const msg = (err && err.message) ? err.message : '微信登录失败，请重试'
      this.setData({ error: msg, loading: false })
    }
  },

  goApp() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
