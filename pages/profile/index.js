import { tools } from '../../config/tools'

Page({
  data: {
    profile: {
      isLogin: false,
      avatar: '',
      nickname: '',
      userId: ''
    },
    recentTools: []
  },

  onLoad() {
    this.checkLoginStatus()
    // 获取登录状态
    const profile = wx.getStorageSync('profile') || {
      isLogin: false,
      avatar: '',
      nickname: '',
      userId: ''
    }
    
    // 获取前三个工具
    console.log('工具列表:', tools)
    const recentTools = tools.slice(0, 3).map(tool => ({
      icon: tool.icon,
      name: tool.name,
      path: tool.path
    }))
    console.log('最近使用工具:', recentTools)
    
    this.setData({ 
      profile,
      recentTools
    })
  },

  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token')
      const profile = wx.getStorageSync('profile')
      if (token && profile) {
        this.setData({
          profile: {
            ...profile,
            isLogin: true
          }
        })
      }
    } catch (err) {
      console.error('检查登录状态失败:', err)
    }
  },

  async handleLogin() {
    if (this.data.profile.isLogin) return

    try {
      // 显示加载中
      wx.showLoading({
        title: '登录中...',
        mask: true
      })

      // 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善会员资料'
      }).catch(err => {
        console.error('获取用户信息失败:', err)
        throw new Error('获取用户信息失败')
      })

      // 这里应该调用后端接口，使用code换取token，目前模拟一个token
      const token = 'mock_token_' + Date.now()
      const profile = {
        isLogin: true,
        avatar: userInfo.avatarUrl,
        nickname: userInfo.nickName,
        userId: 'U' + Date.now().toString().slice(-6)
      }

      // 保存登录信息
      try {
        wx.setStorageSync('token', token)
        wx.setStorageSync('profile', profile)
      } catch (err) {
        console.error('保存登录信息失败:', err)
        throw new Error('保存登录信息失败')
      }

      // 更新页面状态
      this.setData({ profile })

      // 提示登录成功
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

    } catch (err) {
      // 显示错误提示
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      // 隐藏加载提示
      wx.hideLoading()
    }
  },

  // 复制用户ID
  copyUserId() {
    if (!this.data.profile.isLogin) return
    
    wx.setClipboardData({
      data: this.data.profile.userId,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 功能列表点击处理
  onFavoritesTap() {
    if (!this.data.profile.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  onCustomerServiceTap() {
    wx.previewImage({
      urls: ['/assets/images/wechat-qr.png'],
      fail() {
        wx.showModal({
          title: '添加微信',
          content: '请添加微信号进行咨询',
          confirmText: '复制微信号',
          success(res) {
            if (res.confirm) {
              wx.setClipboardData({
                data: 'ConardLi', // 替换为你的微信号
                success() {
                  wx.showToast({
                    title: '微信号已复制',
                    icon: 'success'
                  })
                }
              })
            }
          }
        })
      }
    })
  },

  onShareTap() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {
        wx.showToast({
          title: '请点击右上角分享',
          icon: 'none'
        })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: 'AI工具箱 - 你的智能生活助手',
      path: '/pages/home/index',
      imageUrl: '/assets/images/share-cover.png' // 分享封面图，可选
    }
  },

  onShareTimeline() {
    return {
      title: 'AI工具箱 - 你的智能生活助手',
      query: '',
      imageUrl: '/assets/images/share-cover.png' // 分享到朋友圈的封面图，可选
    }
  },

  onClearCacheTap() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理缓存吗？清理后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '清理成功',
                icon: 'success'
              })
              // 重置登录状态
              this.setData({
                profile: {
                  isLogin: false,
                  avatar: '',
                  nickname: '',
                  userId: ''
                }
              })
            }
          })
        }
      }
    })
  },

  onFeedbackTap() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  onMoreTap() {
    wx.switchTab({
      url: '/pages/category/index'
    })
  },

  onToolTap(e) {
    const { path } = e.currentTarget.dataset
    wx.navigateTo({ url: path })
  }
})
