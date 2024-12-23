const { seededit } = require('../../../utils/302ai');
const { getPageShareConfig } = require('../../../utils/share');

// 预设表情列表
const EXPRESSIONS = [
  { id: 'smile', name: '微笑', prompt: '让他/她露出温暖自然的微笑' },
  { id: 'happy', name: '开心', prompt: '让他/她开心地大笑' },
  { id: 'angry', name: '生气', prompt: '让他/她生气的表情' },
  { id: 'sad', name: '伤心', prompt: '让他/她露出伤心的表情' },
  { id: 'surprised', name: '惊讶', prompt: '让他/她露出惊讶的表情' },
  { id: 'cute', name: '可爱', prompt: '让他/她露出可爱的表情' },
  { id: 'proud', name: '得意', prompt: '让他/她露出得意的表情' },
  { id: 'shy', name: '害羞', prompt: '让他/她露出害羞的表情' },
  { id: 'serious', name: '严肃', prompt: '让他/她露出严肃的表情' },
  { id: 'confused', name: '困惑', prompt: '让他/她露出困惑的表情' },
  { id: 'sleepy', name: '困倦', prompt: '让他/她露出困倦的表情' },
  { id: 'excited', name: '兴奋', prompt: '让他/她露出兴奋的表情' }
];

// 负面提示词
const NEGATIVE_PROMPT = '模糊,扭曲,变形,不自然,畸形,低质量';

// 图片大小限制（10MB）
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

