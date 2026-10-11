// 鉴权辅助：会话检查与微信登录
const { cloud } = require('./cloud')

// 返回当前会话，未登录或出错返回 null
async function ensureSession() {
  try {
    const { data: session, error } = await cloud.auth.getSession()
    if (error || !session) return null
    return session
  } catch (e) {
    return null
  }
}

// 微信一键登录：wx.login 拿 code → 云端换 WorkBuddy 会话
function wechatLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      async success({ code }) {
        try {
          const appid = wx.getAccountInfoSync().miniProgram.appId
          const { data: session, error } = await cloud.auth.signInWithWechat(code, appid)
          if (error) {
            reject(error)
            return
          }
          resolve(session)
        } catch (e) {
          reject(e)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

function signOut() {
  return cloud.auth.signOut()
}

module.exports = { ensureSession, wechatLogin, signOut }
