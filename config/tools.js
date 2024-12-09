// 工具分类
export const categories = [
  {
    id: 'vision',
    name: '视觉能力',
    icon: 'vision'
  },
  {
    id: 'life',
    name: '生活助手',
    icon: 'life'
  },
  {
    id: 'creation',
    name: '创作工具',
    icon: 'creation'
  }
];

// 工具列表
export const tools = [
  {
    id: 'image-recognition',
    name: '图像识别',
    description: '智能识别图片中的物品（通用识别）',
    icon: 'icon-recognition.svg',
    path: '/pages/tool/image-recognition/index',
    category: 'vision'
  },
  {
    id: 'blind-assistant',
    name: '盲人助手',
    description: '为视障人士提供视觉辅助',
    icon: 'eye.png',
    path: '/pages/tool/blind-assistant/index',
    category: 'vision'
  },
  {
    id: 'food-calories',
    name: '食物热量',
    description: '识别食物热量和营养成分',
    icon: 'food.png',
    path: '/pages/tool/food-calories/index',
    category: 'life'
  },
  {
    id: 'image-generator',
    name: 'AI绘画',
    description: '根据文字描述生成图片',
    icon: 'image.png',
    path: '/pages/tool/image-generator/index',
    category: 'creation'
  }
];
