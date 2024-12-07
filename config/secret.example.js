// 应用配置示例
const config = {
  // 百度云配置
  baidu: {
    speech: {
      apiKey: 'xxx',    // 替换为你的API Key
      secretKey: 'xxx', // 替换为你的Secret Key
      urls: {
        token: 'https://aip.baidubce.com/oauth/2.0/token',
        tts: 'https://tsn.baidu.com/text2audio'
      }
    }
  },
  // 智谱AI配置
  zhipu: {
    apiKey: 'xxx', // 替换为你的API Key
    urls: {
      vision: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    }
  }
};

module.exports = config;
