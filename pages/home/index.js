// 首页逻辑
import { tools, popularTools, newTools } from '../../config/tools';
import { banners } from '../../config/banners';
import { getPageShareConfig } from '../../utils/share';

Page({
  data: {
    banners: banners.list,
    searchValue: '',
    toolList: tools,
    filteredToolList: [],
    popularToolsList: [],
    newToolsList: []
  },

  onLoad() {
    this.initToolsData();
    this.setData({
      filteredToolList: this.data.toolList
    });
  },

  initToolsData() {
    // 获取热门推荐工具列表
    const popularToolsList = popularTools.map(id => 
      tools.find(tool => tool.id === id)
    ).filter(Boolean);

    // 获取最新上新工具列表
    const newToolsList = newTools.map(id => 
      tools.find(tool => tool.id === id)
    ).filter(Boolean);

    this.setData({
      popularToolsList,
      newToolsList
    });
  },

  // 搜索框输入
  onSearchInput(e) {
    const value = e.detail.value.toLowerCase();
    this.setData({
      searchValue: value
    });
    this.filterTools(value);
  },

  // 清空搜索
  onSearchClear() {
    this.setData({
      searchValue: '',
      filteredToolList: this.data.toolList
    });
  },

  // 过滤工具列表
  filterTools(keyword) {
    const filtered = this.data.toolList.filter(tool => 
      tool.name.toLowerCase().includes(keyword) || 
      tool.description.toLowerCase().includes(keyword)
    );
    this.setData({
      filteredToolList: filtered
    });
  },

  onBannerTap(e) {
    const { link } = e.currentTarget.dataset;
    wx.navigateTo({ url: link });
  },

  navigateToCategory() {
    wx.switchTab({
      url: '/pages/category/index'
    });
  },

  onShareAppMessage() {
    return getPageShareConfig('/pages/home/index')
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/home/index')
  }
});
