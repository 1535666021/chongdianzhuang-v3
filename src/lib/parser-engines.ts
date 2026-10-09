/* ============================================================
 * 解析引擎：键值块解析 + 流式块解析 + 分发器
 * 流式表格行解析器已拆至 parser-stream.ts（P0-090-R2）
 * ============================================================ */

import type { ParsedOrderItem } from './parser-core';
import { PILE_BRAND_KEYWORDS } from '@/constants/brands';
import {
  PHONE_RE, VIN_SEARCH_RE, POWER_RE,
  TIMESTAMP_PREFIX_RE, KEY_VALUE_RE,
  ADDRESS_HINTS, STRONG_ADDRESS_HINTS, NAME_EXCLUDE_RE,
  BRAND_WORDS, PLATFORM_HINT_WORDS,
  KV_FIELD_KEYS, KV_REMARK_KEYS, KV_DISCARD_KEYS, STANDALONE_DISCARD,
  emptyItem, extractPhone, pickKv, cleanAddressText, fillFallbacks,
} from './parser-core';
import { isWanbangBlock, parseWanbangBlock } from './parser-wanbang';
import { isStreamTableRow, parseStreamTableRow, sanitizeStreamLikeAddress, STREAM_PILE_ANY_KV_RE } from './parser-stream';

/* R2-B 单号保护：D/HW 开头的字母数字串是订单号，不得入 VIN */
const ORDER_NO_PREFIX_RE = /^(?:D|HW)/;

/* --------------------------------------------------------------
 * 五、键值块解析
 * -------------------------------------------------------------- */

/** P0-133-R2：子品牌抽取——品牌值命中已知品牌词后剩余部分存subBrand（"吉利银河黑金刚"→吉利+银河黑金刚） */
const KNOWN_BRANDS = ['吉利', '银河', '极氪', '五菱', '挚达', '长安', '零跑', '特斯拉', '比亚迪', '长城', '宝马', '奔驰', '奥迪', '保时捷', '大众', '丰田', '本田', '理想', '蔚来', '小鹏', '问界', '领克', 'smart', '别克', '荣威', '埃安', '哪吒', '深蓝']
function extractSubBrand(item: { brandName?: string; subBrand?: string }): void {
  if (!item.brandName) return
  for (const bw of KNOWN_BRANDS) {
    if (item.brandName.startsWith(bw) && item.brandName.length > bw.length) {
      item.subBrand = item.brandName.slice(bw.length)
      item.brandName = bw
      return
    }
  }
}

