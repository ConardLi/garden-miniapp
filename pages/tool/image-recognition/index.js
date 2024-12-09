const app = getApp();
const { analyzeImage } = require('../../../utils/vision');
const { getPageShareConfig } = require('../../../utils/share');

const RECOGNITION_PROMPT = `背景：
你是一个专业的图像识别助手，通过分析图片来识别物品并提供详细信息。

任务：
1. 识别图片中的所有物品
2. 分析每个物品的特征和类别
3. 给出识别的可信度评分

输出要求：
请以 JSON 格式输出，包含以下字段（如果识别到多个物品，请以数组的形式返回：）
[
  {
    "name": "物品名称",
    "tags": "与此物品相关的标签，用、分隔",
    "score": "识别可信度，用百分比表示",
    "description": "物品的详细描述"
  }
]

注意：
1. 请一定要遵循此结构，不要增加任何冗余字段
2. 相似度要合理，确定度不高的不要超过 85%
3. 如果没有识别到物品，请返回具体描述原因
`;

Page({
  data: {
    results: [], // 存储识别结果
    showResult: false,
    loading: false,
    noObject: false, // 标志是否没有识别到物品
    imagePath: '' // 存储拍摄的图片路径
  },

  // 从文本中提取JSON
  extractJSON(text) {
    try {
      // 处理以```json开头的情况
      const lines = text.split('\n');
      if (lines[0].trim() === '```json') {
        // 去掉第一行和最后一行的```
        const jsonStr = lines.slice(1, -1).join('\n');
        const results = JSON.parse(jsonStr);
        return Array.isArray(results) ? results : [results];
      }
      
      // 其他情况，直接尝试解析
      const results = JSON.parse(text);
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      console.error('Extract JSON failed:', error);
      return [];
    }
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
          noObject: false,
          results: []
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

          // 获取文件类型
          const fileType = await new Promise((resolve, reject) => {
            wx.getFileSystemManager().readFile({
              filePath: tempFilePath,
              position: 0,
              length: 4, // 读取前4个字节来判断文件类型
              success: res => {
                const buffer = res.data;
                const view = new DataView(buffer);
                const magic = view.getUint32(0, false).toString(16).toUpperCase();
                console.log('文件魔数:', magic);
                
                let type = '';
                if (magic.startsWith('FFD8')) {
                  type = 'image/jpeg';
                } else if (magic.startsWith('89504E47')) {
                  type = 'image/png';
                }
                console.log('检测到的文件类型:', type);
                resolve(type);
              },
              fail: err => {
                console.error('读取文件头失败:', err);
                reject(err);
              }
            });
          });
          
          // 检测图片格式
          if (!['image/jpeg', 'image/png'].includes(fileType)) {
            wx.showToast({
              title: '仅支持jpg和png格式的图片',
              icon: 'none'
            });
            this.setData({ 
              loading: false,
              noObject: true
            });
            return;
          }

          // 读取图片base64
          const base64 = await new Promise((resolve, reject) => {
            wx.getFileSystemManager().readFile({
              filePath: tempFilePath,
              encoding: 'base64',
              success: res => {
                console.log('图片base64读取成功，长度:', res.data.length);
                resolve(res.data);
              },
              fail: err => {
                console.error('读取图片base64失败:', err);
                reject(err);
              }
            });
          });

          // 调用图像分析
          const result = await analyzeImage(base64, RECOGNITION_PROMPT);
          console.log('Recognition result:', result);

          if (!result) {
            this.setData({
              loading: false,
              noObject: true
            });
            return;
          }

          // 解析返回的JSON
          const objects = this.extractJSON(result);
          
          if (!objects || objects.length === 0) {
            this.setData({
              loading: false,
              noObject: true
            });
            return;
          }

          // 确保每个对象都有必要的字段
          const validObjects = objects.map(obj => ({
            name: obj.name || '未知物品',
            tags: obj.tags || '',
            score: typeof obj.score === 'number' ? `${Math.round(obj.score)}%` : (obj.score || '0%'),
            description: obj.description || '暂无描述'
          }));

          // 更新UI
          this.setData({
            loading: false,
            results: validObjects,
            noObject: false
          });

        } catch (error) {
          console.error('识别失败:', error);
          wx.showToast({
            title: '识别失败，请重试',
            icon: 'none'
          });
          this.setData({
            loading: false,
            noObject: true
          });
        }
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '选择图片失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 重新拍照
  retake() {
    this.setData({
      showResult: false,
      loading: false,
      noObject: false,
      results: [],
      imagePath: ''
    });
    this.startCapture();
  },

  // 返回首页
  goBack() {
    this.setData({
      showResult: false,
      loading: false,
      noObject: false,
      results: [],
      imagePath: ''
    });
  },

  onShareAppMessage() {
    return getPageShareConfig('/pages/tool/image-recognition/index');
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/tool/image-recognition/index');
  }
});
