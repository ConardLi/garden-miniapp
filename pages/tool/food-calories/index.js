// 食物热量识别页面
const app = getApp();
const { analyzeImage } = require('../../../utils/vision');

const FOOD_PROMPT = `背景：
你是一个专业的食物识别助手，通过分析图片来识别食物并提供详细的营养信息。

任务：
1. 识别图片中的食物种类
2. 提供每份食物的大致卡路里含量
3. 分析主要营养成分（蛋白质、脂肪、碳水化合物、膳食纤维）
4. 给出健康饮食建议

输出要求：
请以 JSON 格式输出，包含以下字段（如果识别到多个食物，请以数组的形式返回：）
[
{
  "name": "食物名称",
  "calories": 卡路里数值(整数),
  "nutrition": {
    "protein": 蛋白质克数(数字),
    "fat": 脂肪克数(数字),
    "carbs": 碳水克数(数字),
    "fiber": 膳食纤维克数(数字)
  },
  "tips": "健康饮食建议"
},
{
  "name": "食物名称",
  "calories": 卡路里数值(整数),
  "nutrition": {
    "protein": 蛋白质克数(数字),
    "fat": 脂肪克数(数字),
    "carbs": 碳水克数(数字),
    "fiber": 膳食纤维克数(数字)
  },
  "tips": "健康饮食建议"
}
]

注意，请一定要遵循此结构，不要增加任何冗余字段

如果没有识别到食物，请返回具体描述
`;

Page({
  data: {
    results: [], // 改为数组存储多个结果
    totalCalories: 0, // 新增字段，存储总卡路里
    showResult: false,
    loading: false,
    noFood: false // 新增标志，表示是否没有识别到食物
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

  // 开始拍照
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
          noFood: false
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
              noFood: true
            });
            return;
          }
          
          // 读取图片base64
          const base64 = await new Promise((resolve, reject) => {
            wx.getFileSystemManager().readFile({
              filePath: tempFilePath,
              encoding: 'base64',
              success: res => {
                console.log('Base64数据长度:', res.data.length);
                console.log('Base64数据前20个字符:', res.data);
                resolve(res.data);
              },
              fail: err => {
                console.error('读取图片base64失败:', err);
                reject(err);
              }
            });
          });

          // 调用图像识别
          console.log('开始调用智谱AI...');
          const aiResult = await analyzeImage(base64, FOOD_PROMPT);
          console.log('智谱AI返回结果:', aiResult);

          // 提取和解析JSON结果
          const results = this.extractJSON(aiResult);
          console.log('解析后的结果:', results);
          
          // 计算总卡路里
          const totalCalories = results.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
          
          this.setData({
            results,
            totalCalories,
            showResult: true,
            loading: false,
            noFood: results.length === 0
          });

          if (results.length === 0) {
            wx.showToast({
              title: '未能识别到食物',
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('Food recognition failed:', error);
          wx.showToast({
            title: error.errMsg?.includes('timeout') ? 
              '网络请求超时，请重试' : 
              '识别失败，请重试',
            icon: 'none',
            duration: 2000
          });
          this.setData({ 
            loading: false,
            noFood: true
          });
        }
      },
      fail: (error) => {
        console.error('Choose media failed:', error);
        if (error.errMsg !== 'chooseMedia:fail cancel') {
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 重新拍照
  retake() {
    this.setData({
      showResult: false,
      results: [],
      totalCalories: 0,
      noFood: false
    });
    this.startCapture();
  },

  // 返回首页
  goBack() {
    wx.navigateBack();
  }
});
