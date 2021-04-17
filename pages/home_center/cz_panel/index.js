// miniprogram/pages/home_center/cz_panel/index.js.js
import { getDevFunctions, getDeviceDetails, deviceControl } from '../../../utils/api/device-api'
import wxMqtt from '../../../utils/mqtt/wxMqtt'


Page({

  /**
   * 页面的初始数据
   */
  data: {
    device_name: '',
    titleItem: {
      code: '',
      name: '',
      value: '',
    },
    roDpList: {}, //只上报功能点
    rwDpList: {}, //可上报可下发功能点
    isRoDpListShow: false,
    isRwDpListShow: false,
    forest: '../../../image/forest@2x.png',
    active: 0,
    iconkg: {
      normal: 'http://qty83k.creatby.com/materials/195302/origin/f21c132b9fb95a6357c1170e0a506089_origin.png',
      active: 'http://qty83k.creatby.com/materials/195302/origin/a7ae55322173cdbbbc377551cf4a2b04_origin.png',
    },
    iconds: {
      normal: 'http://qty83k.creatby.com/materials/195302/origin/3755b490e796e2c98252cfb3180b6daa_origin.png',
      active: 'http://qty83k.creatby.com/materials/195302/origin/12f9adc9822bcc0b139a4e50aee9cc40_origin.png',
    },
    icondjs: {
      normal: 'http://qty83k.creatby.com/materials/195302/origin/5a1b4e7ed9e2784c4c03f924bb612326_origin.png',
      active: 'http://qty83k.creatby.com/materials/195302/origin/095b4df41c275798c8f714402f13a56e_origin.png',
    },
    iconjl: {
      normal: 'http://qty83k.creatby.com/materials/195302/origin/365c64fe03c5b1440c070cc6e2c55831_origin.png',
      active: 'http://qty83k.creatby.com/materials/195302/origin/32e8e3d7856d0c9d312991d06c843d87_origin.png',
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { device_id } = options
    this.setData({ device_id })
    console.log(options)
    // mqtt消息监听
    wxMqtt.on('message', (topic, newVal) => {
      const { status } = newVal
      console.log(newVal)
      this.updateStatus(status)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    const { device_id } = this.data
    const [{ name, status, icon }, { functions = [] }] = await Promise.all([
      getDeviceDetails(device_id),
      getDevFunctions(device_id),
    ]);

    const { roDpList, rwDpList } = this.reducerDpList(status, functions)

    // 获取头部展示功能点信息
    let titleItem = {
      code: '',
      name: '',
      value: '',
    };
    if (Object.keys(rwDpList).length > 0) {
      let keys = Object.keys(rwDpList)[0];
      titleItem = rwDpList[keys];
    } else {
      let keys = Object.keys(roDpList)[0];
      titleItem = roDpList[keys];
    }

    const roDpListLength = Object.keys(roDpList).length
    const isRoDpListShow = Object.keys(roDpList).length > 0
    const isRwDpListShow = Object.keys(rwDpList).length > 0

    this.setData({ titleItem, roDpList, rwDpList, device_name: name, isRoDpListShow, isRwDpListShow, roDpListLength, icon })
  },

  // 分离只上报功能点，可上报可下发功能点
  reducerDpList: function (status, functions) {
    // 处理功能点和状态的数据
    let roDpList = {};
    let rwDpList = {};
    if (status && status.length) {
      status.map((item) => {
        const { code, value } = item;
        let isExit = functions.find(element => element.code == code);
        if (isExit) {
          let rightvalue = value
          // 兼容初始拿到的布尔类型的值为字符串类型
          if (isExit.type === 'Boolean') {
            rightvalue = value == 'true'
          }

          rwDpList[code] = {
            code,
            value: rightvalue,
            type: isExit.type,
            values: isExit.values,
            name: isExit.name,
          };
        } else {
          roDpList[code] = {
            code,
            value,
            name: code,
          };
        }
      });
    }
    return { roDpList, rwDpList }
  },

  sendDp: async function (e) {
    const { dpCode, value } = e.detail
    const { device_id } = this.data

    const { success } = await deviceControl(device_id, dpCode, value)
  },
//这里是添加的大图标点击事件
  sendDptitlefalse: async function () {
    const { dpCode } = {dpCode: this.data.titleItem.code}
    const { value } = {value: true}
    const { device_id } = this.data

    const { success } = await deviceControl(device_id, dpCode, value)
    console.log(value)
  },
  sendDptitletrue: async function () {
    const { dpCode } = {dpCode: this.data.titleItem.code}
    const { value } = {value: true}
    const { device_id } = this.data

    const { success } = await deviceControl(device_id, dpCode, value)
    console.log(value)
  },

  updateStatus: function (newStatus) {
    let { roDpList, rwDpList, titleItem } = this.data

    newStatus.forEach(item => {
      const { code, value } = item

      if (typeof roDpList[code] !== 'undefined') {
        roDpList[code]['value'] = value;
      } else if (rwDpList[code]) {
        rwDpList[code]['value'] = value;
      }
    })

    // 更新titleItem
    if (Object.keys(roDpList).length > 0) {
      let keys = Object.keys(roDpList)[0];
      titleItem = roDpList[keys];
    } else {
      let keys = Object.keys(rwDpList)[0];
      titleItem = rwDpList[keys];
    }
 
    this.setData({ titleItem, roDpList: { ...roDpList }, rwDpList: { ...rwDpList } })
  },

  //tabbar切换代码
  tabonChange(event) {
    this.setData({ active: event.detail });
    console.log(event.detail)
  },

  jumpTodeviceEditPage: function(){
    console.log('jumpTodeviceEditPage')
    const { icon, device_id, device_name } = this.data
    wx.navigateTo({
      url: `/pages/home_center/device_manage/index?device_id=${device_id}&device_name=${device_name}&device_icon=${icon}`,
    })
  }
})