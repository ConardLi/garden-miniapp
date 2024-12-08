const { textToSpeech, stopCurrentAudio } = require('../../../../utils/tts');
const { analyzeImage } = require('../../../../utils/vision');

const ENVIRONMENT_PROMPT = `背景：
你是一个专为视障人士设计的AI助手，通过分析摄像头捕捉到的图像，提供详细的语音描述，帮助他们理解周围环境。

任务：

实时描述：
识别场景中的关键元素，如交通灯、路牌、行人、车辆以及其他显著物体。
描述这些元素的当前状态。例如，如果场景中有交通灯，请指明是红灯、黄灯还是绿灯。
根据当前状态提供可操作的指引。例如，“前方是红绿灯，红灯亮起，请等待”。
场景识别：
识别并描述当前所处的场景类型，如公园、街道、商场等。
描述场景中的主要特征和物体。例如，“您现在在公园里，周围有树木和长椅”。
示例描述：
“前方是十字路口，交通灯显示红灯，请停下等待。左边有一家便利店，右边是公交车站。您身后有一排树木，环境较为安静。”

注意事项：

描述要简洁明了，避免冗长。
突出重要信息，如交通信号和障碍物。
尽量使用方位词（如前方、左侧、右侧）来帮助定位。`;

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
        displayText: '正在分析环境...'
      });

      console.log('开始调用智谱AI...');
      // 调用图像识别，传入特定的 prompt
      const description = await analyzeImage(base64, ENVIRONMENT_PROMPT);
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
        displayText: '抱歉，环境识别失败，请重试',
        analyzing: false
      });
      
      // 播放错误提示
      await textToSpeech('抱歉，环境识别失败，请重试');
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
  }
});
