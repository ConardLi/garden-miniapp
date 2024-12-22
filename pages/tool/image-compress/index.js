// pages/tool/image-compress/index.js
Page({
  data: {
    imageUrl: '',
    compressedImageUrl: '',
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    isCompressing: false,
    // 压缩选项
    compressOptions: {
      quality: 20,  // 默认值为20，提供更好的压缩效果
      scale: 100    // 缩放比例，默认100%
    }
  },

  // 选择图片
  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['original']
      })
      
      if (res && res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const fileSize = res.tempFiles[0].size
        
        // 检查文件大小
        if (fileSize < 20 * 1024) { // 小于20KB
          wx.showModal({
            title: '提示',
            content: '图片较小，压缩可能无法获得明显效果。是否继续？',
            success: async (res) => {
              if (res.confirm) {
                await this.setImageData(tempFilePath, fileSize)
              }
            }
          })
        } else if (fileSize > 10 * 1024 * 1024) { // 大于10MB
          wx.showModal({
            title: '提示',
            content: '图片过大，建议先裁剪或使用其他工具压缩后再使用。是否继续？',
            success: async (res) => {
              if (res.confirm) {
                await this.setImageData(tempFilePath, fileSize)
              }
            }
          })
        } else {
          await this.setImageData(tempFilePath, fileSize)
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  },

  // 设置图片数据
  async setImageData(tempFilePath, fileSize) {
    try {
      // 获取图片信息
      const imageInfo = await wx.getImageInfo({
        src: tempFilePath
      })
      
      // 根据图片大小自动设置建议的压缩质量
      let suggestedQuality = 20
      if (fileSize > 5 * 1024 * 1024) { // 5MB以上
        suggestedQuality = 10
      } else if (fileSize > 2 * 1024 * 1024) { // 2MB-5MB
        suggestedQuality = 15
      } else if (fileSize < 100 * 1024) { // 100KB以下
        suggestedQuality = 30
      }
      
      this.setData({
        imageUrl: tempFilePath,
        originalSize: fileSize,
        compressedImageUrl: '',
        compressedSize: 0,
        compressionRatio: 0,
        'compressOptions.quality': suggestedQuality,
        'compressOptions.scale': 100,
        imageInfo: {
          width: imageInfo.width,
          height: imageInfo.height,
          type: imageInfo.type
        }
      })
    } catch (error) {
      console.error('设置图片数据失败:', error)
      wx.showToast({
        title: '设置图片数据失败',
        icon: 'none'
      })
    }
  },

  // 更新压缩质量
  onQualityChange(e) {
    const quality = parseInt(e.detail.value)
    this.setData({
      'compressOptions.quality': quality
    })
  },

  // 更新缩放比例
  onScaleChange(e) {
    const scale = parseInt(e.detail.value)
    this.setData({
      'compressOptions.scale': scale
    })
  },

  // 压缩图片
  async compressImage() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    this.setData({ isCompressing: true })

    try {
      // 计算缩放尺寸
      const scale = this.data.compressOptions.scale / 100
      const width = Math.round(this.data.imageInfo.width * scale)
      const height = Math.round(this.data.imageInfo.height * scale)
      
      // 确保尺寸不会太小
      if (width < 100 || height < 100) {
        wx.showToast({
          title: '缩放后尺寸太小，请调整',
          icon: 'none'
        })
        this.setData({ isCompressing: false })
        return
      }

      // 使用微信原生压缩API
      const { tempFilePath } = await wx.compressImage({
        src: this.data.imageUrl,
        quality: this.data.compressOptions.quality,
        compressedWidth: width,
        compressedHeight: height
      })

      // 获取压缩后的文件信息
      const compressedFileInfo = await wx.getFileInfo({
        filePath: tempFilePath
      })

      // 获取压缩后的图片信息
      const compressedImageInfo = await wx.getImageInfo({
        src: tempFilePath
      })

      // 计算压缩率 - 数值越小，压缩率越高
      const ratio = ((this.data.originalSize - compressedFileInfo.size) / this.data.originalSize * 100).toFixed(2)

      // 如果压缩后反而变大了
      if (compressedFileInfo.size >= this.data.originalSize) {
        wx.showModal({
          title: '提示',
          content: '当前设置下压缩后的图片反而变大了，建议调低压缩质量值再试。是否保存当前结果？',
          success: (res) => {
            if (res.confirm) {
              this.setCompressResult(tempFilePath, compressedFileInfo, compressedImageInfo, ratio)
            }
          }
        })
      } else {
        this.setCompressResult(tempFilePath, compressedFileInfo, compressedImageInfo, ratio)
      }
    } catch (error) {
      console.error('压缩失败:', error)
      wx.showToast({
        title: '压缩失败：' + (error.message || '未知错误'),
        icon: 'none'
      })
    } finally {
      this.setData({ isCompressing: false })
    }
  },

  // 设置压缩结果
  setCompressResult(tempFilePath, compressedFileInfo, compressedImageInfo, ratio) {
    this.setData({
      compressedImageUrl: tempFilePath,
      compressedSize: compressedFileInfo.size,
      compressionRatio: ratio,
      compressedImageInfo: {
        width: compressedImageInfo.width,
        height: compressedImageInfo.height,
        type: compressedImageInfo.type
      }
    })

    wx.showToast({
      title: '压缩成功',
      icon: 'success'
    })
  },

  // 保存图片
  async saveImage() {
    if (!this.data.compressedImageUrl) {
      wx.showToast({
        title: '请先压缩图片',
        icon: 'none'
      })
      return
    }

    try {
      await wx.saveImageToPhotosAlbum({
        filePath: this.data.compressedImageUrl
      })

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.src
    if (!current) return
    
    wx.previewImage({
      current,
      urls: [current]
    })
  }
})
