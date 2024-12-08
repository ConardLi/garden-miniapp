// 首页逻辑
import { tools } from '../../config/tools';
import { getPageShareConfig } from '../../utils/share'

Page({
  data: {
    searchValue: '',
    toolList: tools,
    filteredToolList: []
  },

  onLoad() {
    this.setData({
      filteredToolList: this.data.toolList
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

  onShareAppMessage() {
    return getPageShareConfig('/pages/home/index')
  },

  onShareTimeline() {
    return getPageShareConfig('/pages/home/index')
  }
});
