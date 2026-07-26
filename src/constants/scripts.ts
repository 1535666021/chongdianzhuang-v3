export interface ScriptTemplate {
  id: string
  brand: string
  scene: string
  content: string
  variables: ScriptVariable[]
}

export interface ScriptVariable {
  name: string
  label: string
  defaultValue: string
}

export const DEFAULT_SCRIPT_VARIABLES: ScriptVariable[] = [
  { name: 'customerName', label: '客户姓名', defaultValue: '' },
  { name: 'address', label: '安装地址', defaultValue: '' },
  { name: 'date', label: '日期', defaultValue: '' },
  { name: 'amount', label: '金额', defaultValue: '' },
  { name: 'installer', label: '安装工', defaultValue: '谢责强' },
  { name: 'phone', label: '联系电话', defaultValue: '15395147568' },
  { name: 'brand', label: '品牌', defaultValue: '' },
  { name: 'notes', label: '备注', defaultValue: '' },
]

export const DEFAULT_SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'lingpao-install',
    brand: '零跑',
    scene: '安装前确认',
    content: `您好{{customerName}}，我是零跑充电桩安装工程师{{installer}}，电话{{phone}}。

明天{{date}}前往{{address}}为您安装充电桩，请确保：
1. 车位可正常进入
2. 配电室有施工空间
3. 如有物业要求，请提前沟通

预计费用：{{amount}}元（含材料+人工）
如有疑问请随时联系。`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lingpao-complete',
    brand: '零跑',
    scene: '完成告知',
    content: `{{customerName}}您好，充电桩已安装完成！

安装地址：{{address}}
安装品牌：{{brand}}
安装工程师：{{installer}} {{phone}}

已完成项目：
- 充电桩主机安装
- 电缆敷设
- 配电箱接线
- 通电测试

如有任何问题请随时联系，祝您用车愉快！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'geely-install',
    brand: '吉利',
    scene: '安装前确认',
    content: `尊敬的{{customerName}}，您好！

我是吉利充电桩安装服务工程师{{installer}}，联系电话{{phone}}。

将于{{date}}到{{address}}进行充电桩安装服务。

温馨提示：
1. 请提前与物业确认施工许可
2. 确保车位及配电室通道畅通
3. 费用明细：{{amount}}元

期待为您服务！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'byd-install',
    brand: '比亚迪',
    scene: '安装前确认',
    content: `{{customerName}}您好，我是比亚迪充电桩安装工程师{{installer}}。

预约时间：{{date}}
安装地址：{{address}}
联系电话：{{phone}}

费用说明：{{amount}}元（材料+人工+服务费）

请提前准备：
1. 车位使用证明
2. 物业同意书（如需要）
3. 确保配电室可进入

谢谢配合！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'ideal-install',
    brand: '理想',
    scene: '安装前确认',
    content: `{{customerName}}您好，理想汽车充电桩安装服务。

工程师：{{installer}}
电话：{{phone}}
时间：{{date}}
地址：{{address}}

预计费用：{{amount}}元

安装内容：
- 充电桩主机
- 电缆（超出部分另计）
- 配电箱
- 接地装置

如有变动请提前告知。`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'aion-install',
    brand: '埃安',
    scene: '安装前确认',
    content: `尊敬的{{customerName}}，埃安充电桩安装服务。

工程师：{{installer}}（{{phone}}）
上门时间：{{date}}
安装地点：{{address}}

费用：{{amount}}元

注意事项：
1. 车位需有施工条件
2. 配电室需开放
3. 材料超出30米另计费

感谢选择埃安！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'common-appointment',
    brand: '通用',
    scene: '预约提醒',
    content: `{{customerName}}您好，充电桩安装预约提醒。

预约时间：{{date}}
安装地址：{{address}}
工程师：{{installer}} {{phone}}

请确保：
1. 车位可用
2. 配电室可进入
3. 相关证件准备齐全

费用：{{amount}}元

{{notes}}`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
]
