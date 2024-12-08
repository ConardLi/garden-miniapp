import { tools, categories } from '../../config/tools'

Page({
  data: {
    categories: categories,
    allTools: tools,
    filteredTools: [],
    currentCategory: 'vision', // 默认选中第一个分类
    searchText: '',
    statusBarHeight: 0
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    })
    
    // 初始化时显示第一个分类的工具
    this.filterTools()
  },

  // 处理分类点击
  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      currentCategory: categoryId
    }, () => {
      this.filterTools()
    })
  },

  // 处理搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value
    this.setData({
      searchText
    }, () => {
      this.filterTools()
    })
  },

  // 过滤工具列表
  filterTools() {
    const { allTools, currentCategory, searchText } = this.data
    
    let filtered = allTools

    // 先按分类过滤
    if (currentCategory) {
      filtered = filtered.filter(tool => tool.category === currentCategory)
    }

    // 再按搜索关键词过滤
    if (searchText) {
      const keyword = searchText.toLowerCase()
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(keyword) || 
        tool.description.toLowerCase().includes(keyword)
      )
    }

    this.setData({
      filteredTools: filtered
    })
  },

  // 工具点击跳转
  onToolTap(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path
    })
  }
})
