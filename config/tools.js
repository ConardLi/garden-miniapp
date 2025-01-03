const pre = 'https://garden-1257917459.cos.ap-beijing.myqcloud.com/miniapp/';

// 工具分类
export const categories = [
  {
    id: 'vision',
    name: '视觉识别',
    icon: 'vision'
  },
  {
    id: 'image',
    name: '图像处理',
    icon: 'image'
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
    icon:  pre + 'icon-recognition.svg',
    path: '/pages/tool/image-recognition/index',
    category: 'vision'
  },
  {
    id: 'text-recognition',
    name: '文字识别',
    description: '智能识别图片中的文字内容',
    icon: pre + 'txt.svg',
    path: '/pages/tool/text-recognition/index',
    category: 'vision'
  },
  {
    id: 'blind-assistant',
    name: '盲人助手',
    description: '为视障人士提供视觉辅助',
    icon:  pre + 'eye.png',
    path: '/pages/tool/blind-assistant/index',
    category: 'vision'
  },
  {
    id: 'food-calories',
    name: '食物热量',
    description: '识别食物热量和营养成分',
    icon:  pre + 'food.png',
    path: '/pages/tool/food-calories/index',
    category: 'life'
  },
  {
    id: 'background-remover',
    name: '背景消除',
    description: '智能去除图片背景',
    icon: pre + 'image.svg',
    path: '/pages/tool/background-remover/index',
    category: 'image'
  },  
  {
    id: 'text-extractor-douyin',
    name: '文案提取',
    description: '智能提取抖音视频文案',
    icon: pre + 'douyin.svg',
    path: '/pages/tool/text-extractor-douyin/index',
    category: 'creation'
  },
  {
    id: 'text-extractor-xiaohongshu',
    name: '文案提取',
    description: '智能提取小红书文案',
    icon: pre + 'xiaohongshu.svg',
    path: '/pages/tool/text-extractor-xiaohongshu/index',
    category: 'creation'
  },
  {
    id: 'translator',
    name: '专业翻译',
    description: '多语言专业翻译服务',
    icon: pre + 'translator.svg',
    path: '/pages/tool/translator/index',
    category: 'life'
  },
  {
    id: 'id-photo',
    name: '证件照',
    description: '智能证件照制作',
    icon: pre + 'camera.svg',
    path: '/pages/tool/id-photo/index',
    category: 'image'
  },
  {
    id: 'watermark-remover',
    name: '图片去水印',
    description: '智能去除图片水印',
    icon: pre + 'watermark.svg',
    path: '/pages/tool/watermark-remover/index',
    category: 'image'
  },
  {
    id: 'watermark-adder',
    name: '图片加水印',
    description: '为图片添加自定义水印',
    icon: pre + 'watermark.svg',
    path: '/pages/tool/watermark-adder/index',
    category: 'image'
  },
  {
    id: 'qrcode-generator',
    name: '二维码工具',
    description: '生成 & 解析二维码',
    icon: pre + 'qrcode.svg',
    path: '/pages/tool/qrcode-generator/index',
    category: 'image'
  },
  {
    id: 'image-compress',
    name: '图片压缩',
    description: '快速压缩图片，支持JPG、PNG等格式',
    icon:  pre + 'icon-recognition.svg',
    path: '/pages/tool/image-compress/index',
    category: 'image'
  },
  {
    id: 'expression-editor',
    name: '表情编辑',
    description: '一键改变照片中的表情',
    icon: pre + 'expression.svg',
    path: '/pages/tool/expression-editor/index',
    category: 'image'
  },
  {
    id: 'image-crop',
    name: '图片裁剪',
    description: '快速裁剪图片，支持自定义比例',
    icon:  pre + 'image-size.svg',
    path: '/pages/tool/image-crop/index',
    category: 'image'
  }
];

// 热门推荐工具ID列表
export const popularTools = [
  'blind-assistant',
  'food-calories',
  'image-recognition',
  'bg-remover',
  'text-extractor-douyin',
  'expression-editor',
];

// 最近上新工具ID列表
export const newTools = [
  'translator',
  'qrcode-generator',
  'id-photo',
  'content-writer-xiaohongshu',
  'image-compress',
  'text-recognition',
  'background-remover',
  'image-crop',
];
