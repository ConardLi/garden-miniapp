const config = require('../config/secret');

// 基础请求配置
const BASE_URL = 'https://api.302.ai';
const DEFAULT_TIMEOUT = 30000; // 30秒超时

/**
 * 生成请求头
 * @returns {Object} 请求头对象
 */
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config['302ai'].apiKey}`
  };
};

/**
 * 发送请求到302AI
 * @param {string} endpoint - API端点
 * @param {Object} data - 请求数据
 * @returns {Promise} 请求响应
 */
const request = async (endpoint, data) => {
  try {
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}${endpoint}`,
        method: 'POST',
        header: getHeaders(),
        data: data,
        timeout: DEFAULT_TIMEOUT,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
    return response;
  } catch (error) {
    console.error('302AI API请求失败:', error);
    throw error;
  }
};

/**
 * 指令编辑（SeedEdit）是一种能够使用任何文本提示修改给定图像的扩散模型，也是专为图像编辑任务设计的模型。在通用性、可控性、高质量等方面取得了新的突破，凭借创新、多尺度且多规则的数据获取和过滤方案，输入任意指令，即可实现精准编辑。
 */

/**
 * 图片编辑（SeedEdit）
 * @param {Array<string>} imageUrls - 图片URL数组
 * @param {string} prompt - 编辑提示词
 * @param {Object} options - 其他选项
 * @returns {Promise} 编辑结果
 */
const seededit = async (imageUrls, prompt, options = {}) => {
  console.log('[302ai] seededit start:', {
    imageUrls,
    prompt,
    options
  });

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('图片URL数组不能为空');
  }

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('编辑提示词不能为空');
  }

  const data = {
    image_urls: imageUrls,
    prompt: prompt,
    negative_prompt: options.negative_prompt || '',
    seed: options.seed || -1,
    scale: options.scale || 0.5,
    return_url: options.return_url !== false,
    logo_info: {
      add_logo: options.logo_info?.add_logo || false,
      position: options.logo_info?.position || 0,
      language: options.logo_info?.language || 0,
      logo_text_content: options.logo_info?.logo_text_content || ''
    }
  };

  console.log('[302ai] seededit data:', data);  

  try {
    const response = await request(config['302ai'].urls.seededit, data);
    console.log('[302ai] seededit response:', response);

    if (response.message !== 'Success') {
      throw new Error(`API错误: ${response.message || '未知错误'}`);
    }

    if (!response.data?.image_urls?.[0]) {
      throw new Error('API返回数据格式错误');
    }

    return response;
  } catch (error) {
    console.error('[302ai] seededit error:', error);
    throw error;
  }
};

/**
 * 调用豆包大模型
 * @param {string} prompt - 用户输入的提示词
 * @param {Object} options - 其他选项
 * @returns {Promise} 响应结果
 */
const doubao = async (prompt, options = {}) => {
  const endpoint = '/v1/chat/completions';
  const data = {
    model: 'Doubao-pro-32k',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    ...options
  };
  
  try {
    const response = await request(endpoint, data);
    return response;
  } catch (error) {
    console.error('豆包模型调用失败:', error);
    throw error;
  }
};

module.exports = {
  seededit,
  doubao
};
