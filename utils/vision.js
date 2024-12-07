const config = require('../config/secret');

// 图像识别
const analyzeImage = async (base64Image, prompt = '请描述这张图片中的内容，用简洁的语言，不超过100字。') => {
  try {
    console.log('准备调用智谱AI API...');
    
    const response = await new Promise((resolve, reject) => {
      const requestData = {
        model: 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        stream: false
      };
      
      console.log('发送请求到智谱AI:', {
        url: config.zhipu.urls.vision,
        prompt: prompt
      });

      wx.request({
        url: config.zhipu.urls.vision,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.zhipu.apiKey}`
        },
        data: requestData,
        success: (res) => {
          console.log('智谱AI响应:', res);
          
          if (res.data && res.data.choices && res.data.choices[0]) {
            resolve(res.data.choices[0].message.content);
          } else {
            console.error('无效的响应格式:', res.data);
            reject(new Error('Invalid response format'));
          }
        },
        fail: (error) => {
          console.error('请求失败:', error);
          reject(error);
        }
      });
    });

    return response;
  } catch (error) {
    console.error('图像识别失败:', error);
    throw error;
  }
};

module.exports = {
  analyzeImage
};
