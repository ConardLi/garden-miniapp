Component({
  properties: {
    tool: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onTap() {
      const { path } = this.data.tool;
      if (path) {
        wx.navigateTo({
          url: path,
          fail: (err) => {
            console.error('Navigation failed:', err);
            wx.showToast({
              title: '该功能正在开发中，敬请期待！',
              icon: 'none'
            });
          }
        });
      }
    }
  }
});
