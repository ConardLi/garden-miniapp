const { getPageShareConfig } = require('../../../utils/share');

// 预设裁剪比例
const CROP_SCALES = [
  { id: 'free', name: '自由裁剪', value: 'none', icon: '↔️' },
  { id: '1-1', name: '1:1 正方形', value: '1:1', icon: '⬛', desc: '头像、Logo' },
  { id: '4-3', name: '4:3 横向', value: '4:3', icon: '🖼️', desc: '横版照片' },
  { id: '3-4', name: '3:4 竖向', value: '3:4', icon: '📱', desc: '竖版照片' },
  { id: '16-9', name: '16:9 宽屏', value: '16:9', icon: '🖥️', desc: '电脑屏幕' },
  { id: '9-16', name: '9:16 全屏', value: '9:16', icon: '📲', desc: '手机屏幕' },
  { id: '5-4', name: '5:4 照片', value: '5:4', icon: '📸', desc: '经典照片' },
  { id: '4-5', name: '4:5 证件', value: '4:5', icon: '🎫', desc: '证件照片' }
];

// 格式化文件大小
function formatFileSize(size) {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + 'KB';
  } else {
    return (size / 1024 / 1024).toFixed(1) + 'MB';
  }
}

Page({
  data: {
    imagePath: '',
    croppedImagePath: '',
    isProcessing: false,
    cropScales: CROP_SCALES,
    selectedScale: CROP_SCALES[0],
    // 图片信息
    originalInfo: null,
    croppedInfo: null
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片裁剪'
    });
  },

  // 获取图片信息
  async getImageInfo(path) {
    try {
      const info = await wx.getImageInfo({
        src: path
      });
      const stats = await wx.getFileInfo({
        filePath: path
      });
      return {
        width: info.width,
        height: info.height,
        size: formatFileSize(stats.size),
        orientation: info.orientation,
        type: info.type
      };
    } catch (error) {
      console.error('获取图片信息失败:', error);
      return null;
    }
  },

  // 选择裁剪比例
  selectScale(e) {
    const { id } = e.currentTarget.dataset;
    const selectedScale = this.data.cropScales.find(scale => scale.id === id);
    
    if (selectedScale) {
      this.setData({ selectedScale });
      
      // 如果已经有图片，则重新打开裁剪器
      if (this.data.imagePath) {
        this.cropImage(this.data.imagePath);
      }
    }
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
        // 获取原图信息
        const originalInfo = await this.getImageInfo(tempFilePath);
        this.setData({ originalInfo });
        // 直接打开裁剪界面
        this.cropImage(tempFilePath);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      wx.showToast({
        title: '选择图片失败',
        icon: 'error'
      });
    }
  },

  // 裁剪图片
  async cropImage(imagePath) {
    try {
      this.setData({ isProcessing: true });
      
      const options = {
        src: imagePath,
        success: async (result) => {
          console.log('裁剪成功:', result);
          // 获取裁剪后的图片信息
          const croppedInfo = await this.getImageInfo(result.tempFilePath);
          this.setData({
            imagePath: imagePath,
            croppedImagePath: result.tempFilePath,
            croppedInfo
          });
        },
        fail: (error) => {
          console.error('裁剪失败:', error);
          wx.showToast({
            title: '裁剪失败',
            icon: 'error'
          });
        }
      };

      // 如果不是自由裁剪，则添加比例限制
      if (this.data.selectedScale.value !== 'none') {
        options.cropScale = this.data.selectedScale.value;
      }

      // 打开裁剪界面
      wx.cropImage(options);
    } catch (error) {
      console.error('裁剪图片失败:', error);
      wx.showToast({
        title: '裁剪失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  // 保存图片
  async saveImage() {
    if (!this.data.croppedImagePath) {
      wx.showToast({
        title: '请先裁剪图片',
        icon: 'none'
      });
      return;
    }

    try {
      await wx.saveImageToPhotosAlbum({
        filePath: this.data.croppedImagePath
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

  // 重新选择
  reset() {
    this.setData({
      imagePath: '',
      croppedImagePath: '',
      originalInfo: null,
      croppedInfo: null
    });
    this.chooseImage();
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

  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/image-crop/index');
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/tool/image-crop/index');
  }
});
