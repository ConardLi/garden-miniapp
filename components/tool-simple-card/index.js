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
      wx.navigateTo({ url: path });
    }
  }
});