export function parseKeyValueBlock(block: string): ParsedOrderItem {
  const item = emptyItem();
  const kv = new Map<string, string>();
  const lines = block.split('\n');
  let userInfo = '';
  for (const rawLine of lines) {
    const line = rawLine.replace(TIMESTAMP_PREFIX_RE, '').trim();
    if (!line) continue;
    const m = line.match(KEY_VALUE_RE);
    if (m) {
      const key = m[1];
      let value = m[2].trim();
      if (KV_DISCARD_KEYS.has(key)) continue;
      if (key === '用户信息' || key === '真实号码') {
        userInfo = value;
        const phoneInInfo = extractPhone(value);
        if (phoneInInfo) {
          const namePart = value.replace(phoneInInfo, '').trim();
          if (namePart) {
            const isChineseOnly = /^[一-龥]+$/.test(namePart);
            if (!isChineseOnly || !NAME_EXCLUDE_RE.test(namePart)) {
              kv.set('_userinfo_name', namePart);
            }
          }
        } else {
          const trimmed = value.trim();
          if (trimmed) {
            const isChineseOnly = /^[一-龥]+$/.test(trimmed);
            if (!isChineseOnly || !NAME_EXCLUDE_RE.test(trimmed)) {
              kv.set('_userinfo_name', trimmed);
            }
          }
        }
        continue;
      }
      if (STANDALONE_DISCARD.has(key) && value.length <= 3) continue;
      if (key === '安装地址') {
        const pm = userInfo.match(PHONE_RE);
        if (pm) {
          const phone = pm[2];
          if (value.startsWith(phone)) value = value.slice(phone.length).trim();
        }
      }
      if (key === '客户姓名' && NAME_EXCLUDE_RE.test(value)) continue;
      if ((key === '联系人' || key === '购车人' || key === '购车人/电话' || key === '联系人/电话') && NAME_EXCLUDE_RE.test(value)) continue;
      kv.set(key, value);
      continue;
    }
    if (PHONE_RE.test(line) && !kv.has('联系电话') && !kv.has('客户手机')) {
      kv.set('联系电话', extractPhone(line));
      continue;
    }
    if (VIN_SEARCH_RE.test(line) && !kv.has('车架号')) {
      const all = line.match(VIN_SEARCH_RE) ?? [];
      const found = all.find((v) => v !== item.orderNo && !ORDER_NO_PREFIX_RE.test(v));
      if (found) kv.set('车架号', found);
      continue;
    }
    if (item.remark) item.remark += '\n';
    item.remark += line;
  }
  item.orderNo = pickKv(kv, KV_FIELD_KEYS.orderNo);
  item.customerName = pickKv(kv, KV_FIELD_KEYS.customerName);
  // P0-123：购车人/联系人值剥离粘连电话（"高测试13800001111"→"高测试"）
  if (item.customerName) item.customerName = item.customerName.replace(/1[3-9]\d{9}/g, '').trim()
  if (!item.customerName && kv.has('_userinfo_name')) {
    item.customerName = kv.get('_userinfo_name')!;
  }
  item.phone = pickKv(kv, KV_FIELD_KEYS.phone);
  item.address = cleanAddressText(pickKv(kv, KV_FIELD_KEYS.address));
  item.brandName = pickKv(kv, KV_FIELD_KEYS.brandName);
  extractSubBrand(item);
  // P0-133-R2：pickKv对品牌值有词表截取——从kv原始值补抽子品牌（"所属品牌：吉利银河黑金刚"→银河黑金刚）
  const brandRaw = kv.get('所属品牌') || kv.get('品牌') || kv.get('品牌型号')
  if (brandRaw && item.brandName && brandRaw.length > item.brandName.length && !item.subBrand) {
    item.subBrand = brandRaw.slice(item.brandName.length)
  }
  item.powerKw = pickKv(kv, KV_FIELD_KEYS.powerKw);
  item.packageMeters = pickKv(kv, KV_FIELD_KEYS.packageMeters);
  item.vin = pickKv(kv, KV_FIELD_KEYS.vin);
  item.serviceType = pickKv(kv, KV_FIELD_KEYS.serviceType);
  item.platformName = pickKv(kv, KV_FIELD_KEYS.platformName);
  if (userInfo && !item.phone) {
    const pm = userInfo.match(PHONE_RE);
    if (pm) item.phone = pm[2];
  }
  const rawRemark = pickKv(kv, KV_REMARK_KEYS);
  if (rawRemark) {
    if (item.remark) item.remark = rawRemark + '\n' + item.remark;
    else item.remark = rawRemark;
  }
  if (item.remark) item.remark = item.remark.trim();
  fillFallbacks(item, block);
  // P0-123+P0-132调和：群公告块姓名=购车人/联系人字段优先（剥离电话）；
  // 无该字段时不清空——保留独立行退化（"订单来源"值经NAME_EXCLUDE_RE与候选长度过滤永不作姓名，两口径一致）
  if (/订单来源[:：]/.test(block)) {
    const gm = block.match(/购车人\/电话[:：]\s*([^\s\d:：]+)/) || block.match(/联系人\/电话[:：]\s*([^\s\d:：]+)/)
    if (gm) item.customerName = gm[1].trim()
  }
  // P0-136：桩名称品牌兜底（KV块同口径）——现有字段无法确定品牌时按桩名称/车辆型号映射识别（最长匹配，歧义保持原样）
  if (!item.brandName || !KNOWN_BRANDS.includes(item.brandName)) {
    const pileText = (block.match(/桩名称[:：]([^\n]+)/)?.[1] || '') + (block.match(/车辆型号[:：]([^\n]+)/)?.[1] || '')
    if (pileText) {
      const matched = PILE_BRAND_KEYWORDS.filter((e) => pileText.includes(e.kw))
      if (matched.length > 0) {
        const maxLen = Math.max(...matched.map((e) => e.kw.length))
        const best = matched.filter((e) => e.kw.length === maxLen)
        if (best.length === 1) item.brandName = best[0].brand
      }
    }
  }
  return item;
}

