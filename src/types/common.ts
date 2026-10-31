export type ID = string
export type Timestamp = number

export interface BaseEntity {
  id: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type Platform = '京东' | '天猫' | '淘宝' | '拼多多' | '抖音' | '其他'

export type OrderStatus = '待办' | '待补' | '已预约' | '已完成' | '回收站' // P0-218 任务4：无字段块待补态标

export type InstallType = '带桩上门' | '仅安装' | '维修' | '勘察' | '检测' | '拆桩' | '移机' | '其他'

export type Region = '巢湖' | '合肥' | '芜湖' | '马鞍山' | '滁州' | '宣城' | '安庆' | '其他'
