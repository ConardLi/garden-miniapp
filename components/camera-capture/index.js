Component({
  properties: {
    // 是否显示相机
    show: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this.checkCameraAuth();
        }
      }
    }
  },

  data: {
    // 设备位置，back后置，front前置
    devicePosition: 'back',
    // 闪光灯，auto自动，on开启，off关闭
    flash: 'off',
    // 相机是否就绪
    cameraReady: false
  },

  methods: {
    // 检查相机权限
    async checkCameraAuth() {
      const app = getApp();
      try {
        const { authSetting } = await wx.getSetting();
        if (authSetting['scope.camera'] === false) {
          app.log.warn('Camera permission denied');
          wx.showModal({
            title: '提示',
            content: '请授权相机权限以使用拍照功能',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              } else {
                this.triggerEvent('close');
              }
            }
          });
          return false;
        }
        if (authSetting['scope.camera'] === undefined) {
          return new Promise((resolve) => {
            wx.authorize({
              scope: 'scope.camera',
              success: () => {
                app.log.info('Camera permission granted');
                resolve(true);
              },
              fail: (err) => {
                app.log.error('Camera authorization failed:', err);
                this.triggerEvent('close');
                resolve(false);
              }
            });
          });
        }
        return true;
      } catch (err) {
        app.log.error('Check camera auth failed:', err);
        return false;
      }
    },

    // 拍照
    takePhoto() {
      const app = getApp();
      if (!this.data.cameraReady) {
        app.log.warn('Camera not ready when taking photo');
        wx.showToast({
          title: '相机未就绪',
          icon: 'none'
        });
        return;
      }

      const ctx = wx.createCameraContext();
      app.log.info('Taking photo...');
      ctx.takePhoto({
        quality: 'high',
        success: (res) => {
          app.log.info('Photo taken successfully');
          wx.getFileSystemManager().readFile({
            filePath: res.tempImagePath,
            encoding: 'base64',
            success: (base64Res) => {
              app.log.info('Photo converted to base64 successfully');
              this.triggerEvent('capture', {
                base64: base64Res.data,
                tempPath: res.tempImagePath
              });
            },
            fail: (error) => {
              app.log.error('Read base64 failed:', error);
              wx.showToast({
                title: '图片读取失败',
                icon: 'none'
              });
            }
          });
        },
        fail: (error) => {
          app.log.error('Take photo failed:', error);
          wx.showToast({
            title: '拍照失败',
            icon: 'none'
          });
        }
      });
    },

    // 切换前后摄像头
    togglePosition() {
      const app = getApp();
      const newPosition = this.data.devicePosition === 'back' ? 'front' : 'back';
      app.log.info('Switching camera position to:', newPosition);
      this.setData({
        devicePosition: newPosition
      });
    },

    // 切换闪光灯
    toggleFlash() {
      const app = getApp();
      const flashModes = ['auto', 'on', 'off'];
      const currentIndex = flashModes.indexOf(this.data.flash);
      const nextIndex = (currentIndex + 1) % flashModes.length;
      const newMode = flashModes[nextIndex];
      app.log.info('Switching flash mode to:', newMode);
      this.setData({
        flash: newMode
      });
    },

    // 关闭相机
    onClose() {
      const app = getApp();
      app.log.info('Camera closing');
      this.setData({
        cameraReady: false
      });
      this.triggerEvent('close');
    },

    // 相机初始化成功
    onInitDone(e) {
      const app = getApp();
      app.log.info('Camera initialized:', {
        ...e.detail,
        maxZoom: e.detail?.maxZoom,
        direction: this.data.devicePosition,
        flash: this.data.flash
      });
      this.setData({
        cameraReady: true
      });
    },

    // 相机错误
    onError(e) {
      const app = getApp();
      // 获取设备信息
      const systemInfo = wx.getSystemInfoSync();

      // 记录详细错误信息
      app.log.error('Camera error:', {
        error: e.detail,
        deviceInfo: {
          brand: systemInfo.brand,
          model: systemInfo.model,
          system: systemInfo.system,
          platform: systemInfo.platform,
          SDKVersion: systemInfo.SDKVersion
        },
        cameraState: {
          position: this.data.devicePosition,
          flash: this.data.flash,
          isReady: this.data.cameraReady
        }
      });

      wx.showModal({
        title: '相机启动失败',
        content: '请检查相机权限或重启小程序后重试' + String(e),
        showCancel: false,
        success: () => {
          this.triggerEvent('close');
        }
      });
    }
  }
});