/* --------------------------------------------------------------
 * 六、流式块解析
 * -------------------------------------------------------------- */

function parseCompactFlowBlock(block: string): ParsedOrderItem | null {
  const text = block.replace(/\s+/g, ' ').trim();
  const identity = text.match(/(?:^|\s)(\d{10,20})\s+([一-龥]{2,4})\s+(1[3-9]\d{9})\s+(.+)$/);
  if (!identity || identity.index === undefined) return null;
  const [, orderNo, customerName, phone, tail] = identity;
  const addressAndRemark = tail.match(/^(.+?)\s+(?:是|否)\s+(.+)$/);
  if (!addressAndRemark) return null;
  const item = emptyItem();
  item.orderNo = orderNo;
  item.customerName = customerName;
  item.phone = phone;
  item.serviceType = text.slice(0, identity.index).replace(/^\d{1,2}\.\d{1,2}\s+/, '').trim();
  const powerMatch = item.serviceType.match(POWER_RE);
  if (powerMatch) item.powerKw = powerMatch[1];
  item.address = addressAndRemark[1].replace(/\s+/g, '');
  item.remark = addressAndRemark[2].trim();
  fillFallbacks(item, text);
  return item;
}

/** P0-140-R3：万联(WL)流式双变体专用解析。
 * 变体1: D单号 WL 车型 Q电话 地址 VIN 7KW 桩 …（姓名段紧贴电话前）
 * 变体2: D单号 WL 地址 姓名 电话 VIN 7KW 桩 …（地址在姓名电话前）
 * 核心：VIN先剥块头匹配（防误中单号）；地址右界锚定防吞串；功率在VIN移除后匹配防粘连。
 */
