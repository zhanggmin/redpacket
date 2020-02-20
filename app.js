//app.js
var md5 = require('utils/md5.js')
var loginInfo={};
var qcloud = require('./vendor/wafer2-client-sdk/index');
App({
  setConfig: { 
    url: 'http://192.168.0.104/bns/public/api/bns',
    file_url: 'http://192.168.0.104/bns/public',
    hb_appid: 'hb_gnpu',
    hb_appsecret: 'KXsC5gqCr52O2nDw'
    },
  onLaunch: function () {
    qcloud.setLoginUrl(this.setConfig.url+'/public/login');
    var session = qcloud.Session.get();
    if (session && session.hasOwnProperty("userinfo")) {
      this.globalData.userInfo = session.userinfo;
    } else {
      this.userLogin();
    }
  },
  globalData: {
    userInfo: null,
    token:'',
    timer: null,
    indexHots: [],
    s:'',
    myDevice: null
  },
  getSign: function () {
    var timestamp = Math.round(new Date().getTime() / 1000);
    var sign = md5.md5(this.setConfig.hb_appid + this.setConfig.hb_appsecret + timestamp);
    sign = md5.md5(sign + this.setConfig.hb_appsecret);
    return { appid: this.setConfig.hb_appid, timestamp: timestamp, sign: sign };
  },
  //登录
  userLogin: function(){
    var that = this;
    var codes;
    //获取登录code
    wx.login({
      success: function (res) {
        // console.log(res.code);return false;
        if (res.code) {
          loginInfo.code = res.code;
          codes = res.code;
          //获取用户信息
          wx.getSetting({
            success: res => {
              if (res.authSetting['scope.userInfo']) {
                // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                wx.getUserInfo({
                  success: res => {
                    // 可以将 res 发送给后台解码出 unionId
                    var infoUser = '';
                    that.globalData.userInfo = infoUser = res.userInfo;
                    // 所以此处加入 callback 以防止这种情况
                   
                    //用户信息入库
                    qcloud.login({
                      success(result) {
                        console.log(result);
                        that.globalData.userInfo = result;
                        if (that.userInfoReadyCallback) {
                          that.userInfoReadyCallback(res)
                        }
                      },
                      fail(error) {
                        that.showModel('登录失败', error);
                      }
                    });
                  }
                })
              }else{
                wx.authorize({
                  scope: 'scope.userInfo',
                  success: res => {
                    // 用户同意
                    wx.getUserInfo({
                      success: res => {
                        // 可以将 res 发送给后台解码出 unionId
                        var infoUser = '';
                        that.globalData.userInfo = infoUser = res.userInfo;
                        // 所以此处加入 callback 以防止这种情况
                        if (that.userInfoReadyCallback) {
                          that.userInfoReadyCallback(res)
                        }
                        //用户信息入库
                        //用户信息入库
                        qcloud.loginWithCode({
                          success(result) {
                            that.globalData.userInfo = result;
                            console.log(result);
                            if (that.userInfoReadyCallback) {
                              that.userInfoReadyCallback(result)
                            }
                          },
                          fail(error) {
                            that.showModel('登录失败', error);
                          }
                        }); 
                      }
                    })
                  }
                })
              }
            }
          });
        } else {
          that.userLogin();
          return false;
        }
      }
    })
  },
  
  //提交
  postLogin: function (url, data, callback = function () { }, failCallback = function () { }, completeCallback = function () { }){
    var that = this;
    qcloud.request({
      // 要请求的地址
      url: url,
      data: data,
      success(result) {
        console.log('request success', result);
        callback(result);
      },
      fail(error) {
        console.log('request fail', error);
        failCallback(error);
      },
      complete() {
        console.log('request complete');
        completeCallback();
      }
    });
  },
  // 显示繁忙提示
  showBusy: function (text) {
    wx.showToast({
      title: text,
      icon: 'none',
      duration: 3000
    })
  },
  // 显示成功提示
  showSuccess: function (text) {
    wx.showToast({
      title: text,
      icon: 'success'
    })
  },
  // 显示失败提示
  showModel: function (title, content) {
    {
      wx.hideToast();
      wx.showModal({
        title,
        content: JSON.stringify(content),
        showCancel: false
      });
    } 
  }
})
