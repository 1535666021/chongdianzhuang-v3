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
    id: 'default-survey-complete',
    brand: '通用',
    scene: '勘测完成',
    content: `勘测完成时间：{{surveyDate}}
勘测详情：{{installType}}
勘测工程师及电话：{{installer}} / {{phone}}
用电方式：{{powerSource}}
电表状态：{{meterStatus}}
布线距离：{{cableDistance}} 米

预计增项辅材明细：
{{addonItems}}
预计增项合计：¥{{addonTotal}}元（以实际使用为准）
物业需要施工方案图：{{needPlanDoc}}
勘测结果：{{surveyResult}}
（电缆上有准确的米标刻度）
勘测备注：{{surveyNote}}
以上勘测情况请您回复"确认"，谢谢`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'default-install-complete',
    brand: '通用',
    scene: '安装完成',
    content: `完工总结：已完成安装
完工时间：{{completeDate}}
品牌：{{platformBrand}}
用户信息：{{customerName}}
联系电话：{{phone}}
地址：{{address}}
取电方式：{{powerSource}}
安装详情：{{installDetail}}
使用电缆 {{actualCable}} 米。{{addonSummary}}
安装工程师：{{installer}}
电话：{{phone}}`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lixiang-pre-visit',
    brand: '理想',
    scene: '上门前',
    content: `尊敬的理想车主您好，如我们所约{{appointmentDate}}{{timeSlot}}上门为您勘测
安装工程师：{{installer}}
电话：{{phone}}
预计{{appointmentDate}}{{timeSlot}}左右到达，请您知悉，如遇到堵车、交通意外或者其他突发情况我们会第一时间与您联系告知，若有任何问题，请随时联系我们`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lixiang-survey-complete',
    brand: '理想',
    scene: '勘测完成',
    content: `勘测总结：理想
勘测时间：{{surveyDate}}
车主姓名:{{customerName}}
联系电话：{{phone}}
勘测地址:{{address}}
电源点性质：{{powerSource}}
安装方式：{{installType}}
材料预估: 国标 YJV-3*6mm²阻燃铜芯电缆{{cableDistance}}米
增项费用:布线{{cableDistance}}米，超出套餐{{overMeters}}米×¥{{overPrice}}=¥{{overFee}}
物业是否允许施工：{{propertyAllow}}
备注：{{surveyNote}}。
温馨提示：因电表未安装，本次勘测记录的布线长度仅作为初步参考，非最终施工标准。正式安装前，我们将安排专业人员再次实地勘测确认实际线缆长度，具体收费将以最终安装的实际用量为准，鉴于现场环境的复杂性，勘测数据与实际安装距离可能存在偏差，此情况属于正常现象，特此提前说明。
尊敬的 理想车主您好！这是您本次的勘测信息，麻烦您确认一下。回复"确认"即可，谢谢！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lixiang-install-complete',
    brand: '理想',
    scene: '安装完成',
    content: `【安装总结】：已完成安装
安装时间：{{completeDate}}
客户姓名：{{customerName}}
客户手机：{{phone}}
安装城市：{{city}}
品牌：{{platformBrand}}
安装地址：{{address}}
电源点性质：{{powerSource}}
安装方式：{{installType}}
材料用量: 国标 YJV-3*6mm²阻燃铜芯电缆 ：{{actualCable}}米
{{addonSummary}}
尊敬的 客户您好！您的充电桩已经安装完成，安装完成并不代表服务结束，您的桩和安装质保期为 4 年，后期充电桩出现任何故障您可以直在群内联系，我们将竭诚为您服务，祝您用车愉快`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'byd-pre-visit',
    brand: '比亚迪',
    scene: '上门前',
    content: `{{customerName}}您好，我是比亚迪充电桩安装工程师{{installer}}。