function parseWanlianFlowBlock(block: string): ParsedOrderItem | null {
  const head = block.match(/^D\d{16}WL/)
  if (!head) return null
  const item = emptyItem()
  item.orderNo = head[0].slice(0, 17)
  let text = block.replace(/\s+/g, ' ').trim()
  // VIN：剥块头后匹配17位必含字母（单号整体移除，无歧义）
  const vinM = text.slice(head[0].length).match(/(?=[A-HJ-NPR-Z0-9]*[A-Z])[A-HJ-NPR-Z0-9]{17}/)
  item.vin = vinM ? vinM[0] : ''
  // 电话11位 + 紧贴前非号码段=姓名（段>6字取尾单字母Q标记；汉字尾=地址臆造置空——甲方口径1）
  let nameSeg = ''
  let isVariant2 = false
  const phoneM = text.match(/1[3-9]\d{9}/)
  if (phoneM) {
    item.phone = phoneM[0]
    const before = text.slice(0, phoneM.index ?? 0).trim()
    const segs = before.split(/\s+/)
    let last = segs[segs.length - 1] || ''
    if (last.length > 6) {
      const tail = before.slice(-1)
      last = /[A-Za-z]/.test(tail) ? tail : ''
    }
    if (last.length <= 6 && !/省|市|县|区|镇|村|街道/.test(last)) nameSeg = last
    isVariant2 = nameSeg !== '' && segs.length > 1
  }
  item.customerName = nameSeg
  // 功率：VIN移除后独立匹配（防VIN尾3781007KW粘连）
  const textNoVin = item.vin ? text.replace(item.vin, ' ') : text
  const kwM = textNoVin.match(/(\d+)KW/)
  if (kwM) {
    const kwAt = kwM.index ?? 0
    const prev = kwAt > 0 ? (textNoVin[kwAt - 1] || '') : ''
    if (!/[0-9A-Za-z]/.test(prev)) item.powerKw = kwM[1]
  }
  // 地址右界锚定：止于 姓名段/电话/VIN/KW/充电桩 任一之前
  const restAfterWl = text.slice(head[0].length).trim()
  const anchors: number[] = []
  if (isVariant2 && nameSeg) anchors.push(restAfterWl.indexOf(nameSeg))
  if (phoneM) anchors.push(restAfterWl.indexOf(phoneM[0]))
  if (item.vin) anchors.push(restAfterWl.indexOf(item.vin))
  const kwIdx = restAfterWl.search(/\d+KW/)
  if (kwIdx >= 0) anchors.push(kwIdx)
  const pileIdx = restAfterWl.indexOf('充电桩')
  if (pileIdx >= 0) anchors.push(pileIdx)
  const rightBound = anchors.filter((x) => x > 0).sort((a, b) => a - b)[0] ?? restAfterWl.length
  // 变体2：地址=WL后~姓名段前；变体1（含Q紧贴）：地址=电话后~锚点前
  let address = ''
  if (isVariant2) {
    address = restAfterWl.slice(0, rightBound).trim()
  } else if (phoneM) {
    const afterPhone = restAfterWl.slice(restAfterWl.indexOf(phoneM[0]) + 11).trim()
    const a2: number[] = []
    if (item.vin) a2.push(afterPhone.indexOf(item.vin))
    a2.push(afterPhone.search(/\d+KW/))
    a2.push(afterPhone.indexOf('充电桩'))
    const rb2 = a2.filter((x) => x > 0).sort((a, b) => a - b)[0] ?? afterPhone.length
    address = afterPhone.slice(0, rb2).trim()
  }
  item.address = address.replace(/\s+/g, '')
  // 车型（变体1）：WL后~电话前，惰性捕获，尾单大写字母（Q标记）剥离
  const modelM = text.match(/WL\s*([\u4e00-\u9fa5A-Za-z0-9]+?)[A-Z]?1[3-9]\d{9}/)
  if (modelM) item.vehicleModel = modelM[1]
  // 桩名称
  const pileM = text.match(/充电桩（([^）]*)）/)
  item.pileName = pileM ? `充电桩（${pileM[1]}）` : ''
  // 安装方式
  const imM = text.match(/(地面壁挂|壁挂|立柱|电表已安装)/)
  item.installMode = imM ? imM[1] : ''
  // 挚达五菱 → 平台挚达+品牌五菱（P0-113-R1二维门槛）
  if (/挚达五菱/.test(text)) { item.platformName = '挚达'; item.brandName = '五菱' }
  else if (/五菱/.test(text)) item.brandName = '五菱'
  // 尾部括号→备注（原文保留）
  const noteM = text.match(/（([^）]*)）\s*$/)
  item.remark = noteM ? noteM[1] : ''
  item.serviceType = '安装'
  item.rawText = block
  return item
}

