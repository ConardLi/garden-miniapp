const app = getApp();
const { analyzeImage } = require('../../../utils/vision');
const { getPageShareConfig } = require('../../../utils/share');

const RECOGNITION_PROMPT = `
# 角色
你是一位智能的图像文字识别助手，专注于高效识别和提取给定图像中的文字。

## 技能
### 技能1：文字识别
- 在提供图像时，使用先进的图像处理技术识别并提取图像中的文字。
- 确保文字提取过程的高准确性和清晰度。

### 技能2：语言支持
- 识别并支持多种语言的文字识别。
- 自动检测图像中文字的语言，并提供准确的提取。

## 限制：
- 只返回图片里的文字，不要返回其他任何描述内容
- 只返回图片里的文字，不要返回其他任何描述内容
- 只返回图片里的文字，不要返回其他任何描述内容
`;

Page({
  data: {
    text: '', // 存储识别到的文本
    showResult: false,
    loading: false,
    noText: false,
    imagePath: ''
  },

  // 开始拍照或选择图片
  startCapture() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('选择的图片信息:', res.tempFiles[0]);
        
        this.setData({ 
          loading: true,
          showResult: true,
          imagePath: tempFilePath,
          noText: false,
          text: ''
        });
        
        try {
          // 获取文件信息
          const fileInfo = await new Promise((resolve, reject) => {
            wx.getFileInfo({
              filePath: tempFilePath,
              digestAlgorithm: 'md5',
              success: res => {
                console.log('文件信息详情:', res);
                resolve(res);
              },
              fail: err => {
                console.error('获取文件信息失败:', err);
                reject(err);
              }
            });
          });

          // 检查文件大小
          if (fileInfo.size > 10 * 1024 * 1024) { // 大于10MB
            wx.showToast({
              title: '图片太大，请选择较小的图片',
              icon: 'none'
            });
            this.setData({ loading: false });
            return;
          }

          // 读取图片文件为 base64
          const base64Image = await new Promise((resolve, reject) => {
            wx.getFileSystemManager().readFile({
              filePath: tempFilePath,
              encoding: 'base64',
              success: res => {
                resolve(res.data);
              },
              fail: err => {
                console.error('读取图片失败:', err);
                reject(err);
              }
            });
          });

          // 调用识别API
          const result = await analyzeImage(base64Image, RECOGNITION_PROMPT);
          console.log('识别结果:', result);

          if (result.error) {
            throw new Error(result.error);
          }

          this.setData({
            text: result,
            loading: false
          });

        } catch (error) {
          console.error('识别失败:', error);
          wx.showToast({
            title: '识别失败，请重试',
            icon: 'none'
          });
          this.setData({ 
            loading: false,
            noText: true
          });
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  // 复制文本
  copyText() {
    if (this.data.text) {
      wx.setClipboardData({
        data: this.data.text,
        success: () => {
          wx.showToast({
            title: '文本已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 重新拍照
  retake() {
    this.setData({
      showResult: false,
      loading: false,
      noText: false,
      text: '',
      imagePath: ''
    });
  },

  // 返回首页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果返回失败，说明没有上一页，直接跳转到首页
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    });
  },

  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/text-recognition/index');
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/tool/text-recognition/index');
  }
});
