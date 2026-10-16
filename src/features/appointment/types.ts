/**
 * P0-160：预约模块类型定义。
 * 预约字段唯一读写层（见 repository.ts），域外禁止直触订单预约裸字段
 * （appointmentDate/appointmentFrom/appointmentTo/appointmentTime/appointmentPeriod/appointmentNote）。
 */

/** 统一读出口结构：组件消费预约信息的唯一形态 */
export interface AppointmentInfo {
  /** 区间起日 YYYY-MM-DD（单日=当天；无日期=''） */
  from: string
  /** 区间止日 YYYY-MM-DD（排序/徽章/橙条锚点；无日期=''） */
  to: string
  /** 时段（上午/下午/时段码；缺省=''） */
  time: string
  /** 预约备注（可空） */
  note?: string
  /** 展示文本：单日"2026/10/13 · 上午"；区间"2026/10/12 ~ 10/15 · 下午"；脏单"已预约·日期待补"；无日期='' */
  displayText: string
  /** 订单状态=已预约 */
  isAppointed: boolean
  /** 已预约但无有效日期（脏数据标记，卡片橙色兜底） */
  isMissingDate: boolean
}

/** 统一写入口入参（to 留空=与开始同日，P0-157-158 口径） */
export interface AppointmentWriteInput {
  from: string
  to?: string
  time: string
  note?: string
  /** 时段冗余字段（appointmentPeriod），缺省=time；批量弹窗时段码需显式传上午/下午 */
  period?: string
}

/** 写入口结果：联动校验失败时拒绝写入并给出提示文案 */
export type AppointmentWriteResult = { ok: true } | { ok: false; reason: string }

/** 倒计时徽章（P0-145 自 appointmentCountdown.ts 迁入，口径不变） */
export interface CountdownBadge {
  text: string
  tone: 'today' | 'tomorrow' | 'future' | 'expired'
}
