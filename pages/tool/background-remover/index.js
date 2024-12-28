const { removeBackground } = require('../../../utils/302ai');
const { getPageShareConfig } = require('../../../utils/share');

Page({
  data: {
    imageUrl: '',
    processedImageUrl: '',
    isProcessing: false,
    imageInfo: {},
    processedImageInfo: {}
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: 'AI背景消除'
    });
    console.log('[background-remover] 页面加载');
    // 初始化云环境
    if (!wx.cloud) {
      console.error('[background-remover] 云开发未初始化');
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      });
      return;
    }
    wx.cloud.init({
      env: 'prod-5gyximjp6011b31b',
      traceUser: true
    });
  },

  // 选择图片
  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['original']
      });
      
      if (res && res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        await this.setImageData(tempFilePath);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      wx.showToast({
        title: '选择图片失败',
        icon: 'error'
      });
    }
  },

  // 设置图片数据
  async setImageData(tempFilePath) {
    try {
      // 获取图片信息
      const imageInfo = await wx.getImageInfo({
        src: tempFilePath
      });

      this.setData({
        imageUrl: tempFilePath,
        imageInfo: {
          width: imageInfo.width,
          height: imageInfo.height,
          type: imageInfo.type.toLowerCase()
        },
        processedImageUrl: '' // 清空之前的处理结果
      });
    } catch (error) {
      console.error('设置图片数据失败:', error);
      wx.showToast({
        title: '图片加载失败',
        icon: 'error'
      });
    }
  },

  // 处理图片
  async processImage() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });
    console.log('[processImage] 开始处理图片:', this.data.imageUrl);

    try {
      // 上传图片到临时服务器
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `background-remover/${Date.now()}-${Math.random().toString(36).slice(2)}.${this.data.imageInfo.type}`,
        filePath: this.data.imageUrl
      });

      if (!uploadResult.fileID) {
        throw new Error('图片上传失败');
      }

      // 获取临时链接
      const tempUrlResult = await wx.cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      });

      if (!tempUrlResult.fileList?.[0]?.tempFileURL) {
        throw new Error('获取图片链接失败');
      }

      const imageUrl = tempUrlResult.fileList[0].tempFileURL;
      console.log('[processImage] 获取临时链接:', imageUrl);

      // 调用背景消除API
      const processedImage = await removeBackground(imageUrl);
      console.log('[processImage] 获取处理结果:', processedImage);

      // 下载处理后的图片
      console.log('[processImage] 开始下载图片:', processedImage.url);
      const downloadRes = await new Promise((resolve, reject) => {
        const downloadTask = wx.downloadFile({
          url: processedImage.url,
          success: (res) => {
            console.log('[processImage] 下载成功:', res);
            resolve(res);
          },
          fail: (error) => {
            console.error('[processImage] 下载失败:', error);
            reject(new Error('下载处理后的图片失败: ' + error.errMsg));
          }
        });

        // 监听下载进度
        downloadTask.onProgressUpdate((res) => {
          console.log('[processImage] 下载进度:', res.progress);
        });
      });

      if (downloadRes.statusCode !== 200) {
        console.log(downloadRes);
        throw new Error('下载处理后的图片失败');
      }

      this.setData({
        processedImageUrl: downloadRes.tempFilePath,
        processedImageInfo: {
          width: processedImage.width,
          height: processedImage.height,
          type: processedImage.content_type.split('/')[1]
        }
      });

      // 删除云存储中的临时文件
      try {
        await wx.cloud.deleteFile({
          fileList: [uploadResult.fileID]
        });
      } catch (error) {
        console.error('删除临时文件失败:', error);
      }
    } catch (error) {
      console.error('[processImage] 处理失败:', error);
      wx.showToast({
        title: error.message || '处理失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  // 保存图片
  async saveImage() {
    if (!this.data.processedImageUrl) {
      wx.showToast({
        title: '请先处理图片',
        icon: 'none'
      });
      return;
    }

    try {
      await wx.saveImageToPhotosAlbum({
        filePath: this.data.processedImageUrl
      });
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存图片失败:', error);
      if (error.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '提示',
          content: '需要您授权保存图片到相册',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
      }
    }
  },

  // 预览图片
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    
    wx.previewImage({
      urls: [src],
      current: src
    });
  },

  // 分享小程序
  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/background-remover/index');
  },

  // 分享到朋友圈
  onShareTimeline() {
    return getPageShareConfig('/pages/tool/background-remover/index');
  }
});
