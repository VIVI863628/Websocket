/**
 * Created by admin on 2017/8/19.
 */
// import Vue from 'vue'
// import axios from './HTTP.js'
// Vue.use(axios)
import * as DB from './DBDATA.js'
// import qs from 'qs'
const WebSocketMsg = function (_self, url) {
  let obj = {}
  obj.infoData = DB.INFO_DATA
  obj.ws = null
  obj.lockReconnect = false   // 避免重复连接
  // obj.wsUrl = 'ws://192.168.1.90:8080/service-jcj/websocket'   // 通讯地址
  obj.createWebSocket = function () {      // 通讯开启事件
    try {
      obj.ws = new WebSocket(url)
      obj.initEventHandle()
    } catch (e) {
      obj.reconnect(url)
    }
  }

  obj.initEventHandle = function () {     // 通讯操作事件   开启 消息 关闭 错误
    obj.ws.onclose = function () {
      obj.reconnect(url)      // 通讯重连
      console.log('通讯关闭')
    }
    obj.ws.onerror = function () {
      obj.reconnect(url)       // 通讯重连
      console.log('通讯错误')
    }
    obj.ws.onopen = function () {
      // 心跳检测重置
      obj.heartCheck.reset()      // 心跳检测重置
      obj.heartCheck.start()      // 心跳检测开启
      console.log('通讯开启')
    }
    obj.ws.onmessage = function (event) {
      // 如果获取到消息，心跳检测重置
      // 拿到任何消息都说明当前连接是正常的
      obj.heartCheck.reset()      // 心跳检测重置
      obj.heartCheck.start()      // 心跳检测开启
      console.log('通讯消息')
      console.log(event)
    }
  }
  obj.reconnect = function () {        // 通讯重连
    if (obj.lockReconnect) {        // 如果为真 结束事件 为假 执行后续事件
      return
    }
    obj.lockReconnect = true
    // 没连接上会一直重连，设置延迟避免请求过多
    setTimeout(function () {
      obj.createWebSocket(url)    //  新开启通讯
      obj.lockReconnect = false
    }, 2000)
  }
  // 心跳检测
  obj.heartCheck = {
    timeout: 6000,   // 60秒
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function () {
      clearTimeout(this.timeoutObj)
      clearTimeout(this.serverTimeoutObj)
      return this
    },
    start: function () {
      let that = this
      that.timeoutObj = setTimeout(function () {
        // 这里发送一个心跳，后端收到后，返回一个心跳消息，
        // onmessage拿到返回的心跳就说明连接正常
        obj.ws.send('@')   // 向后端发送消息 如果后端接收  则重置心跳
        that.serverTimeoutObj = setTimeout(function () {  // 如果超过一定时间还没重置，说明后端主动断开了
          obj.ws.close()  // 如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
        }, that.timeout)
      }, that.timeout)
    }
  }
  return obj
}
export default WebSocketMsg
