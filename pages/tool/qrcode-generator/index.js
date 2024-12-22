const { getPageShareConfig } = require('../../../utils/share');

Page({
  data: {
    inputText: '',
    qrCodeUrl: '',
    showQRCode: false,
    loading: false
  },

  // 输入文本变化处理
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 扫描二维码
  scanQRCode() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        this.setData({
          inputText: res.result,
          showQRCode: false
        });
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        // 用户取消扫码时不显示错误提示
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  },

  // 生成二维码
  generateQRCode() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 调用云函数生成二维码
    wx.cloud.callFunction({
      name: 'generateQRCode',
      data: {
        text: text
      }
    }).then(res => {
      if (res.result && res.result.fileID) {
        this.setData({
          qrCodeUrl: res.result.fileID,
          showQRCode: true
        });
      } else {
        throw new Error('生成二维码失败');
      }
    }).catch(err => {
      console.error('生成二维码失败:', err);
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 保存二维码到相册
  saveQRCode() {
    if (!this.data.qrCodeUrl) {
      return;
    }

    wx.showLoading({ title: '保存中...' });

    // 下载云存储图片
    wx.cloud.downloadFile({
      fileID: this.data.qrCodeUrl
    }).then(res => {
      return wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath
      });
    }).then(() => {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }).catch(err => {
      console.error('保存失败:', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/qrcode-generator/index');
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/tool/qrcode-generator/index');
  }
});
