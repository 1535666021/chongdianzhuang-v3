/** P0-166-B：实现已收编至 orderRepairRepository（features/order/repair/repository.ts），本文件为兼容 re-export 层。 */
import { orderRepairRepository } from '../repair/repository'
export const repairGroupNoticeNames = orderRepairRepository.repairGroupNoticeNames
