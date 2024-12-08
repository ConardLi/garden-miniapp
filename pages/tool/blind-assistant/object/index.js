const { textToSpeech, stopCurrentAudio } = require('../../../../utils/tts');
const { analyzeImage } = require('../../../../utils/vision');
const { getPageShareConfig } = require('../../../../utils/share');

const OBJECT_PROMPT = `背景：
你是一个专为视障人士设计的物品识别助手，负责准确识别和描述拍摄物品的关键特征。

任务：
1. 物品基本信息：
- 准确识别物品的类别和名称
- 描述物品的大小、形状、颜色等基本特征
- 说明物品的材质和质地（如金属、塑料、木质等）

2. 物品状态：
- 描述物品的当前状态（如新旧程度、完整性）
- 识别物品是否有损坏或异常
- 说明物品是否处于正常使用状态

3. 使用安全：
- 提示物品的潜在危险（如尖锐边缘、烫手等）
- 识别易碎或需要小心处理的部分
- 说明正确的拿取或使用方式

4. 功能识别：
- 识别物品的按钮、开关、接口等功能部件
- 描述这些功能部件的位置和用途
- 提供简单的操作建议

5. 方位指引：
- 使用准确的方位词描述物品各部分的位置
- 提供触摸参考点，帮助定位关键部位
- 描述物品的朝向和摆放位置

请用简洁的语言描述，优先级：
1. 安全警示（如有）
2. 物品名称和基本特征
3. 功能部件位置和使用提示

示例：
"这是一个陶瓷茶杯，约10厘米高，杯身温热。把手在右侧，杯口略有缺口，请小心。杯中可能有热饮，建议双手扶持杯身拿取。"`;

Page({
  data: {
    showCamera: true,
    imageBase64: '',
    imagePath: '',
    displayText: '',
    analyzing: false
  },

  onLoad() {
    // 检查是否是iOS设备
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      showCamera: true,
      isIOS: systemInfo.platform === 'ios'
    });
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
        displayText: '正在识别物品...'
      });

      console.log('开始调用智谱AI...');
      // 调用图像识别，传入物品识别特定的 prompt
      const description = await analyzeImage(base64, OBJECT_PROMPT);
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
        displayText: '抱歉，物品识别失败，请重试',
        analyzing: false
      });
      
      // 播放错误提示
      await textToSpeech('抱歉，物品识别失败，请重试');
    }
  },

  // 关闭相机并返回上一页
  closeCamera() {
    stopCurrentAudio();
    this.setData({
      showCamera: false
    });
    wx.navigateBack();
  },

  onUnload() {
    // 页面卸载时停止播放
    stopCurrentAudio();
  },

  onShareAppMessage() {
    return {
      ...getPageShareConfig('/pages/tool/blind-assistant/object/index'),
      title: '物品识别 - AI视觉助手'
    }
  },

  onShareTimeline() {
    return {
      ...getPageShareConfig('/pages/tool/blind-assistant/object/index'),
      title: '物品识别 - AI视觉助手'
    }
  }
});
