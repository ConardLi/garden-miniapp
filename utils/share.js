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
    },
    '/pages/tool/image-recognition/index': {
      title: '智能物体识别 - AI图像识别',
      path: '/pages/tool/image-recognition/index'
    },
    '/pages/tool/qrcode-generator/index': {
      title: '二维码解析',
      path: '/pages/tool/qrcode-generator/index'
    },
    '/pages/tool/image-compress/index': {
      title: '图片压缩',
      path: '/pages/tool/image-compress/index'
    },
    '/pages/tool/text-recognition/index': {
      title: '文字识别',
      path: '/pages/tool/text-recognition/index'
    },
    '/pages/tool/expression-editor/index': {
      title: '表情编辑',
      path: '/pages/tool/expression-editor/index'
    }
  }

  // 获取页面特定配置或使用默认配置
  const pageConfig = pagePath ? configs[pagePath] : null
  return {
    ...defaultShareConfig,
    ...(pageConfig || {}),
    ...pageData
  }
}
