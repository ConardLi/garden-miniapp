const WeCropper = require('../../../components/we-cropper/we-cropper.js')
const { removeBackground } = require('../../../utils/302ai')

const device = wx.getSystemInfoSync()
const width = device.windowWidth
const height = device.windowHeight - 180

Page({
  data: {
    step: 1,
    tempImagePath: '',
    processedImagePath: '',
    removedBgImagePath: '',
    showSizePopup: false,
    showColorPopup: false,
    colorList: [
      { id: 1, name: '白色', value: '#FFFFFF' },
      { id: 2, name: '蓝色', value: '#438EDB' },
      { id: 3, name: '红色', value: '#B60C24' }
    ],
    sizeList: [
      { id: 1, name: '一寸', width: 295, height: 413 }, // 25mm x 35mm
      { id: 2, name: '二寸', width: 413, height: 579 }, // 35mm x 49mm
      { id: 3, name: '小一寸', width: 260, height: 378 }, // 22mm x 32mm
      { id: 4, name: '大一寸', width: 390, height: 567 }, // 33mm x 48mm
      { id: 5, name: '小二寸', width: 413, height: 531 }, // 35mm x 45mm
      { id: 6, name: '大二寸', width: 413, height: 626 }  // 35mm x 53mm
    ],
    selectedSize: null,
    selectedColor: null,
    cropperOpt: {
      id: 'cropper',
      targetId: 'targetCropper',
      pixelRatio: device.pixelRatio,
      width,
      height,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: (width - 295) / 2,
        y: (height - 413) / 2,
        width: 295,
        height: 413
      }
    }
  },

  onLoad() {
    const { windowWidth } = wx.getSystemInfoSync()

    // 初始化裁剪组件
    this.cropper = new WeCropper({
      id: 'cropper',
      targetId: 'targetCropper',
      pixelRatio: windowWidth / 750,
      width: windowWidth,
      height: windowWidth,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: (windowWidth - 295) / 2,
        y: (windowWidth - 413) / 2,
        width: 295,
        height: 413
      }
    })

    // 默认选中一寸和白色背景
    this.setData({
      selectedSize: this.data.sizeList[0],
      selectedColor: this.data.colorList[0]
    })
  },

  // 选择图片
  uploadTap() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const src = res.tempFilePaths[0]
        console.log('选择图片成功：', src)
        this.setData({
          tempImagePath: src
        })
        this.startProcess()
      }
    })
  },

  // 显示尺寸选择弹出层
  showSizePopup() {
    this.setData({
      showSizePopup: true
    })
  },

  // 隐藏尺寸选择弹出层
  hideSizePopup() {
    this.setData({
      showSizePopup: false
    })
  },

  // 显示背景色选择弹出层
  showColorPopup() {
    this.setData({
      showColorPopup: true
    })
  },

  // 隐藏背景色选择弹出层
  hideColorPopup() {
    this.setData({
      showColorPopup: false
    })
  },

  // 选择尺寸
  selectSize(e) {
    const size = e.currentTarget.dataset.size
    const scaledSize = this.calculateScaledSize(size.width, size.height)
    
    // 更新尺寸
    this.setData({
      selectedSize: size,
      showSizePopup: false,
      cropperOpt: {
        ...this.data.cropperOpt,
        cut: {
          x: (width - scaledSize.width) / 2,
          y: (height - scaledSize.height) / 2,
          width: scaledSize.width,
          height: scaledSize.height
        }
      }
    })

    // 如果在裁剪步骤，重新初始化裁剪器
    if (this.data.step === 3) {
      this.initCropper()
      // 重新设置图片
      setTimeout(() => {
        this.cropper.pushOrign(this.data.processedImagePath)
      }, 100)
    }
  },

  // 选择颜色
  async selectColor(e) {
    const color = e.currentTarget.dataset.color
    console.log('选择背景色:', color)

    this.setData({
      selectedColor: color,
      showColorPopup: false
    })

    // 如果在裁剪步骤，需要重新生成图片
    if (this.data.step === 3) {
      try {
        wx.showLoading({
          title: '更新背景色...',
          mask: true
        })

        // 1. 获取去除背景的图片信息
        const imageInfo = await new Promise((resolve, reject) => {
          wx.getImageInfo({
            src: this.data.removedBgImagePath,
            success: resolve,
            fail: reject
          })
        })

        console.log('获取去除背景图片信息:', imageInfo)

        // 2. 创建临时 canvas 用于替换背景
        const query = wx.createSelectorQuery()
        const canvas = await new Promise((resolve, reject) => {
          query.select('#resultCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              if (res[0] && res[0].node) {
                resolve(res[0].node)
              } else {
                reject(new Error('获取 canvas 节点失败'))
              }
            })
        })

        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio

        // 设置 canvas 尺寸为原图尺寸
        canvas.width = imageInfo.width
        canvas.height = imageInfo.height

        console.log('设置 canvas 尺寸:', {
          width: canvas.width,
          height: canvas.height,
          dpr
        })

        // 3. 绘制新背景
        ctx.fillStyle = color.value
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 4. 绘制去除背景后的图片
        const image = canvas.createImage()
        await new Promise((resolve, reject) => {
          image.onload = resolve
          image.onerror = (e) => {
            console.error('图片加载失败:', e)
            reject(e)
          }
          image.src = this.data.removedBgImagePath
        })

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        // 5. 生成新图片
        const processedImagePath = await new Promise((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas,
            fileType: 'jpg',
            quality: 1,
            success: res => resolve(res.tempFilePath),
            fail: err => {
              console.error('生成图片失败:', err)
              reject(err)
            }
          })
        })

        console.log('生成新背景色的图片:', processedImagePath)

        // 6. 更新图片并重新初始化裁剪器
        this.setData({ 
          processedImagePath
        }, () => {
          // 重新初始化裁剪器
          console.log('重新初始化裁剪器')
          this.initCropper()
          
          // 设置裁剪图片
          setTimeout(() => {
            console.log('设置新的裁剪图片')
            this.cropper.pushOrign(processedImagePath)
            wx.hideLoading()
          }, 100)
        })

      } catch (error) {
        console.error('更新背景色失败:', error)
        wx.hideLoading()
        wx.showToast({
          title: error.message || '更新背景色失败',
          icon: 'none'
        })
      }
    }
  },

  // 计算缩放后的尺寸
  calculateScaledSize(originalWidth, originalHeight) {
    const maxWidth = width * 0.8
    const maxHeight = height * 0.5

    let scale = 1
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const scaleX = maxWidth / originalWidth
      const scaleY = maxHeight / originalHeight
      scale = Math.min(scaleX, scaleY)
    }

    return {
      width: originalWidth * scale,
      height: originalHeight * scale
    }
  },

  // 开始处理图片
  async startProcess() {
    if (!this.data.tempImagePath) {
      return
    }

    console.log('开始处理图片，原始图片路径:', this.data.tempImagePath)
    this.setData({ step: 2 })

    try {
      // 1. 上传图片到云存储
      console.log('开始上传图片到云存储')
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `id-photo/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        filePath: this.data.tempImagePath
      })

      if (!uploadResult.fileID) {
        throw new Error('图片上传失败')
      }
      console.log('图片上传成功，fileID:', uploadResult.fileID)

      // 2. 获取临时链接
      const tempUrlResult = await wx.cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })

      if (!tempUrlResult.fileList?.[0]?.tempFileURL) {
        throw new Error('获取图片链接失败')
      }

      const imageUrl = tempUrlResult.fileList[0].tempFileURL
      console.log('获取临时链接成功:', imageUrl)

      // 3. 调用背景消除API
      console.log('开始调用背景消除API')
      const processedImage = await removeBackground(imageUrl)
      console.log('背景消除成功，获取到处理后的图片:', processedImage)

      // 4. 下载处理后的图片
      const downloadRes = await new Promise((resolve, reject) => {
        wx.downloadFile({
          url: processedImage.url,
          success: resolve,
          fail: reject
        })
      })

      if (downloadRes.statusCode !== 200) {
        throw new Error('下载处理后的图片失败')
      }

      const removedBgImagePath = downloadRes.tempFilePath
      console.log('下载处理后的图片成功:', removedBgImagePath)

      // 5. 获取处理后图片信息
      const imageInfo = await new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: removedBgImagePath,
          success: resolve,
          fail: reject
        })
      })

      console.log('获取处理后图片信息成功:', imageInfo)

      // 6. 创建临时 canvas 用于替换背景
      const query = wx.createSelectorQuery()
      const canvas = await new Promise((resolve, reject) => {
        query.select('#resultCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res[0] && res[0].node) {
              resolve(res[0].node)
            } else {
              reject(new Error('获取 canvas 节点失败'))
            }
          })
      })

      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio

      // 设置 canvas 尺寸为原图尺寸
      canvas.width = imageInfo.width
      canvas.height = imageInfo.height

      console.log('设置 canvas 尺寸:', {
        width: canvas.width,
        height: canvas.height,
        dpr
      })

      // 7. 绘制背景
      ctx.fillStyle = this.data.selectedColor.value
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 8. 绘制去除背景后的图片
      const image = canvas.createImage()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = (e) => {
          console.error('图片加载失败:', e)
          reject(e)
        }
        image.src = removedBgImagePath
      })

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      // 9. 生成新图片
      const processedImagePath = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas,
          fileType: 'jpg',
          quality: 1,
          success: res => resolve(res.tempFilePath),
          fail: err => {
            console.error('生成图片失败:', err)
            reject(err)
          }
        })
      })

      console.log('生成替换背景后的图片:', processedImagePath)

      // 10. 删除云存储中的临时文件
      try {
        await wx.cloud.deleteFile({
          fileList: [uploadResult.fileID]
        })
        console.log('删除云存储临时文件成功')
      } catch (error) {
        console.error('删除云存储临时文件失败:', error)
        // 不阻断主流程
      }

      // 11. 进入裁剪步骤
      this.setData({ 
        processedImagePath,
        removedBgImagePath,
        step: 3
      })

      // 12. 初始化裁剪器
      console.log('初始化裁剪器')
      this.initCropper()

      // 13. 设置裁剪图片
      setTimeout(() => {
        console.log('设置裁剪图片')
        this.cropper.pushOrign(processedImagePath)
      }, 100)

    } catch (error) {
      console.error('处理图片失败:', error)
      wx.showToast({
        title: error.message || '处理失败',
        icon: 'none'
      })
      // 返回第一步
      this.setData({ step: 1 })
    }
  },

  // 初始化裁剪器
  initCropper() {
    console.log('初始化裁剪器配置：', this.data.cropperOpt)
    const { cropperOpt } = this.data
    this.cropper = new WeCropper(cropperOpt)
      .on('ready', (ctx) => {
        console.log('裁剪器初始化完成')
      })
      .on('beforeImageLoad', (ctx) => {
        console.log('图片开始加载')
        wx.showToast({
          title: '加载中',
          icon: 'loading',
          duration: 20000
        })
      })
      .on('imageLoad', (ctx) => {
        console.log('图片加载完成')
        wx.hideToast()
      })
      .on('fail', (error) => {
        console.error('裁剪器错误：', error)
      })
  },

  // 返回第一步
  backToStart() {
    this.setData({
      step: 1,
      tempImagePath: '',
      processedImagePath: ''
    })
  },

  // 保存结果
  async saveResult() {
    if (!this.cropper) {
      return
    }

    wx.showLoading({
      title: '正在生成...',
      mask: true
    })

    try {
      const { selectedSize } = this.data
      
      // 1. 获取裁剪后的图片
      const croppedImage = await new Promise((resolve, reject) => {
        this.cropper.getCropperImage((tempFilePath) => {
          if (tempFilePath) {
            resolve(tempFilePath)
          } else {
            reject(new Error('获取裁剪图片失败'))
          }
        })
      })

      console.log('获取裁剪图片成功:', croppedImage)

      // 2. 获取裁剪图片的信息
      const imageInfo = await new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: croppedImage,
          success: resolve,
          fail: reject
        })
      })

      console.log('获取裁剪后图片信息:', imageInfo)

      // 3. 创建并设置结果 canvas
      const query = wx.createSelectorQuery()
      const canvas = await new Promise((resolve, reject) => {
        query.select('#resultCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res[0] && res[0].node) {
              resolve(res[0].node)
            } else {
              reject(new Error('获取 canvas 节点失败'))
            }
          })
      })

      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio

      // 设置 canvas 尺寸（考虑像素比）
      canvas.width = selectedSize.width * dpr
      canvas.height = selectedSize.height * dpr

      console.log('设置最终 canvas 尺寸:', {
        width: canvas.width,
        height: canvas.height,
        dpr,
        selectedSize
      })

      // 4. 创建并绘制图片
      const image = canvas.createImage()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = (e) => {
          console.error('图片加载失败:', e)
          reject(e)
        }
        image.src = croppedImage
      })

      // 计算绘制参数
      const scale = Math.min(
        selectedSize.width * dpr / imageInfo.width,
        selectedSize.height * dpr / imageInfo.height
      )
      
      const scaledWidth = imageInfo.width * scale
      const scaledHeight = imageInfo.height * scale
      
      const x = (canvas.width - scaledWidth) / 2
      const y = (canvas.height - scaledHeight) / 2

      console.log('计算绘制参数:', {
        scale,
        scaledWidth,
        scaledHeight,
        x,
        y
      })

      // 绘制图片（居中）
      ctx.drawImage(
        image,
        x,
        y,
        scaledWidth,
        scaledHeight
      )

      // 5. 保存图片
      const tempFilePath = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas,
          width: canvas.width,
          height: canvas.height,
          destWidth: selectedSize.width,
          destHeight: selectedSize.height,
          fileType: 'jpg',
          quality: 1,
          success: res => resolve(res.tempFilePath),
          fail: err => {
            console.error('保存失败:', err)
            reject(err)
          }
        })
      })

      console.log('生成最终图片成功:', tempFilePath)

      await wx.saveImageToPhotosAlbum({
        filePath: tempFilePath
      })

      wx.hideLoading()
      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      })

    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    }
  },

  touchStart(e) {
    this.cropper && this.cropper.touchStart(e)
  },

  touchMove(e) {
    this.cropper && this.cropper.touchMove(e)
  },

  touchEnd(e) {
    this.cropper && this.cropper.touchEnd(e)
  }
})
