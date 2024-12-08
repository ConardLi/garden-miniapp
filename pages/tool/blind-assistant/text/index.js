const { textToSpeech, stopCurrentAudio } = require('../../../../utils/tts');
const { analyzeImage } = require('../../../../utils/vision');

const TEXT_PROMPT = `背景：
你是一个专为视障人士设计的AI助手，通过分析摄像头捕捉到的图像，提供详细的文字识别结果，帮助他们阅读各种文本内容。

任务：

文字识别：
1. 按照文字在图片中的位置顺序（从上到下、从左到右）识别所有文字。
2. 保持原文的段落和换行格式，使语音播报更自然。
3. 如果存在多种语言混排，请标注每段文字的语言类型。
4. 识别并说明特殊格式，如标题、列表、表格等。
5. 对于模糊或难以辨认的文字，请说明并尽可能推测内容。

场景识别：
1. 识别文字所在的载体类型，如书籍、标牌、屏幕等。
2. 描述文字的排版特点，如字体大小、颜色等重要特征。

示例描述：
"这是一本书的标题页，标题为'人工智能导论'，下方是作者名字'张三'。正文部分共有三段，第一段讨论AI的定义..."

注意事项：
1. 描述要简洁明了，避免冗长。
2. 优先识别重要信息，如标题、关键词等。
3. 使用清晰的语言结构，便于听者理解。
4. 对于数字、符号等特殊字符要准确读出。`;

Page({
  data: {
    showCamera: true,
    imageBase64: '',
    imagePath: '',
    displayText: '',
    analyzing: false,
    isIOS: false
  },

  onLoad() {
    // 检查是否是iOS设备
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      showCamera: true,
      isIOS: systemInfo.platform === 'ios'
    });
  },

  // 打开相机
  startCapture() {
    this.setData({ showCamera: true });
  },

  // 关闭相机
  closeCamera() {
    stopCurrentAudio();
    this.setData({
      showCamera: false
    });
    wx.navigateBack();
  },

  // 处理拍照结果
  async handleCapture(e) {
    console.log('收到拍照事件:', e.detail);
    
    try {
      // 停止当前播放的音频
      stopCurrentAudio();
      
      const { base64, tempPath } = e.detail;
      console.log('图片临时路径:', tempPath);
      
      this.setData({
        imageBase64: base64,
        imagePath: tempPath,
        analyzing: true,
        displayText: '正在识别文字...'
      });

      console.log('开始调用智谱AI...');
      // 调用图像识别，传入特定的 prompt
      const description = await analyzeImage(base64, TEXT_PROMPT);
      console.log('智谱AI返回结果:', description);
      
      this.setData({
        displayText: description,
        analyzing: false
      });

      // 播放识别结果
      console.log('开始播放语音...');
      await textToSpeech(description);
      
    } catch (error) {
      console.error('处理图片失败:', error);
      this.setData({
        displayText: '抱歉，文字识别失败，请重试',
        analyzing: false
      });
      
      // 播放错误提示
      await textToSpeech('抱歉，文字识别失败，请重试');
    }
  },

  onUnload() {
    // 页面卸载时停止播放
    stopCurrentAudio();
  }
});
