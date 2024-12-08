const config = require('../config/secret');

// 图像识别
const analyzeImage = async (base64Image, prompt = '请描述这张图片中的内容，用简洁的语言，不超过100字。') => {
  try {
    console.log('准备调用智谱AI API...');
    console.log('Base64图片长度:', base64Image.length);
    console.log('Base64图片前20个字符:', base64Image.substring(0, 20));
    
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
                  url: `data:image/png;base64,${base64Image}`  // 使用 PNG 格式，它支持更广泛的图片类型
                }
              }
            ]
          }
        ],
        stream: false
      };
      
      console.log('发送请求到智谱AI:', {
        url: config.zhipu.urls.vision,
        prompt: prompt,
        base64Length: base64Image.length
      });

      wx.request({
        url: config.zhipu.urls.vision,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.zhipu.apiKey}`
        },
        data: requestData,
        timeout: 30000, // 设置超时时间为 30 秒
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
