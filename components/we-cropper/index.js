const WeCropper = require('./we-cropper.js')

Component({
  properties: {
    cropperOpt: {
      type: Object,
      value: {}
    }
  },

  data: {
    cropper: null
  },

  lifetimes: {
    attached() {
      const { cropperOpt } = this.data
      
      this.createSelectorQuery()
        .select(`#${cropperOpt.id}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)

          cropperOpt.canvas = canvas
          cropperOpt.ctx = ctx

          this.cropper = new WeCropper(cropperOpt)
            .on('ready', () => {
              console.log('cropper ready!')
            })
            .on('beforeImageLoad', () => {
              wx.showToast({
                title: '加载中',
                icon: 'loading'
              })
            })
            .on('imageLoad', () => {
              wx.hideToast()
            })
        })
    }
  },

  methods: {
    touchStart(e) {
      this.cropper.touchStart(e)
    },

    touchMove(e) {
      this.cropper.touchMove(e)
    },

    touchEnd(e) {
      this.cropper.touchEnd(e)
    },

    getCropperImage(callback) {
      this.cropper.getCropperImage(callback)
    },

    updateCutInfo(cutInfo) {
      this.cropper.updateCutInfo(cutInfo)
    },

    pushOrign(src) {
      this.cropper.pushOrign(src)
    }
  }
})
