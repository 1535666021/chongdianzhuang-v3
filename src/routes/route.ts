export enum RoutePath {
  HOME = '/',
  SCHEDULED = '/scheduled',
  COMPLETED = '/completed',
  MATERIALS = '/materials',
  STATS = '/stats',
  SETTINGS = '/settings',
}

export const ROUTES = [
  { path: RoutePath.HOME, label: '首页', icon: 'Home', status: '待办' as const },
  { path: RoutePath.SCHEDULED, label: '已预约', icon: 'Calendar', status: '已预约' as const },
  { path: RoutePath.COMPLETED, label: '已完成', icon: 'CheckCircle', status: '已完成' as const },
  { path: RoutePath.MATERIALS, label: '材料', icon: 'Package', status: null },
  { path: RoutePath.STATS, label: '统计', icon: 'BarChart', status: null },
  { path: RoutePath.SETTINGS, label: '设置', icon: 'Settings', status: null },
]
