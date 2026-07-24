export enum RoutePath {
  HOME = '/',
  ORDERS = '/orders',
  ORDER_NEW = '/order/new',
  ORDER_EDIT = '/order/edit',
  MATERIALS = '/materials',
  STATS = '/stats',
  SETTINGS = '/settings',
  BATCH_PARSER = '/batch-parser',
}

export const ROUTES = [
  { path: RoutePath.HOME, label: '首页', icon: 'Home' },
  { path: RoutePath.ORDERS, label: '订单', icon: 'ClipboardList' },
  { path: RoutePath.MATERIALS, label: '材料', icon: 'Package' },
  { path: RoutePath.STATS, label: '统计', icon: 'BarChart3' },
  { path: RoutePath.SETTINGS, label: '设置', icon: 'Settings' },
]
