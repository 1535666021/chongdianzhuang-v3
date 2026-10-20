import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Settings,
  Upload,
  DollarSign,
  Package,
  User,
  Sliders,
  RotateCcw,
  Info,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  MessageSquare,
  Type,
  List,
  Sparkles,
  MapPin,
  Calculator,
  Vibrate,
  Wrench,
  ShieldCheck,
} from 'lucide-react'
import { APP_NAME, APP_VERSION, APP_BUILD_TIME } from '@/constants/common'
import { runBrandBackfillManual } from '@/shared/dataFix/backfillBrand'
import { useSettingsStore } from '@/stores/settingsStore'
import CostSheetManager from '../components/CostSheetManager'
import ExtraItemManager from '../components/ExtraItemManager'
import EngineerInfo from '../components/EngineerInfo'
import RestoreFactory from '../components/RestoreFactory'
import PlatformConfig from '../components/PlatformConfig'
import FormPresets from '../components/FormPresets'
import BrandTemplates from '../components/BrandTemplates'
import WatermarkTemplate from '../components/WatermarkTemplate'
import LingpaoTemplate from '../components/LingpaoTemplate'
import ScriptManager from '../components/ScriptManager'
import AmapConfig from '../components/AmapConfig'
import SalaryCalculator from '../components/SalaryCalculator'
import PolicyFixTool from '../components/PolicyFixTool'
import TripFeeZeroTool from '../components/TripFeeZeroTool'
import BreakerCostBackfillTool from '../components/BreakerCostBackfillTool'
import ProfitAuditTool from '../components/ProfitAuditTool'
type SettingSection =
  | 'haptics'
  | 'dupcheck'
  | 'cost'
  | 'addon'
  | 'engineer'
  | 'platform'
  | 'backup'
  | 'reset'
  | 'about'
  | 'presets'
  | 'brand'
  | 'watermark'
  | 'lingpao'
  | 'scripts'
  | 'map'
  | 'salary'
  | 'policyfix'
  | 'profitAudit' | 'tripfix' | 'breakercost'
  | null
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>(null)
  const [isChecking, setIsChecking] = useState(false)
  const navigate = useNavigate()
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled)
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled)
  const { checkNow, toast } = useOutletContext<{ checkNow: () => Promise<boolean>; toast: { success: (message: string) => void } }>()
  const handleVersionCheck = async () => { if (isChecking) return; setIsChecking(true); if (!await checkNow()) toast.success('当前已是最新版本'); window.setTimeout(() => setIsChecking(false), 3000) }
  const menuItems = [
    { id: 'backup' as const, label: '数据导入', icon: Upload, desc: '从老系统导入订单数据' },
    { id: 'dupcheck' as const, label: '订单查重', icon: ShieldCheck, desc: '铁重/疑重扫描与自动清理（数据全程本地）' },
    { id: 'map' as const, label: '地图配置', icon: MapPin, desc: '高德Key、缩放级别' },
    { id: 'cost' as const, label: '成本表管理', icon: DollarSign, desc: '编辑20项辅材成本价' },
    { id: 'addon' as const, label: '增项表管理', icon: Package, desc: '编辑572项增项材料价格' },
    { id: 'engineer' as const, label: '工程师信息', icon: User, desc: '姓名、电话、收货地址' },
    { id: 'platform' as const, label: '平台配置', icon: Sliders, desc: '各平台扣点比例设置' },
    { id: 'presets' as const, label: '表单预设', icon: ClipboardList, desc: '勘测/完工默认值' },
    { id: 'brand' as const, label: '品牌话术', icon: MessageSquare, desc: '各品牌专用话术模板' },
    { id: 'watermark' as const, label: '水印设置', icon: Type, desc: '图片水印文字配置' },
    { id: 'lingpao' as const, label: '零跑模板', icon: List, desc: '零跑品牌增项模板' },
    { id: 'scripts' as const, label: '话术生成', icon: Sparkles, desc: '品牌话术模板管理' },
    { id: 'salary' as const, label: '工资计算器', icon: Calculator, desc: '快速估算单笔订单工资' },
    { id: 'policyfix' as const, label: '9-10月旧账修正', icon: Wrench, desc: '政策包自动重算（一次性）' },
    { id: 'tripfix' as const, label: '出差扣点归0', icon: Wrench, desc: '存量出差单platformFee修正（一次性）' },
    { id: 'breakercost' as const, label: '漏保成本回填', icon: ShieldCheck, desc: 'P0-197-R1 漏保矩阵语义反转后存量材料成本纠正（幂等）' },
    { id: 'profitAudit' as const, label: '利润一致性巡检', icon: ShieldCheck, desc: 'actualProfit重算核对回写（一次性）' },
    { id: 'haptics' as const, label: '触感反馈', icon: Vibrate, desc: '复制/删除/预约成功轻震' },
    { id: 'reset' as const, label: '恢复出厂设置', icon: RotateCcw, desc: '清空所有本地数据' },
    { id: 'about' as const, label: '关于', icon: Info, desc: `${APP_NAME} v${APP_VERSION}` },
  ] as const

  const handleItemClick = (id: SettingSection) => {
    if (id === 'haptics') { setHapticsEnabled(!hapticsEnabled); return } // P0-146：行内开关，不进子面板
    if (id === 'backup') {
      navigate('/settings/backup')
      return
    }
    // P0-196-R2：订单查重独立页
    if (id === 'dupcheck') {
      navigate('/settings/dupcheck')
      return
    }
    if (id === activeSection) {
      setActiveSection(null)
    } else {
      setActiveSection(id)
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'cost':
        return <CostSheetManager />
      case 'addon':
        return <ExtraItemManager />
      case 'engineer':
        return <EngineerInfo />
      case 'platform':
        return <PlatformConfig />
      case 'presets':
        return <FormPresets />
      case 'brand':
        return <BrandTemplates />
      case 'watermark':
        return <WatermarkTemplate />
      case 'lingpao':
        return <LingpaoTemplate />
      case 'scripts':
        return <ScriptManager />
      case 'map':
        return <AmapConfig />
      case 'salary':
        return <SalaryCalculator />
      case 'policyfix':
        return <PolicyFixTool />
      case 'tripfix':
        return <TripFeeZeroTool />
      case 'breakercost':
        return <BreakerCostBackfillTool />
      case 'profitAudit':
        return <ProfitAuditTool />
      case 'reset':
        return <RestoreFactory />
      case 'about':
        return (
          <div className="p-4 text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-3">
              <Settings size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{APP_NAME}</h3>
            <button type="button" disabled={isChecking} onClick={handleVersionCheck} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{isChecking ? '检测中...' : `版本 v${APP_VERSION}`}</button>
            {APP_BUILD_TIME && <p className="text-xs text-gray-400">构建时间：{APP_BUILD_TIME}</p>}
            {/* P0-102：品牌数据修正手动入口（可重复执行，幂等） */}
            <button type="button" onClick={() => runBrandBackfillManual()} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>品牌数据修正</button>
            <p className="text-xs text-gray-400 mt-4">专为充电桩安装工打造</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-800">设置</h1>
      </div>

      <div className="px-4 py-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id
          const Icon = item.icon

          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-white border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-blue-600' : 'text-gray-500'}
                    />
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                </div>
                {item.id === 'haptics' ? (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${hapticsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{hapticsEnabled ? '开' : '关'}</span>
                ) : isActive ? (
                  <ChevronDown size={16} className="text-blue-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </button>

              {isActive && (
                <div className="mt-1 mx-1">
                  {renderSection()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
