const { textToSpeech, stopCurrentAudio } = require('../../../../utils/tts');
const { analyzeImage } = require('../../../../utils/vision');
const { getPageShareConfig } = require('../../../../utils/share');

const NAVIGATION_PROMPT = `背景：
你是一个专为视障人士设计的AI导航助手，负责分析摄像头拍摄的图像并提供导航指引。

任务：
1. 路径分析：
- 识别并描述可行走的路径
- 指出地面状况（平坦、有台阶、有坑洼等）
- 标注路径宽度是否足够通行

2. 方向指引：
- 识别明显的导航标志（如盲道、指示牌、门牌号）
- 提供清晰的方向指引（"可以直行"、"需要左转"等）
- 预警前方的转弯或路径变化

3. 障碍物提示：
- 标注临时障碍物（施工区域、移动物体等）
- 提醒地面高度变化（台阶、坡道、路沿等）
- 指出头部高度的潜在障碍物

4. 盲道识别：
- 识别当前环境中的盲道，指明盲道的具体位置。
- 提示盲道是否偏离当前路径，给出调整建议。例如，“盲道在您的右侧，请向右调整步伐”。

5. 交通信号提示：
- 识别红绿灯状态，提供过马路的安全提示。
- 描述交通信号的变化。例如，“前方是红绿灯，当前红灯亮起，请等待绿灯”。

请用简短的语句描述，优先级：
1. 紧急安全提醒
2. 当前位置和方向指引
3. 周边环境描述

注意事项：

描述要简洁明了，避免冗长。
突出重要信息，如盲道位置、障碍物和交通信号状态。
使用具体的距离和方位词（如前方、左侧、右侧）来帮助定位。
提供明确的行动建议，确保用户安全。

示例：
"前方5米处有盲道可循，地面平整。右前方2米处有下行台阶，请小心。建议沿盲道直行。"`;

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
        displayText: '正在分析路径...'
      });

      console.log('开始调用智谱AI...');
      // 调用图像识别，传入导航特定的 prompt
      const description = await analyzeImage(base64, NAVIGATION_PROMPT);
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
        displayText: '抱歉，导航分析失败，请重试',
        analyzing: false
      });
      
      // 播放错误提示
      await textToSpeech('抱歉，导航分析失败，请重试');
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
      ...getPageShareConfig('/pages/tool/blind-assistant/navigation/index'),
      title: '导航辅助 - AI导航助手'
    }
  },

  onShareTimeline() {
    return {
      ...getPageShareConfig('/pages/tool/blind-assistant/navigation/index'),
      title: '导航辅助 - AI导航助手'
    }
  }
});
