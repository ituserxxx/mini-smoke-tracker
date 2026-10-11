// 云客户端初始化（微信小程序形态）
// 仅使用 publicConfig 中的公开字段，切勿在此写入任何密钥。
const { createMiniProgramWorkBuddyCloud } = require('@tencent-ai/workbuddy-cloud-sdk/miniprogram')
const { createDiagnosticWx } = require('./workbuddy-cloud-diagnostics')

const publicConfig = {
  endpoint: 'https://mp-api.app.workbuddy.host',
  publishableKey: 'wbpk_kyCkydV2gRTe9izA7MfcNa_k7A3ioHlxyXkAQcJ6ABRA3iNS5Kddtsa'
}

const cloud = createMiniProgramWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  publishableKey: publicConfig.publishableKey,
  // 包裹全局 wx，使失败的云请求在手机 vConsole 可见
  wx: createDiagnosticWx(wx)
})

module.exports = { cloud, publicConfig }
