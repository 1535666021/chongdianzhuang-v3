/**
 * P0-165-R3 政策配置包（甲方拍板口径单一来源）
 * ① 出差单免扣点 + 补助30/台
 * ② 安装费按套餐分档：20米=200 / 30米=300 / 自定义归300
 * ③ 普通单扣点10%（20%作废），负号约定：扣点一律存负数
 * ④ 漏保矩阵（仅漏保器）：领克全不含 / 五菱3.5kW不含 / 其余含
 *    漏保盒=每单必含，全品牌无例外（与漏保器分列常量，禁止混排）
 */
export const POLICY_FIX_VERSION = 'p0-165-r6'
export const PLATFORM_FEE_RATE = 0.1
export const TRIP_SUBSIDY_PER_UNIT = 30
export const INSTALL_FEE_TIERS: Record<number, number> = { 20: 200, 30: 300 }
export const INSTALL_FEE_DEFAULT = 300
/** 漏保矩阵（漏保器品牌规则） */
export const BREAKER_EXCLUDE_BRANDS = ['领克']
export const BREAKER_EXCLUDE_WULING_POWER = '3.5'
/** 漏保器别名清单（矩阵含否对象） */
export const BREAKER_DEVICE_NAMES = ['漏保', '漏电保护器', '漏保开关']
/** 漏保盒清单（每单必含，全品牌无例外） */
export const BREAKER_BOX_NAMES = ['漏保盒']
/** 出差窗口：完成日期∈[2026-09-01, TRIP_END] 的已完成单全部视为出差；窗口外恢复启发式（扣点0→出差） */
export const POLICY_FIX_TRIP_START = '2026-09-01'
export const POLICY_FIX_TRIP_END = '2026-10-15'
/** 修正器：范围与存储键 */
export const POLICY_FIX_RANGE = { start: '2026-09-01', end: '2026-10-31' }
export const POLICY_FIX_BACKUP_KEY = 'cdz_v3_prefix_fix_backup_202610'
export const POLICY_FIX_RUN_AT_KEY = 'cdz_policy_fix_p0165r1_run_at'
