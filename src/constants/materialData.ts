import { Material } from '../types/material'
import { costMaterials } from './costMaterialData'
import { addonMaterials_batch1 } from './addonMaterialData_batch1_万帮星星充电'
import { addonMaterials_batch2 } from './addonMaterialData_batch2_上汽通用_五菱'
import { addonMaterials_batch3 } from './addonMaterialData_batch3_公牛'
import { addonMaterials_batch4 } from './addonMaterialData_batch4_奇瑞iCAR'
import { addonMaterials_batch5 } from './addonMaterialData_batch5_小米'
import { addonMaterials_batch6 } from './addonMaterialData_batch6_广汽丰田'
import { addonMaterials_batch7 } from './addonMaterialData_batch7_比亚迪'
import { addonMaterials_batch8 } from './addonMaterialData_batch8_特来电'
import { addonMaterials_batch9 } from './addonMaterialData_batch9_空灵吉利'
import { addonMaterials_batch10 } from './addonMaterialData_batch10_空灵零跑'
import { addonMaterials_batch11 } from './addonMaterialData_batch11_捷途_支付宝598'
import { addonMaterials_batch12 } from './addonMaterialData_batch12_领克_阿维塔'
import { addonMaterials_batch13 } from './addonMaterialData_batch13_长城_西安领充'
import { addonMaterials_batch14 } from './addonMaterialData_batch14_广汽埃安_理想'

export const addonMaterialsData: Material[] = [
  addonMaterials_batch1,
  addonMaterials_batch2,
  addonMaterials_batch3,
  addonMaterials_batch4,
  addonMaterials_batch5,
  addonMaterials_batch6,
  addonMaterials_batch7,
  addonMaterials_batch8,
  addonMaterials_batch9,
  addonMaterials_batch10,
  addonMaterials_batch11,
  addonMaterials_batch12,
  addonMaterials_batch13,
  addonMaterials_batch14
].flat()

export const allMaterialsData: Material[] = [
  ...costMaterialsData,
  ...addonMaterialsData
]

export const brandList = [
  '万帮星星充电', '上汽通用', '五菱', '公牛', '奇瑞iCAR', '小米',
  '广汽丰田', '比亚迪', '特来电', '空灵吉利', '空灵零跑',
  '捷途', '支付宝598', '领克', '阿维塔', '长城', '西安领充',
  '广汽埃安', '理想'
]
