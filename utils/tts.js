// 百度云语音合成配置
const config = require('../config/secret');

// 缓存token
let accessToken = '';
let tokenExpireTime = 0;

// 当前播放的音频上下文
let currentAudioContext = null;

// 停止当前播放的音频
const stopCurrentAudio = () => {
  if (currentAudioContext) {
    try {
      currentAudioContext.stop();
      currentAudioContext.destroy();
      currentAudioContext = null;
    } catch (e) {
      console.error('停止音频失败:', e);
    }
  }
};

// 将 ArrayBuffer 转换为字符串
const arrayBufferToString = (buffer) => {
  const uint8Array = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < uint8Array.length; i++) {
    str += String.fromCharCode(uint8Array[i]);
  }
  return str;
};

// 获取访问令牌
const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    // 如果令牌未过期，直接返回
    if (accessToken && Date.now() < tokenExpireTime) {
      resolve(accessToken);
      return;
    }

    wx.request({
      url: `${config.baidu.speech.urls.token}?grant_type=client_credentials&client_id=${config.baidu.speech.apiKey}&client_secret=${config.baidu.speech.secretKey}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.access_token) {
          accessToken = res.data.access_token;
          // 令牌有效期30天，这里设置为29天以确保安全
          tokenExpireTime = Date.now() + 29 * 24 * 60 * 60 * 1000;
          resolve(accessToken);
        } else {
          console.error('获取token失败:', res);
          reject(new Error('Failed to get access token'));
        }
      },
      fail: (err) => {
        console.error('请求token失败:', err);
        reject(err);
      }
    });
  });
};

// 文字转语音
const textToSpeech = async (text) => {
  try {
    const token = await getAccessToken();
    
    // 构建请求参数
    const params = {
      tok: token,
      tex: encodeURIComponent(text),
      cuid: 'miniprogram',
      ctp: 1,
      lan: 'zh',     // 语言选择,填写zh
      spd: 9,        // 语速，取值0-15，默认为5中语速
      pit: 5,        // 音调，取值0-15，默认为5中语调
      vol: 5,        // 音量，取值0-15，默认为5中音量
      per: 0,        // 发音人选择, 基础音库：0为度小美
      aue: 3         // 下载的文件格式, 3：mp3
    };

    return new Promise((resolve, reject) => {
      console.log('开始请求音频...');
      console.log('请求参数:', params);
      // 直接发送 POST 请求获取音频数据
      wx.request({
        url: config.baidu.speech.urls.tts,
        method: 'POST',
        responseType: 'arraybuffer',  // 请求音频数据
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: Object.keys(params)
          .map(key => `${key}=${params[key]}`)
          .join('&'),
        success: async (res) => {
          console.log('获取响应:', {
            statusCode: res.statusCode,
            header: res.header,
            dataType: typeof res.data,
            dataLength: res.data?.length
          });

          if (res.statusCode === 200) {
            const contentType = res.header['Content-Type'] || res.header['content-type'] || '';
            
            // 检查是否返回了错误信息
            if (contentType.includes('application/json')) {
              // 将二进制数据转换为文本
              const errorText = arrayBufferToString(res.data);
              console.error('语音合成失败，服务端返回:', errorText);
              try {
                const errorJson = JSON.parse(errorText);
                reject(new Error(`TTS Error: ${errorJson.err_msg || errorText}`));
              } catch (e) {
                reject(new Error(`TTS Error: ${errorText}`));
              }
              return;
            }
            
            // 检查是否返回了音频数据
            if (!contentType.startsWith('audio/')) {
              reject(new Error(`Unexpected content type: ${contentType}`));
              return;
            }

            // 根据返回的内容类型确定文件扩展名
            let fileExt = 'mp3';
            if (contentType.includes('wav')) {
              fileExt = 'wav';
            } else if (contentType.includes('basic')) {
              fileExt = 'pcm';
            }
            
            // 将音频数据写入临时文件
            const fs = wx.getFileSystemManager();
            const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_audio_${Date.now()}.${fileExt}`;
            
            try {
              fs.writeFileSync(tempFilePath, res.data, 'binary');
              console.log('音频数据已写入临时文件:', tempFilePath);

              // 创建音频上下文之前，停止当前正在播放的音频
              stopCurrentAudio();
              
              // 创建音频上下文
              const audioContext = wx.createInnerAudioContext({
                useWebAudioImplement: false  // 使用原生音频播放器
              });
              
              // 保存当前音频上下文的引用
              currentAudioContext = audioContext;
              
              // 设置音频源之前先监听错误事件
              audioContext.onError((err) => {
                console.error('音频播放错误:', err);
                audioContext.destroy();
                // 清理临时文件
                try {
                  fs.unlinkSync(tempFilePath);
                } catch (e) {
                  console.error('清理临时文件失败:', e);
                }
                reject(err);
              });

              // 设置音频源
              audioContext.src = tempFilePath;

              audioContext.onCanplay(() => {
                console.log('音频可以播放了');
              });

              audioContext.onPlay(() => {
                console.log('开始播放语音');
              });

              audioContext.onEnded(() => {
                console.log('语音播放结束');
                audioContext.destroy();
                // 清理临时文件
                try {
                  fs.unlinkSync(tempFilePath);
                } catch (e) {
                  console.error('清理临时文件失败:', e);
                }
                resolve();
              });

              // 设置音频属性
              audioContext.volume = 1.0;
              audioContext.playbackRate = 1.0;

              // 开始播放
              setTimeout(() => {
                console.log('尝试播放音频...');
                audioContext.play();
              }, 100);  // 短暂延迟以确保音频已加载

            } catch (err) {
              console.error('处理音频数据失败:', err);
              reject(err);
            }
          } else {
            console.error('获取音频失败，状态码:', res.statusCode);
            reject(new Error(`Failed to get audio data: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('请求音频失败:', err);
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('语音合成失败:', error);
    throw error;
  }
};

module.exports = {
  textToSpeech,
  stopCurrentAudio
};