预约时间：{{appointmentDate}} {{timeSlot}}
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
    id: 'byd-survey-complete',
    brand: '比亚迪',
    scene: '勘测完成',
    content: `比亚迪勘测报告
勘测时间：{{surveyDate}}
客户：{{customerName}} {{phone}}
地址：{{address}}
电源点：{{powerSource}}
安装方式：{{installType}}
电缆距离：{{cableDistance}}米
电表状态：{{meterStatus}}
预估增项：
{{addonItems}}
合计：¥{{addonTotal}}元
勘测结果：{{surveyResult}}
备注：{{surveyNote}}
请回复"确认"安排安装。`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'byd-install-complete',
    brand: '比亚迪',
    scene: '安装完成',
    content: `【比亚迪安装完成】
完工时间：{{completeDate}}
客户：{{customerName}} {{phone}}
地址：{{address}}
品牌：{{platformBrand}}
电缆用量：{{actualCable}}米
{{addonSummary}}
安装工程师：{{installer}} {{phone}}
质保期：4年
如有问题请随时联系，祝您用车愉快！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'xiaomi-pre-visit',
    brand: '小米',
    scene: '上门前',
    content: `{{customerName}}您好，小米充电桩安装服务。
工程师：{{installer}}（{{phone}}）
上门时间：{{appointmentDate}} {{timeSlot}}
安装地点：{{address}}
费用：{{amount}}元
注意事项：
1. 车位需有施工条件
2. 配电室需开放
3. 材料超出30米另计费
感谢选择小米！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'xiaomi-survey-complete',
    brand: '小米',
    scene: '勘测完成',
    content: `小米勘测报告
勘测日期：{{surveyDate}}
客户姓名：{{customerName}}
联系电话：{{phone}}
勘测地址：{{address}}
电源点性质：{{powerSource}}
安装方式：{{installType}}
布线距离：{{cableDistance}}米
预估材料：
{{addonItems}}
预估费用：¥{{addonTotal}}元
勘测结果：{{surveyResult}}
备注：{{surveyNote}}
请确认后安排安装。`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'xiaomi-install-complete',
    brand: '小米',
    scene: '安装完成',
    content: `【小米安装完成】
安装时间：{{completeDate}}
客户：{{customerName}} {{phone}}
地址：{{address}}
品牌：{{platformBrand}}
电缆：{{actualCable}}米
{{addonSummary}}
工程师：{{installer}} {{phone}}
质保4年，有问题随时联系！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lingpao-pre-visit',
    brand: '零跑',
    scene: '上门前',
    content: `您好{{customerName}}，我是零跑充电桩安装工程师{{installer}}，电话{{phone}}。
{{appointmentDate}}{{timeSlot}}前往{{address}}为您安装充电桩，请确保：
1. 车位可正常进入
2. 配电室有施工空间
3. 如有物业要求，请提前沟通
预计费用：{{amount}}元（含材料+人工）
如有疑问请随时联系。`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lingpao-survey-complete',
    brand: '零跑',
    scene: '勘测完成',
    content: `零跑勘测报告
勘测时间：{{surveyDate}}
客户：{{customerName}} {{phone}}
地址：{{address}}
电源点：{{powerSource}}
安装方式：{{installType}}
电缆距离：{{cableDistance}}米
电表状态：{{meterStatus}}
预估增项：
{{addonItems}}
合计：¥{{addonTotal}}元
勘测结果：{{surveyResult}}
备注：{{surveyNote}}
请回复"确认"。`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'lingpao-install-complete',
    brand: '零跑',
    scene: '安装完成',
    content: `{{customerName}}您好，零跑充电桩已安装完成！
安装地址：{{address}}
安装品牌：{{brand}}
安装工程师：{{installer}} {{phone}}
已完成项目：
- 充电桩主机安装
- 电缆敷设
- 配电箱接线
- 通电测试
电缆用量：{{actualCable}}米
{{addonSummary}}
如有任何问题请随时联系，祝您用车愉快！`,
    variables: DEFAULT_SCRIPT_VARIABLES,
  },
  {
    id: 'common-pre-visit',
    brand: '通用',
    scene: '上门前',
    content: `{{customerName}}您好，充电桩安装预约提醒。
预约时间：{{appointmentDate}} {{timeSlot}}
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
