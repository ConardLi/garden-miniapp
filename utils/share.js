// 默认的分享配置
export const defaultShareConfig = {
  title: 'AI工具箱 - 你的智能生活助手',
  path: '/pages/home/index',
  imageUrl: '/assets/images/share-cover.png'
}

// 获取页面特定的分享配置
export const getPageShareConfig = (pagePath, pageData = {}) => {
  const configs = {
    '/pages/tool/food-calories/index': {
      title: '食物热量查询 - AI智能识别卡路里',
      path: '/pages/tool/food-calories/index'
    },
    '/pages/tool/blind-assistant/index': {
      title: '盲人助手 - AI视觉助手',
      path: '/pages/tool/blind-assistant/index'
    },
    '/pages/tool/blind-assistant/environment/index': {
      title: '环境描述 - AI场景识别',
      path: '/pages/tool/blind-assistant/environment/index'
    }
  }
  
  return {
    ...defaultShareConfig,
    ...(configs[pagePath] || {})
  }
}