Page({
  data: {
    expressions: EXPRESSIONS,
    selectedExpression: null,
    imagePath: '',
    editedImageUrl: '',
    loading: false,
    showResult: false,
    editFailed: false,
    scale: 0.5,
    imageSize: 0,
    errorMessage: '',
    isCustom: false,
    customPrompt: ''
  },

  onLoad() {
    console.log('[expression-editor] 页面加载');
    // 初始化云环境
    if (!wx.cloud) {
      console.error('[expression-editor] 云开发未初始化');
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      });
      return;
    }
    wx.cloud.init({
      env: 'prod-7gqu88z1ce47ca43',
      traceUser: true
    });
  },

  // 选择图片
  async chooseImage() {
    console.log('[expression-editor] 开始选择图片');

    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          camera: 'back',
          sizeType: ['compressed'],
          success: resolve,
          fail: reject
        });
      });

      console.log('[expression-editor] 选择图片结果:', res);

      if (!res.tempFiles || !res.tempFiles[0]) {
        throw new Error('未选择图片');
      }

      const tempFilePath = res.tempFiles[0].tempFilePath;
      const size = res.tempFiles[0].size;

      // 检查图片大小
      if (size > MAX_IMAGE_SIZE) {
        wx.showToast({
          title: '图片太大，请选择较小的图片',
          icon: 'none'
        });
        return;
      }

      // 检查图片是否可访问
      try {
        await new Promise((resolve, reject) => {
          // 先清除原有图片
          this.setData({ 
            imagePath: '',
            imageSize: 0
          }, async () => {
            try {
              const imageInfo = await new Promise((resolve, reject) => {
                wx.getImageInfo({
                  src: tempFilePath,
                  success: resolve,
                  fail: reject
                });
              });
              
              console.log('[expression-editor] 图片信息:', imageInfo);
              
              // 确认图片可以访问后再设置
              this.setData({ 
                imagePath: tempFilePath,
                imageSize: size,
                editedImageUrl: '',
                showResult: false,
                editFailed: false,
                errorMessage: ''
              }, () => {
                console.log('[expression-editor] 图片已设置:', {
                  path: tempFilePath,
                  size: size
                });
              });
              
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error('[expression-editor] 图片无法访问:', error);
        wx.showToast({
          title: '图片无法访问，请重新选择',
          icon: 'none'
        });
        return;
      }

    } catch (error) {
      console.error('[expression-editor] 选择图片失败:', error);
      wx.showToast({
        title: error.errMsg || '选择图片失败',
        icon: 'none'
      });
    }
  },

  // 切换自定义输入
  toggleCustom() {
    const isCustom = !this.data.isCustom;
    this.setData({
      isCustom,
      selectedExpression: isCustom ? { 
        id: 'custom',
        name: '自定义',
        prompt: this.data.customPrompt || ''
      } : null
    });
  },

  // 更新自定义提示词
  updateCustomPrompt(e) {
    const customPrompt = e.detail.value;
    this.setData({
      customPrompt,
      selectedExpression: {
        id: 'custom',
        name: '自定义',
        prompt: customPrompt
      }
    });
  },

  // 选择表情
  selectExpression(e) {
    const { id } = e.currentTarget.dataset;
    const expression = this.data.expressions.find(exp => exp.id === id);
    console.log('[expression-editor] 选择表情:', expression);
    this.setData({ 
      selectedExpression: expression,
      isCustom: false 
    });
  },

  // 调整编辑强度
  adjustScale(e) {
    const scale = e.detail.value;
    console.log('[expression-editor] 调整编辑强度:', scale);
    this.setData({ scale });
  },

  // 开始编辑
  async startEdit() {
    console.log('[expression-editor] 开始编辑');

    if (!this.data.imagePath || !this.data.selectedExpression) {
      wx.showToast({
        title: '请先选择图片和表情',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      loading: true, 
      editFailed: false,
      errorMessage: ''
    });

    try {
      wx.showLoading({ 
        title: '正在编辑...',
        mask: true
      });

      // 上传图片到临时服务器
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `expression-editor/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        filePath: this.data.imagePath
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
      console.log('[expression-editor] 获取临时链接:', imageUrl);

      // 调用编辑API
      const result = await seededit(
        [imageUrl],
        this.data.selectedExpression.prompt,
        {
          scale: this.data.scale,
          negative_prompt: NEGATIVE_PROMPT,
          logo_info: {
            add_logo: false
          }
        }
      );

      console.log('[expression-editor] 编辑结果:', result);

      if (result.data?.image_urls?.[0]) {
        this.setData({
          editedImageUrl: result.data.image_urls[0],
          showResult: true
        });

        // 删除临时文件
        wx.cloud.deleteFile({
          fileList: [uploadResult.fileID]
        }).catch(error => {
          console.error('[expression-editor] 删除临时文件失败:', error);
        });
      } else {
        throw new Error(result.message || '图片编辑失败');
      }

    } catch (error) {
      console.error('[expression-editor] 编辑失败:', error);
      this.setData({ 
        editFailed: true,
        errorMessage: error.message || '编辑失败，请重试'
      });
      wx.showToast({
        title: error.message || '编辑失败，请重试',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 预览图片
  previewImage(e) {
    const { type } = e.currentTarget.dataset;
    const current = type === 'original' ? this.data.imagePath : this.data.editedImageUrl;
    
    if (!current) {
      console.warn('[expression-editor] 预览图片失败: 图片路径为空');
      return;
    }

    console.log('[expression-editor] 预览图片:', {
      type,
      current
    });
    
    wx.previewImage({
      urls: [this.data.imagePath, this.data.editedImageUrl].filter(Boolean),
      current
    });
  },

  // 保存图片
  async saveImage() {
    console.log('[expression-editor] 开始保存图片');

    if (!this.data.editedImageUrl) {
      console.warn('[expression-editor] 保存失败: 没有可保存的图片');
      return;
    }
    
    wx.showLoading({ 
      title: '保存中...',
      mask: true
    });
    
    try {
      // 下载图片
      console.log('[expression-editor] 下载图片:', this.data.editedImageUrl);
      const res = await new Promise((resolve, reject) => {
        wx.downloadFile({
          url: this.data.editedImageUrl,
          success: resolve,
          fail: reject
        });
      });

      // 保存到相册
      console.log('[expression-editor] 保存到相册:', res.tempFilePath);
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: resolve,
          fail: reject
        });
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('[expression-editor] 保存失败:', error);
      wx.showToast({
        title: error.errMsg || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 重新编辑
  reset() {
    console.log('[expression-editor] 重置编辑器');
    this.setData({
      editedImageUrl: '',
      showResult: false,
      editFailed: false,
      selectedExpression: null,
      errorMessage: ''
    });
  },

  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/expression-editor/index');
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/tool/expression-editor/index');
  }
});
