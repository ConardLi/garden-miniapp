const { doubao } = require('../../../utils/302ai');
const { getPageShareConfig } = require('../../../utils/share');

// 支持的语言列表
const LANGUAGES = [
  { code: 'auto', name: '自动检测' },
  { code: 'en', name: '英语' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'ru', name: '俄语' },
  { code: 'es', name: '西班牙语' },
  { code: 'it', name: '意大利语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'hi', name: '印地语' },
  { code: 'bn', name: '孟加拉语' },
  { code: 'tr', name: '土耳其语' },
  { code: 'th', name: '泰语' },
  { code: 'id', name: '印尼语' },
  { code: 'ms', name: '马来语' },
  { code: 'vi', name: '越南语' },
  { code: 'tl', name: '菲律宾语' }
];

// 目标语言列表（排除自动检测）
const TARGET_LANGUAGES = LANGUAGES.filter(lang => lang.code !== 'auto');

Page({
  data: {
    inputText: '',
    translatedText: '',
    languages: LANGUAGES,
    targetLanguages: TARGET_LANGUAGES,
    sourceLanguageIndex: 0,
    targetLanguageIndex: 0,
    loading: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: 'AI翻译助手'
    });
  },

  // 输入文本变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 选择源语言
  onSourceLanguageChange(e) {
    this.setData({
      sourceLanguageIndex: e.detail.value
    });
  },

  // 选择目标语言
  onTargetLanguageChange(e) {
    this.setData({
      targetLanguageIndex: e.detail.value
    });
  },

  // 执行翻译
  async translate() {
    if (!this.data.inputText) {
      wx.showToast({
        title: '请输入要翻译的文本',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const sourceLang = LANGUAGES[this.data.sourceLanguageIndex];
      const targetLang = TARGET_LANGUAGES[this.data.targetLanguageIndex];
      const prompt = `请将以下${sourceLang.code !== 'auto' ? sourceLang.name : ''}文本翻译成${targetLang.name}，要求翻译准确、专业、地道、不要输出翻译之外的任何多余文字：\n${this.data.inputText}`;
      
      const response = await doubao(prompt);
      
      if (response && response.choices && response.choices[0]) {
        this.setData({
          translatedText: response.choices[0].message.content.trim()
        });
      } else {
        throw new Error('翻译失败');
      }
    } catch (error) {
      console.error('翻译失败:', error);
      wx.showToast({
        title: '翻译失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 复制翻译结果
  copyResult() {
    if (!this.data.translatedText) return;
    
    wx.setClipboardData({
      data: this.data.translatedText,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 分享当前页面
  onShareAppMessage() {
    return {
      title: '快来试试这个超准的AI翻译工具',
      path: '/pages/tool/translator/index'
    };
  },

  onShareTimeline() {
    return {
      title: '快来试试这个超准的AI翻译工具'
    };
  },

  // 添加处理函数
  handleVoiceClick() {
    wx.showToast({
      title: '功能开发中...',
      icon: 'none',
      duration: 2000
    })
  }
});