export function parseFlowBlock(block: string): ParsedOrderItem {
  // P0-140-R3：万联流式双变体优先
  const wanlian = parseWanlianFlowBlock(block)
  if (wanlian) return wanlian
  const compactItem = parseCompactFlowBlock(block);
  if (compactItem) return compactItem;
  const item = emptyItem();
  const lines = block.split('\n');
  const remarks: string[] = [];
  let phoneLine = '';
  let addressLine = '';
  const nameCandidates: string[] = [];
  const brandCandidates: string[] = [];
  const platformCandidates: string[] = [];
  const vinCandidates: string[] = [];
  const orderNoCandidates: string[] = [];
  const serviceTypeCandidates: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.replace(TIMESTAMP_PREFIX_RE, '').trim();
    if (!line) continue;
    if (PHONE_RE.test(line)) {
      const p = extractPhone(line);
      if (p && !phoneLine) phoneLine = p;
      continue;
    }
    if (VIN_SEARCH_RE.test(line)) {
      const all = line.match(VIN_SEARCH_RE) ?? [];
      for (const v of all) {
        if (!vinCandidates.includes(v) && !ORDER_NO_PREFIX_RE.test(v)) vinCandidates.push(v);
      }
      continue;
    }
    if (/^\d{10,20}$/.test(line) && !orderNoCandidates.includes(line)) {
      orderNoCandidates.push(line);
      continue;
    }
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(line) || /^\d{1,2}:\d{2}$/.test(line)) continue;
    if (line.length <= 4 && /^(kw|千瓦|米|套|包|安装|维修|勘察|服务)$/i.test(line)) continue;
    if (line.length < 2) continue;
    // P0-132：键值行（订单来源：…等）不得产生姓名候选——防标签名/值退化
    if (!KEY_VALUE_RE.test(line) && line.length >= 2 && line.length <= 6 && !NAME_EXCLUDE_RE.test(line) && !/\d/.test(line)) {
      if (!nameCandidates.includes(line)) nameCandidates.push(line);
    }
    if (ADDRESS_HINTS.test(line) && STRONG_ADDRESS_HINTS.test(line)) {
      if (!addressLine || line.length > addressLine.length) addressLine = line;
    }
    for (const word of BRAND_WORDS) {
      if (line.toLowerCase().includes(word.toLowerCase()) && !brandCandidates.includes(word)) {
        brandCandidates.push(word)
        // P0-133-R2：候选流子品牌——行内品牌词后的中文/字母数字剩余
        if (!item.subBrand) {
          const m = line.match(new RegExp(word + '([\\u4e00-\\u9fa5A-Za-z0-9]+)'))
          if (m) item.subBrand = m[1]
        }
      }
    }
    for (const word of PLATFORM_HINT_WORDS) {
      if (line.toLowerCase().includes(word.toLowerCase()) && !platformCandidates.includes(word)) platformCandidates.push(word);
    }
    if (/(安装|维修|勘察|勘测|检测|拆桩|移机)/.test(line) && !serviceTypeCandidates.includes(line)) {
      serviceTypeCandidates.push(line);
    }
    remarks.push(line);
  }
  item.phone = phoneLine;
  item.address = sanitizeStreamLikeAddress(addressLine, remarks);
  // P0-123：群公告块（原文含"订单来源"行）姓名永不退化取候选——订单来源值禁止作为姓名
  const isGroupNotice = /订单来源[:：]/.test(block || '')
  if (!isGroupNotice && nameCandidates.length > 0) item.customerName = nameCandidates[0];
  if (brandCandidates.length > 0) item.brandName = brandCandidates[0];
  extractSubBrand(item);
  // P0-136：桩名称品牌兜底——现有字段（KV/候选）无法确定品牌时，按桩名称映射识别（最长匹配；歧义保持原样）
  if (!item.brandName || !KNOWN_BRANDS.includes(item.brandName)) {
    const pileText = (block.match(/桩名称[:：]([^\n]+)/)?.[1] || '') + (block.match(/车辆型号[:：]([^\n]+)/)?.[1] || '')
    if (pileText) {
      const matched = PILE_BRAND_KEYWORDS.filter((e) => pileText.includes(e.kw))
      if (matched.length > 0) {
        const maxLen = Math.max(...matched.map((e) => e.kw.length))
        const best = matched.filter((e) => e.kw.length === maxLen)
        if (best.length === 1) item.brandName = best[0].brand
      }
    }
  }
  // P0-133-R2：终极兜底——brandName已截词但subBrand空时，从块rawText中品牌词后的中文/字母数字剩余补抽
  if (!item.subBrand && item.brandName && (item as any).rawText) {
    const m = (item as any).rawText.match(new RegExp(item.brandName + '([\\u4e00-\\u9fa5A-Za-z0-9]+)'))
    if (m) item.subBrand = m[1]
  }
  if (platformCandidates.length > 0) item.platformName = platformCandidates[0];
  if (vinCandidates.length > 0) item.vin = vinCandidates[0];
  if (orderNoCandidates.length > 0) item.orderNo = orderNoCandidates[0];
  if (serviceTypeCandidates.length > 0) item.serviceType = serviceTypeCandidates[0];
  if (remarks.length > 0) item.remark = remarks.join('\n');
  fillFallbacks(item, block);
  // A2：fillFallbacks 地址兜底可能把疑似流式表格行的整行塞进地址，再剥离一次
  if (item.address && STREAM_PILE_ANY_KV_RE.test(item.address)) {
    const extraRemarks: string[] = [];
    item.address = sanitizeStreamLikeAddress(item.address, extraRemarks);
    if (extraRemarks.length > 0) {
      item.remark = [item.remark, ...extraRemarks].filter(Boolean).join('\n');
    }
  }
  return item;
}

