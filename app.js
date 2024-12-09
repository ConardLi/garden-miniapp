// app.js
const log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (log) {
      log.info('App onLaunch')
      // 打印基础库版本号
      log.info('SDKVersion:', wx.getSystemInfoSync().SDKVersion)
    }

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (log) {
          log.info('Login success, code:', res.code)
        }
      },
      fail: err => {
        if (log) {
          log.error('Login failed:', err)
        }
      }
    })
  },

  // 封装日志方法，方便全局调用
  log: {
    info() {
      if (log) {
        log.info.apply(log, arguments)
      }
    },
    warn() {
      if (log) {
        log.warn.apply(log, arguments)
      }
    },
    error() {
      if (log) {
        log.error.apply(log, arguments)
      }
    },
    setFilterMsg(msg) { // 从基础库2.7.3开始支持
      if (log && log.setFilterMsg) {
        if (typeof msg === 'string') {
          log.setFilterMsg(msg)
        }
      }
    },
    addFilterMsg(msg) { // 从基础库2.8.1开始支持
      if (log && log.addFilterMsg) {
        if (typeof msg === 'string') {
          log.addFilterMsg(msg)
        }
      }
    }
  },

  globalData: {
    userInfo: null
  }
})
