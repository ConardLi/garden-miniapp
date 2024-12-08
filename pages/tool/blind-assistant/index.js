const { getPageShareConfig } = require('../../../utils/share');

Page({
  data: {
    // 页面数据
    showSettings: false,
    voiceSpeed: 1,
    voiceVolume: 80,
    sensitivity: 5,
    contacts: [
      { name: '紧急联系人1', phone: '13800138000' }
    ]
  },

  onLoad(options) {
    // 页面加载时执行
  },

  onReady() {
    // 页面初次渲染完成时执行
  },

  onShow() {
    // 页面显示时执行
  },

  // 切换设置界面
  toggleSettings() {
    this.setData({
      showSettings: !this.data.showSettings
    });
  },

  // 启动环境描述
  onStartEnvironment() {
    wx.navigateTo({
      url: '/pages/tool/blind-assistant/environment/index'
    });
  },

  // 启动导航辅助
  onStartNavigation() {
    wx.navigateTo({
      url: '/pages/tool/blind-assistant/navigation/index'
    });
  },

  // 启动物品识别
  onStartObjectDetection() {
    wx.navigateTo({
      url: '/pages/tool/blind-assistant/object/index'
    });
  },

  // 启动文字识别
  onStartTextRecognition() {
    wx.navigateTo({
      url: '/pages/tool/blind-assistant/text/index'
    });
  },

  // 语音速度变化
  onVoiceSpeedChange(e) {
    this.setData({
      voiceSpeed: e.detail.value
    });
  },

  // 语音音量变化
  onVoiceVolumeChange(e) {
    this.setData({
      voiceVolume: e.detail.value
    });
  },

  // 敏感度变化
  onSensitivityChange(e) {
    this.setData({
      sensitivity: e.detail.value
    });
  },

  // 添加联系人
  addContact() {
    wx.showModal({
      title: '添加联系人',
      content: '该功能开发中',
      showCancel: false
    });
  },

  // 删除联系人
  deleteContact(e) {
    const index = e.currentTarget.dataset.index;
    const contacts = [...this.data.contacts];
    contacts.splice(index, 1);
    this.setData({ contacts });
  },

  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/blind-assistant/index')
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/tool/blind-assistant/index')
  }
});