/* --------------------------------------------------------------
 * 七、分发器
 * -------------------------------------------------------------- */

function inferInstallType(item: ParsedOrderItem): void {
  if (item.installType) return;
  const st = (item.serviceType || '').toLowerCase();
  const rm = (item.remark || '').toLowerCase();
  if (st.includes('带桩') || rm.includes('带桩上门')) { item.installType = '带桩上门'; return; }
  if (st.includes('维修')) { item.installType = '维修'; return; }
  if (/勘察|勘测/.test(st)) { item.installType = '勘察'; return; }
  if (st.includes('检测')) { item.installType = '检测'; return; }
  if (st.includes('拆桩')) { item.installType = '拆桩'; return; }
  if (st.includes('移机')) { item.installType = '移机'; return; }
  if (st.includes('安装')) { item.installType = '仅安装'; return; }
  item.installType = '其他';
}

function inferNature(item: ParsedOrderItem): void {
  const text = `${item.serviceType} ${item.remark}`;
  const parsedItem = item as ParsedOrderItem & { nature?: string };
  if (/维修|故障|更换/.test(text)) { parsedItem.nature = '维修'; return; }
  if (/勘察|勘测|测量/.test(text)) { parsedItem.nature = '勘测'; return; }
  if (/补桩/.test(text)) { parsedItem.nature = '补桩'; return; }
  parsedItem.nature = '安装';
}

export function parseBlock(block: string): ParsedOrderItem {
  // P0-140-R3：万联流式双变体最高优先（含空格表格形态，先于wanbang/KV/流式表格分派）
  const wanlianFirst = parseWanlianFlowBlock(block)
  if (wanlianFirst) return wanlianFirst
  if (isWanbangBlock(block)) {
    const item = parseWanbangBlock(block);
    inferInstallType(item);
    inferNature(item);
  const kvSafe = (key: string): string => {
    const m = block.match(new RegExp(key + '[:：]\\s*([^\\n\\r]+)'))
    return m ? m[1].trim() : ''
  }
  // P0-138：外联单统一口径（各解析分支之后应用）——姓名/电话车主优先于联系人；双联系人结构化入库；行尾日期段剥离
  if (/外联单号[:：]/.test(block)) {
    const stripDate = (v: string) => (v || '').replace(/\s*\d{1,2}\.\d{1,2}-\d{1,2}\.\d{1,2}号?/g, '').trim()
    const ownerName = stripDate(kvSafe('车主姓名') || kvSafe('车主'))
    const ownerPhone = stripDate(kvSafe('车主电话'))
    const contactName = stripDate(kvSafe('联系人'))
    const contactPhone = stripDate(kvSafe('联系人电话'))
    if (ownerName || contactName) item.customerName = ownerName || contactName
    if (ownerPhone || contactPhone) item.phone = ownerPhone || contactPhone
    const contacts: Array<{ relation: string; name: string; phone: string }> = []
    if (ownerName) contacts.push({ relation: '车主', name: ownerName, phone: ownerPhone })
    if (contactName) contacts.push({ relation: '联系人', name: contactName, phone: contactPhone })
    if (contacts.length > 0) item.contacts = contacts
  }
    return item;
  }
  const kvLineCount = block.split('\n').filter((l) => KEY_VALUE_RE.test(l.trim())).length;
  const item = kvLineCount >= 2
    ? parseKeyValueBlock(block)
    : isStreamTableRow(block)
      ? parseStreamTableRow(block)
      : parseFlowBlock(block);
  inferInstallType(item);
  inferNature(item);
  return item;
}

export function hasAnyField(item: ParsedOrderItem): boolean {
  return !!(item.orderNo || item.customerName || item.phone || item.address || item.brandName || item.vin);
}
