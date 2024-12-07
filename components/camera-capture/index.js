Component({
  properties: {
    // 是否显示相机
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 设备位置，back后置，front前置
    devicePosition: 'back',
    // 闪光灯，auto自动，on开启，off关闭
    flash: 'off'
  },

  methods: {
    // 拍照
    takePhoto() {
      const ctx = wx.createCameraContext();
      ctx.takePhoto({
        quality: 'high',
        success: (res) => {
          // 读取图片base64
          wx.getFileSystemManager().readFile({
            filePath: res.tempImagePath,
            encoding: 'base64',
            success: (base64Res) => {
              this.triggerEvent('capture', {
                base64: base64Res.data,
                tempPath: res.tempImagePath
              });
            },
            fail: (error) => {
              wx.showToast({
                title: '图片读取失败',
                icon: 'none'
              });
              console.error('Read base64 failed:', error);
            }
          });
        },
        fail: (error) => {
          wx.showToast({
            title: '拍照失败',
            icon: 'none'
          });
          console.error('Take photo failed:', error);
        }
      });
    },

    // 切换前后摄像头
    togglePosition() {
      this.setData({
        devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
      });
    },

    // 切换闪光灯
    toggleFlash() {
      const flashModes = ['auto', 'on', 'off'];
      const currentIndex = flashModes.indexOf(this.data.flash);
      const nextIndex = (currentIndex + 1) % flashModes.length;
      this.setData({
        flash: flashModes[nextIndex]
      });
    },

    // 关闭相机
    onClose() {
      this.triggerEvent('close');
    },

    // 相机初始化成功
    onInitDone(e) {
      console.log('Camera initialized:', e);
    },

    // 相机错误
    onError(e) {
      wx.showToast({
        title: '相机启动失败',
        icon: 'none'
      });
      console.error('Camera error:', e);
    }
  }
});
