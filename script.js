/* APASS 退费进度页 - 功能二实现（Mock 数据 + 退费规则引擎 + 易快报流转模拟） */
(function () {
  'use strict';
  var HOUR = 3600 * 1000;
  var NOW = Date.now();
  var CUR = { HKD: 'HK$', CNY: '¥' };
  function ts(h) { return NOW + h * HOUR; }
  function money(cur, n) { return CUR[cur] + Number(n).toLocaleString('zh-CN'); }
  function nowStr() {
    var d = new Date();
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------- Mock 数据（订单维度，商品为四种套餐；字段对齐需求表 4） ---------- */
  var ORDERS = [
    { id: 1,  student: '王小明', phone: '138****2211', orderNo: 'NS202609180001', payTime: '2026-09-18 09:12', items: [{ name: 'APASS会员高中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-5), examStart: ts(24 * 30), stage: '', cost: 0 },
    { id: 2,  student: '王小明', phone: '138****2211', orderNo: 'MP202609100012', payTime: '2026-09-10 10:20', items: [{ name: 'APASS会员小学1-3套餐', price: 298 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 8), examStart: ts(24 * 30), stage: '', cost: 0 },
    { id: 3,  student: '李小红', phone: '139****0533', orderNo: 'MP202608200088', payTime: '2026-08-20 15:41', items: [{ name: 'APASS会员初中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 29), examStart: ts(24 * 20), stage: '', cost: 180 },
    { id: 4,  student: '陈晓',   phone: '137****8864', orderNo: 'MP202607050021', payTime: '2026-07-05 11:03', items: [{ name: 'APASS会员高中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'HKD', paidAt: ts(-24 * 75), examStart: ts(-24 * 3), stage: 'started2d', cost: 0 },
    { id: 5,  student: '周晓岚', phone: '150****3321', orderNo: 'MP202609190003', payTime: '2026-09-06 19:22', items: [{ name: 'APASS会员小学4-6套餐', price: 1280 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 12), examStart: ts(20), stage: '', cost: 0 },
    { id: 6,  student: '王小明', phone: '138****2211', orderNo: 'MP202605120088', payTime: '2026-05-12 14:30', items: [{ name: 'APASS会员小学1-3套餐', price: 298 }, { name: 'APASS会员初中套餐', price: 398 }], amount: 696, refunded: 298, orderStatus: '已缴费', progress: '退款完成', submitter: '张明', applyTime: '2026-06-02 10:11', approverTime: '2026-06-02 15:40', refundTime: '2026-06-03 09:02', currency: 'CNY', paidAt: ts(-24 * 128), examStart: ts(24 * 40), stage: '', cost: 180 },
    { id: 7,  student: '周晓岚', phone: '150****3321', orderNo: 'MP202606180009', payTime: '2026-06-18 16:05', items: [{ name: 'APASS会员小学4-6套餐', price: 1280 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '负责人审批驳回', submitter: '张明', applyTime: '2026-07-01 09:30', approverTime: '2026-07-01 14:12', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 92), examStart: ts(24 * 30), stage: '', cost: 100 },
    { id: 8,  student: '李小红', phone: '139****0533', orderNo: 'MP202609050076', payTime: '2026-09-05 12:44', items: [{ name: 'APASS会员高中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '等待退费中', submitter: '张明', applyTime: '2026-09-15 10:00', approverTime: '2026-09-15 16:20', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 13), examStart: ts(24 * 25), stage: '', cost: 180 },
    { id: 9,  student: '陈晓',   phone: '137****8864', orderNo: 'MP202608280054', payTime: '2026-08-28 09:58', items: [{ name: 'APASS会员初中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '退款失败', submitter: '张明', applyTime: '2026-09-08 11:26', approverTime: '2026-09-08 17:03', refundTime: '', currency: 'HKD', paidAt: ts(-24 * 21), examStart: ts(24 * 30), stage: '', cost: 150 },
    { id: 10, student: '周晓岚', phone: '150****3321', orderNo: 'MP202605010022', payTime: '2026-05-01 20:17', items: [{ name: 'APASS会员小学1-3套餐', price: 298 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '财务审批驳回', submitter: '张明', applyTime: '2026-05-20 09:45', approverTime: '2026-05-25 11:20', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 139), examStart: ts(24 * 15), stage: '', cost: 0 },
    { id: 11, student: '王小明', phone: '138****2211', orderNo: 'MP202603120088', payTime: '2026-03-12 11:31', items: [{ name: 'APASS会员高中套餐', price: 398 }], amount: 398, refunded: 398, orderStatus: '已退费', progress: '退款完成', submitter: '张明', applyTime: '2026-03-18 10:02', approverTime: '2026-03-18 15:31', refundTime: '2026-03-19 09:15', currency: 'CNY', paidAt: ts(-24 * 190), examStart: ts(-24 * 100), stage: '', cost: 0 },
    { id: 12, student: '郭子睿', phone: '186****7742', orderNo: 'MP202609180010', payTime: '2026-09-18 09:30', items: [{ name: 'APASS会员小学1-3套餐', price: 298 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 2), examStart: ts(24 * 30), stage: '', cost: 0 }
  ];

  /* 来源与品类：source = APASS平台 / 小程序加购 / 小程序续费；category = APASS会员 / 其他 */
  var SOURCE_MAP = { 1: 'APASS平台', 2: '小程序续费', 3: '小程序加购', 4: '小程序加购', 5: '小程序加购', 6: '小程序加购', 7: '小程序续费', 8: '小程序续费', 9: '小程序加购', 10: '小程序加购', 11: '小程序续费', 12: '小程序加购' };
  ORDERS.forEach(function (o) { o.source = SOURCE_MAP[o.id] || '小程序加购'; o.category = 'APASS会员'; });
  var FORM_NAME_MAP = { 3: '2024年澳大利亚数学测评AMC', 4: '2025年英国物理测评BPhO', 5: '2024年袋鼠数学思维挑战', 6: '2025年美国数学测评AMC 8', 9: '2025年英国生物测评BBO', 10: '2025年全美数学测评AMC 10', 12: '2024年澳大利亚数学测评AMC' };
  ORDERS.forEach(function (o) { if (o.source === '小程序加购' && o.category === 'APASS会员') o.formName = FORM_NAME_MAP[o.id] || '2024年澳大利亚数学测评AMC'; });
  /* 非 APASS 套餐订单：不出现在退费进度列表与"新增退费"订单选择中 */
  ORDERS.push(
    { id: 13, student: '王小明', phone: '138****2211', orderNo: 'MP202609080015', payTime: '2026-09-08 13:26', items: [{ name: '雅思机考考位费', price: 2200 }], amount: 2200, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 10), examStart: ts(24 * 30), stage: '', cost: 0, source: '小程序加购', category: '其他' },
    { id: 14, student: '陈晓',   phone: '137****8864', orderNo: 'NS202609010063', payTime: '2026-09-01 10:05', items: [{ name: 'APASS 周边礼盒', price: 150 }], amount: 150, refunded: 0, orderStatus: '已缴费', progress: '', submitter: '', applyTime: '', approverTime: '', refundTime: '', currency: 'HKD', paidAt: ts(-24 * 17), examStart: ts(24 * 30), stage: '', cost: 0, source: 'APASS平台', category: '其他' }
  );
  /* 追加在途退费订单（进度 ≥ 已提交易快报），用于退费进度列表与分页演示 */
  ORDERS.push(
    { id: 15, student: '李小红', phone: '139****0533', orderNo: 'MP202608120032', payTime: '2026-08-12 10:05', items: [{ name: 'APASS会员初中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '已提交易快报', submitter: '张明', applyTime: '2026-09-16 09:40', approverTime: '', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 37), examStart: ts(24 * 26), stage: '', cost: 0, source: '小程序续费', category: 'APASS会员' },
    { id: 16, student: '陈晓',   phone: '137****8864', orderNo: 'NS202607200047', payTime: '2026-07-20 15:22', items: [{ name: 'APASS会员高中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '负责人审批完成', submitter: '张明', applyTime: '2026-08-30 11:15', approverTime: '2026-08-30 16:02', refundTime: '', currency: 'HKD', paidAt: ts(-24 * 60), examStart: ts(24 * 12), stage: '', cost: 0, source: 'APASS平台', category: 'APASS会员' },
    { id: 17, student: '周晓岚', phone: '150****3321', orderNo: 'MP202604150066', payTime: '2026-04-15 09:48', items: [{ name: 'APASS会员小学4-6套餐', price: 1280 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '财务审批完成', submitter: '张明', applyTime: '2026-08-10 14:30', approverTime: '2026-08-10 18:20', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 155), examStart: ts(24 * 30), stage: '', cost: 0, source: '小程序加购', category: 'APASS会员', formName: '2025年全美数学测评AMC 12' },
    { id: 18, student: '郭子睿', phone: '186****7742', orderNo: 'MP202606020018', payTime: '2026-06-02 11:26', items: [{ name: 'APASS会员小学1-3套餐', price: 298 }], amount: 298, refunded: 0, orderStatus: '已缴费', progress: '等待退费中', submitter: '张明', applyTime: '2026-08-22 10:10', approverTime: '2026-08-22 15:44', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 108), examStart: ts(24 * 18), stage: '', cost: 0, source: '小程序续费', category: 'APASS会员' },
    { id: 19, student: '王小明', phone: '138****2211', orderNo: 'MP202602100029', payTime: '2026-02-10 16:38', items: [{ name: 'APASS会员高中套餐', price: 398 }], amount: 398, refunded: 398, orderStatus: '已退费', progress: '退款完成', submitter: '张明', applyTime: '2026-04-02 09:12', approverTime: '2026-04-02 14:50', refundTime: '2026-04-03 10:05', currency: 'CNY', paidAt: ts(-24 * 220), examStart: ts(-24 * 120), stage: '', cost: 0, source: 'APASS平台', category: 'APASS会员' },
    { id: 20, student: '李小红', phone: '139****0533', orderNo: 'MP202607100051', payTime: '2026-07-10 13:15', items: [{ name: 'APASS会员初中套餐', price: 398 }], amount: 398, refunded: 0, orderStatus: '已缴费', progress: '退款失败', submitter: '张明', applyTime: '2026-08-25 09:55', approverTime: '2026-08-25 15:30', refundTime: '', currency: 'CNY', paidAt: ts(-24 * 70), examStart: ts(24 * 22), stage: '', cost: 0, source: '小程序加购', category: 'APASS会员', formName: '2025年加拿大化学思维挑战CCC' }
  );
  var APASS_ORDERS = ORDERS.filter(function (o) { return o.category === 'APASS会员'; });

  /* ---------- 退费规则引擎 ---------- */
  function decideRule(o) {
    if (o.orderStatus !== '已缴费') return { code: 'BLOCK', label: '当前订单状态（' + o.orderStatus + '）不可发起退费', blocked: true, factor: 0 };
    if (o.category === 'APASS会员') {
      /* APASS退费政策：按开通时间计算。15天内全额退；15天至1个月扣25%服务费；超过1个月默认退款 0，可手动编辑金额 */
      var days = (NOW - o.paidAt) / (24 * HOUR);
      if (days <= 15) return { code: 'AP1', label: 'APASS退费政策 · 开通15天内 · 无条件全额退款', factor: 1 };
      if (days <= 30) return { code: 'AP2', label: 'APASS退费政策 · 开通15天至1个月 · 扣除25%服务费退款', factor: 0.75 };
      return { code: 'AP3', label: 'APASS退费政策 · 开通超过1个月 · 默认退款金额 0，可手动编辑金额', factor: 0 };
    }
    if (NOW - o.paidAt <= 24 * HOUR) return { code: 'R1', label: 'R1 · 付款后 24 小时内 · 无条件全额退款', factor: 1 };
    if (o.stage === 'started2d') return { code: 'R3b', label: 'R3 · 金额 1000 以上 · 项目已开始两天内 · 最多可退 15%', factor: 0.15 };
    if (o.stage === 'exited') return { code: 'R3b', label: 'R3 · 金额 1000 以上 · 项目结束前退出 · 最多可退 15%', factor: 0.15 };
    if (o.examStart - NOW > 48 * HOUR) {
      if (o.amount <= 1000) return { code: 'R2', label: 'R2 · 金额 1000 以内 · 考前 48 小时前 · 无条件全额退款', factor: 1 };
      return { code: 'R3a', label: 'R3 · 金额 1000 以上 · 考前 48 小时前 · 扣除已发生成本后退款（成本 ' + money(o.currency, o.cost) + '，按订单整体退，不支持部分物品）', fixed: Math.max(0, o.amount - o.cost), readonly: true };
    }
    return { code: 'NA', label: '考前 48 小时内至项目开始前 · 规则未覆盖（待确认），暂不可退', blocked: true, factor: 0 };
  }
  /* ---------- DOM ---------- */
  var tbody = document.getElementById('orderTbody');
  var searchInput = document.getElementById('searchInput');
  var progressFilter = document.getElementById('progressFilter');
  var newRefundBtn = document.getElementById('newRefundBtn');
  var tableHint = document.getElementById('tableHint');
  var studentModal = document.getElementById('studentModal');
  var CHAIN = { '已提交易快报': '负责人审批完成', '负责人审批完成': '财务审批完成', '财务审批完成': '等待退费中', '等待退费中': '退款完成' };
  var activeOrder = null;
  var activeChecks = [];

  var REFUND_FORM_DEFAULTS = {
    project: '阿思丹学院A-PASS(CODE32)',
    approver: '王玉蝶',
    entity: '阿思丹(成都)教育科技有限公司',
    dept: '竞赛客服部门'
  };
  var DOC_TYPE_BY_SOURCE = { '小程序加购': '项目退款单（无出纳）', '小程序续费': '项目退款单（无出纳）', 'APASS平台': '项目退款单（无出纳）' };
  function buildRefundTitle(o) {
    var names = o.items.map(function (it) { return it.name; }).join(' + ');
    return o.student + '    ' + names + '×' + o.items.length + '  退费';
  }
  /* 小程序加购：报名表短名 / 报名表对应所属项目 / 报名表下拉显示名 */
  var SHORT_NAME_MAP = {
    '2024年澳大利亚数学测评AMC': 'AMC澳大利亚数学测评',
    '2025年英国物理测评BPhO': 'BPhO英国物理测评',
    '2024年袋鼠数学思维挑战': '袋鼠数学思维挑战',
    '2025年美国数学测评AMC 8': 'AMC 8美国数学测评',
    '2025年英国生物测评BBO': 'BBO英国生物测评',
    '2025年全美数学测评AMC 10': 'AMC 10全美数学测评',
    '2025年全美数学测评AMC 12': 'AMC 12全美数学测评',
    '2025年加拿大化学思维挑战CCC': 'CCC加拿大化学思维挑战'
  };
  function shortFormName(fn) { return SHORT_NAME_MAP[fn] || String(fn || '').replace(/^20\d\d年/, ''); }
  function formDisplayName(fn) { return shortFormName(fn) + ' - 2026 报名表'; }
  function formProject(fn) { return shortFormName(fn) + ' (理工科)'; }
  function buildAddonTitle(o) { return shortFormName(o.formName) + '退费申请-' + o.student; }

  /* ---------- 渲染 ---------- */
  function progressTag(p) {
    if (!p) return '<span class="text-dash">—</span>';
    var cls = 'tag';
    if (p === '负责人审批驳回' || p === '财务审批驳回' || p === '退款失败') cls = 'tag tag--danger';
    else if (p === '等待退费中') cls = 'tag tag--warn';
    else if (p === '退款完成') cls = 'tag tag--ok';
    return '<span class="' + cls + '">' + p + '</span>';
  }
  function statusTag(s) {
    var cls = s === '已退费' ? 'tag tag--muted' : 'tag';
    return '<span class="' + cls + '">' + s + '</span>';
  }
  function sourceTag(s) {
    var cls = s === 'APASS平台' ? 'tag--brand' : (s === '小程序续费' ? 'tag--ok' : 'tag--warn');
    return '<span class="tag ' + cls + '">' + s + '</span>';
  }
  function opCell(o) {
    var refundBtn;
    if (o.progress) {
      refundBtn = '<button class="btn btn--sm btn--primary act-refund" data-id="' + o.id + '">退费</button>';
    } else if (o.orderStatus !== '已缴费') {
      refundBtn = '<button class="btn btn--sm" disabled title="当前状态不可退费">退费</button>';
    } else if (o.refunded >= o.amount) {
      refundBtn = '<button class="btn btn--sm" disabled title="已全额退款，不允许再次退费">退费</button>';
    } else {
      refundBtn = '<button class="btn btn--sm btn--primary act-refund" data-id="' + o.id + '">退费</button>';
    }
    var html = refundBtn + ' <button class="btn btn--sm act-record" data-id="' + o.id + '">记录</button>';
    if (CHAIN[o.progress]) html += ' <button class="btn btn--ghost act-advance" data-id="' + o.id + '" title="模拟易快报流转至下一节点">▸</button>';
    return html;
  }
  function itemLabel(o, it) {
    var plan = it.name.replace('APASS会员', '');
    var base = 'APASS会员\u00A0\u00A0' + plan + '\u00A0\u00A01年 ×1';
    return (o.source === '小程序加购' && o.formName) ? o.formName + '，' + base : base;
  }
  function rowHtml(o) {
    var items = o.items.map(function (it) { return itemLabel(o, it); }).join('、');
    var refundCls = o.refunded > 0 ? 'num' : 'num text-muted';
    return '<tr data-id="' + o.id + '" data-progress="' + (o.progress || '') + '">' +
      '<td>' + o.student + '</td>' +
      '<td class="mono">' + o.phone + '</td>' +
      '<td>' + sourceTag(o.source) + '</td>' +
      '<td class="mono">' + o.orderNo + '</td>' +
      '<td>' + (o.payTime || '—') + '</td>' +
      '<td class="cell-wrap">' + items + '</td>' +
      '<td class="num">' + money(o.currency, o.amount) + '</td>' +
      '<td class="' + refundCls + '">' + money(o.currency, o.refunded) + '</td>' +
      '<td>' + statusTag(o.orderStatus) + '</td>' +
      '<td>' + progressTag(o.progress) + '</td>' +
      '<td>' + (o.submitter || '—') + '</td>' +
      '<td>' + (o.applyTime || '—') + '</td>' +
      '<td>' + (o.approverTime || '—') + '</td>' +
      '<td>' + (o.refundTime || '—') + '</td>' +
      '<td>' + opCell(o) + '</td>' +
      '</tr>';
  }
  /* ---------- 分页 ---------- */
  var pagerTotal = document.getElementById('pagerTotal');
  var pagerSize = document.getElementById('pagerSize');
  var pagerPrev = document.getElementById('pagerPrev');
  var pagerNext = document.getElementById('pagerNext');
  var pagerPages = document.getElementById('pagerPages');
  var pagerState = { page: 1, size: 10 };

  function getFiltered() {
    var kw = searchInput.value.trim().toLowerCase();
    var pv = progressFilter.value;
    /* 实时过滤：仅展示已进入退费流程（进度 ≥ 已提交易快报）的订单，新提交的单即时进入列表 */
    return APASS_ORDERS.filter(function (o) {
      if (!o.progress) return false;
      var text = (o.student + ' ' + o.phone + ' ' + o.orderNo).toLowerCase();
      return (kw === '' || text.indexOf(kw) !== -1) && (pv === '' || (o.progress || '') === pv);
    });
  }
  function pageList(pages, cur) {
    var arr = [];
    if (pages <= 7) { for (var i = 1; i <= pages; i++) arr.push(i); return arr; }
    arr.push(1);
    var s = Math.max(2, cur - 1), e = Math.min(pages - 1, cur + 1);
    if (s > 2) arr.push('…');
    for (var j = s; j <= e; j++) arr.push(j);
    if (e < pages - 1) arr.push('…');
    arr.push(pages);
    return arr;
  }
  function renderPager(total, pages) {
    pagerTotal.textContent = '共 ' + total + ' 条';
    pagerPrev.disabled = pagerState.page <= 1;
    pagerNext.disabled = pagerState.page >= pages;
    var html = '';
    pageList(pages, pagerState.page).forEach(function (p) {
      html += p === '…'
        ? '<span class="pager__ellipsis">…</span>'
        : '<button type="button" class="pager__num' + (p === pagerState.page ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
    });
    pagerPages.innerHTML = html;
  }
  function render() {
    var list = getFiltered();
    var pages = Math.max(1, Math.ceil(list.length / pagerState.size));
    if (pagerState.page > pages) pagerState.page = pages;
    if (pagerState.page < 1) pagerState.page = 1;
    var start = (pagerState.page - 1) * pagerState.size;
    tbody.innerHTML = list.slice(start, start + pagerState.size).map(rowHtml).join('');
    renderPager(list.length, pages);
    tableHint.textContent = '共 ' + list.length + ' 条退费进度订单（进度 ≥ 已提交易快报） · 第 ' + pagerState.page + ' / ' + pages + ' 页 · 币种随报名表（港币 / 人民币）';
  }
  /* ---------- 退费弹窗（手动提交易快报 · 对齐小程序后台退款单） ---------- */
  var rfOverlay = document.getElementById('rfOverlay');
  var rfToastWrap = document.getElementById('rfToastWrap');
  var RF_SELECT_OPTIONS = {
    bill: ['项目退款单（无出纳）', '项目费用退款单'],
    project: [REFUND_FORM_DEFAULTS.project],
    approver: ['王玉蝶', '张敏（财务）', '刘倩（校区运营）', '王浩（项目部）', '赵蕾（财务总监）'],
    entity: ['阿思丹(成都)教育科技有限公司', '阿思丹（北京）教育咨询有限公司', '阿思丹（香港）教育科技有限公司'],
    dept: ['竞赛客服部门', '理工科项目部', '志愿者项目部', '文科项目部', '财务部', '市场部']
  };
  var RF_SCHOOL_BY_STUDENT = { '王小明': '广州外国语学校', '李小红': '深圳中学', '陈晓': '成都七中', '周晓岚': '华南师范大学附属中学', '郭子睿': '上海市民办平和学校' };
  var rfState = { order: null, rule: null, checks: [], files: [], values: {}, submitting: false, popper: null };
  var rfNodes = { selects: {}, orders: {}, inputs: {}, copies: {} };
  Array.prototype.forEach.call(rfOverlay.querySelectorAll('[data-select]'), function (n) { rfNodes.selects[n.getAttribute('data-select')] = n; });
  Array.prototype.forEach.call(rfOverlay.querySelectorAll('[data-order]'), function (n) { rfNodes.orders[n.getAttribute('data-order')] = n; });
  Array.prototype.forEach.call(rfOverlay.querySelectorAll('[data-input]'), function (n) { rfNodes.inputs[n.getAttribute('data-input')] = n; });
  Array.prototype.forEach.call(rfOverlay.querySelectorAll('[data-copy]'), function (n) { rfNodes.copies[n.getAttribute('data-copy')] = n; });

  function rfToast(msg, type) {
    var t = type || 'info';
    var node = document.createElement('div');
    node.className = 'rf-message rf-message--' + t;
    var icon = document.createElement('span');
    icon.className = 'rf-message__icon';
    icon.innerHTML = t === 'success'
      ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M5 8.2 7.1 10.3 11 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.9v3.7M8 11.3v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    var textNode = document.createElement('span');
    textNode.textContent = msg;
    node.appendChild(icon);
    node.appendChild(textNode);
    rfToastWrap.appendChild(node);
    setTimeout(function () {
      node.classList.add('is-leaving');
      setTimeout(function () { node.remove(); }, 260);
    }, 2600);
  }

  function rfSelectText(key, value, placeholder) {
    var node = rfNodes.selects[key];
    var span = node.querySelector('.rf-select__text');
    span.textContent = value || placeholder || '';
    span.classList.toggle('is-placeholder', !value);
  }

  function rfClosePopper() {
    if (rfState.popper) { rfState.popper.remove(); rfState.popper = null; }
    Object.keys(rfNodes.selects).forEach(function (k) { rfNodes.selects[k].classList.remove('is-active'); });
  }

  function rfSetSelect(key, value) {
    rfState.values[key] = value;
    rfSelectText(key, value);
    rfNodes.selects[key].classList.remove('is-error');
    if (key === 'form') {
      var shortName = String(value).replace(/ - 2026 报名表$/, '');
      var project = shortName + ' (理工科)';
      rfState.values.project = project;
      RF_SELECT_OPTIONS.project = [project];
      rfSelectText('project', project);
      if (rfState.order) rfNodes.inputs.title.value = shortName + '退费申请-' + rfState.order.student;
    }
    rfClosePopper();
  }

  function rfOpenPopper(key) {
    rfClosePopper();
    var node = rfNodes.selects[key];
    node.classList.add('is-active');
    var popper = document.createElement('div');
    popper.className = 'rf-popper rf-popper--dropdown';
    RF_SELECT_OPTIONS[key].forEach(function (opt) {
      var item = document.createElement('div');
      item.className = 'rf-dropdown__item' + (rfState.values[key] === opt ? ' is-selected' : '');
      item.textContent = opt;
      item.addEventListener('click', function () { rfSetSelect(key, opt); });
      popper.appendChild(item);
    });
    document.body.appendChild(popper);
    var rect = node.getBoundingClientRect();
    popper.style.left = rect.left + 'px';
    popper.style.minWidth = rect.width + 'px';
    popper.style.top = Math.min(rect.bottom + 6, window.innerHeight - 300) + 'px';
    requestAnimationFrame(function () { popper.classList.add('is-in'); });
    rfState.popper = popper;
  }

  Object.keys(rfNodes.selects).forEach(function (key) {
    var node = rfNodes.selects[key];
    if (node.classList.contains('rf-select--disabled')) return;
    node.addEventListener('click', function (e) {
      if (node.classList.contains('rf-select--disabled')) return;
      e.stopPropagation();
      if (node.classList.contains('is-active')) { rfClosePopper(); return; }
      rfOpenPopper(key);
    });
  });
  document.addEventListener('click', function (e) {
    if (rfState.popper && !rfState.popper.contains(e.target)) rfClosePopper();
  });
  Array.prototype.forEach.call(rfOverlay.querySelectorAll('input[name="rfModify"]'), function (r) {
    r.addEventListener('change', function () {
      if (r.checked) rfState.values.modify = r.value;
    });
  });

  function rfCopyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    ta.remove();
    return Promise.resolve();
  }
  Object.keys(rfNodes.copies).forEach(function (key) {
    rfNodes.copies[key].addEventListener('click', function () {
      var val = rfState.values[key] || '';
      if (!val) return;
      var label = rfNodes.copies[key].getAttribute('data-copy-label') || key;
      rfCopyText(val).then(function () { rfToast('已复制' + label + '：' + val, 'success'); });
    });
  });

  var rfFileInput = rfOverlay.querySelector('[data-file-input]');
  var rfFilelist = rfOverlay.querySelector('[data-filelist]');
  rfOverlay.querySelector('[data-upload]').addEventListener('click', function () { rfFileInput.click(); });
  rfFileInput.addEventListener('change', function () {
    Array.prototype.forEach.call(rfFileInput.files, function (f) {
      rfState.files.push({ name: f.name, size: f.size });
    });
    rfFileInput.value = '';
    rfRenderFiles();
  });
  function rfRenderFiles() {
    rfFilelist.innerHTML = '';
    rfFilelist.hidden = rfState.files.length === 0;
    rfState.files.forEach(function (f, idx) {
      var li = document.createElement('li');
      li.className = 'rf-file';
      li.innerHTML =
        '<span class="rf-file__icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h5.5L12 4.5V13H3V1Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M8.5 1v3.5H12" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg></span>' +
        '<span class="rf-file__main"><span class="rf-file__meta"><span class="rf-file__name"></span><span class="rf-file__size"></span></span></span>' +
        '<span class="rf-file__state is-done">已上传</span>' +
        '<button type="button" class="rf-file__remove" aria-label="移除"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>';
      li.querySelector('.rf-file__name').textContent = f.name;
      li.querySelector('.rf-file__size').textContent = f.size >= 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB';
      li.querySelector('.rf-file__remove').addEventListener('click', function () {
        rfState.files.splice(idx, 1);
        rfRenderFiles();
      });
      rfFilelist.appendChild(li);
    });
  }

  function rfItemRefund(rule, price) { return Math.round(price * rule.factor * 100) / 100; }

  function rfCalc() {
    var o = rfState.order;
    var rule = rfState.rule;
    var count = 0;
    var sum = 0;
    if (o && rule && !rule.blocked) {
      rfState.checks.forEach(function (c) {
        if (c.input.checked) { count++; sum += c.refund; }
      });
      if (rule.fixed !== undefined && !rfState.customRefund) { count = rfState.checks.length; sum = rule.fixed; }
    }
    if (rfOverlay.querySelector('[data-orders-count]')) {
      rfOverlay.querySelector('[data-orders-count]').textContent = count;
      rfOverlay.querySelector('[data-orders-sum]').textContent = o ? money(o.currency, sum) : '¥0';
    }
    return sum;
  }

  function openRefund(o, fromPick) {
    rfFromPick = !!fromPick;
    activeOrder = o;
    rfState.order = o;
    rfState.rule = decideRule(o);
    rfState.files = [];
    var viewOnly = !!o.progress && o.progress !== '退款失败';
    rfState.viewOnly = viewOnly;
    var noteEl = rfOverlay.querySelector('[data-viewonly-note]');
    if (noteEl) {
      noteEl.hidden = !viewOnly;
      var noteText = noteEl.querySelector('[data-viewonly-text]');
      if (noteText) noteText.textContent = '该订单已在退费流程中（当前进度：' + o.progress + '），单据内容仅可查看，不可编辑。';
    }
    rfRenderFiles();
    var rule = rfState.rule;

    rfState.values.bill = DOC_TYPE_BY_SOURCE[o.source] || '项目退款单（无出纳）';
    rfSelectText('bill', rfState.values.bill);
    rfSelectText('student', o.student + '（' + o.phone + '）');

    /* 小程序加购：上半部分为 是否修改订单 + 选择报名表（无"选择退费学生"行）；项目与标题随报名表联动 */
    var isAddon = o.source === '小程序加购';
    var rowStudent = rfOverlay.querySelector('[data-row-student]');
    var rowModify = rfOverlay.querySelector('[data-row-modify]');
    var rowForm = rfOverlay.querySelector('[data-row-form]');
    if (rowStudent) rowStudent.hidden = isAddon;
    if (rowModify) rowModify.hidden = !isAddon;
    if (rowForm) rowForm.hidden = !isAddon;
    var modifyRadios = rfOverlay.querySelectorAll('input[name="rfModify"]');
    Array.prototype.forEach.call(modifyRadios, function (r) {
      r.checked = r.value === '不修改';
      r.disabled = viewOnly;
    });
    rfState.values.modify = '不修改';
    if (isAddon) {
      var forms = [];
      ORDERS.forEach(function (x) {
        if (x.category === 'APASS会员' && x.source === '小程序加购' && x.formName && forms.indexOf(x.formName) === -1) forms.push(x.formName);
      });
      if (o.formName && forms.indexOf(o.formName) === -1) forms.unshift(o.formName);
      RF_SELECT_OPTIONS.form = forms.map(formDisplayName);
      var curForm = formDisplayName(o.formName || forms[0] || '');
      rfState.values.form = curForm;
      rfSelectText('form', curForm);
      rfState.values.project = formProject(o.formName || forms[0] || '');
      RF_SELECT_OPTIONS.project = [rfState.values.project];
    } else {
      RF_SELECT_OPTIONS.form = [];
      rfState.values.form = '';
      rfSelectText('form', '');
      rfState.values.project = REFUND_FORM_DEFAULTS.project;
      RF_SELECT_OPTIONS.project = [REFUND_FORM_DEFAULTS.project];
    }
    rfSelectText('project', rfState.values.project);
    rfState.values.approver = REFUND_FORM_DEFAULTS.approver;
    rfSelectText('approver', rfState.values.approver);
    rfState.values.entity = REFUND_FORM_DEFAULTS.entity;
    rfSelectText('entity', rfState.values.entity);
    rfState.values.dept = REFUND_FORM_DEFAULTS.dept;
    rfSelectText('dept', rfState.values.dept);
    rfNodes.selects.project.classList.remove('is-error');
    rfNodes.selects.approver.classList.remove('is-error');
    rfNodes.selects.entity.classList.remove('is-error');

    rfNodes.inputs.title.value = isAddon ? buildAddonTitle(o) : buildRefundTitle(o);
    rfNodes.inputs.title.classList.remove('is-error');
    rfNodes.inputs.reason.value = '已退出';
    rfNodes.inputs.reason.classList.remove('is-error');
    rfNodes.inputs.desc.value = '';
    rfNodes.inputs.desc.classList.remove('is-error');
    rfNodes.inputs.date.value = nowStr().slice(0, 10);
    rfNodes.inputs.date.classList.remove('is-error');

    var digits = o.orderNo.replace(/\D/g, '');
    rfState.values.payNo = (o.orderNo.slice(0, 2) === 'NS' ? 'PF' : 'WXP') + digits;
    rfState.values.merchantNo = o.orderNo;
    rfState.values.school = RF_SCHOOL_BY_STUDENT[o.student] || '—';
    rfNodes.orders.payNo.querySelector('.rf-select__text').textContent = rfState.values.payNo;
    rfNodes.orders.merchantNo.querySelector('.rf-select__text').textContent = rfState.values.merchantNo;
    rfNodes.orders.school.querySelector('.rf-select__text').textContent = rfState.values.school;
    rfNodes.copies.payNo.disabled = false;
    rfNodes.copies.payNo.classList.remove('rf-gbtn--dim');
    rfNodes.copies.merchantNo.disabled = false;
    rfNodes.copies.merchantNo.classList.remove('rf-gbtn--dim');
    rfNodes.copies.school.disabled = false;
    rfNodes.copies.school.classList.remove('rf-gbtn--dim');

    Object.keys(rfNodes.selects).forEach(function (k) {
      if (k === 'student') return;
      rfNodes.selects[k].classList.toggle('rf-select--disabled', viewOnly);
    });
    Object.keys(rfNodes.inputs).forEach(function (k) { rfNodes.inputs[k].disabled = viewOnly; });
    rfOverlay.querySelector('[data-upload]').disabled = viewOnly;
    rfSubmitBtn.hidden = viewOnly;

    rfOverlay.querySelector('[data-orders-meta]').innerHTML =
      '<b>创建时间 ' + (o.payTime || '—') + '</b><span> · </span><b>支付时间 ' + (o.payTime || '—') + '</b><span> · </span><b>订单号 ' + o.orderNo + '</b><span> · </span><b>类型 ' + o.source + '</b>';

    var appliedEl = rfOverlay.querySelector('[data-rule-applied]');
    appliedEl.textContent = '本单适用：' + rule.label;
    appliedEl.className = 'rf-refund-rules__item ' + (rule.blocked ? 'rf-refund-rules__item--blocked' : 'rf-refund-rules__item--applied');

    var body = rfOverlay.querySelector('[data-orders-body]');
    body.innerHTML = '';
    rfState.checks = [];
    rfState.customRefund = false;
    var disabled = !!rule.readonly || !!rule.blocked;
    o.items.forEach(function (it, idx) {
      var refundVal = null;
      if (!rule.blocked) {
        if (rule.fixed !== undefined) refundVal = idx === 0 ? rule.fixed : null;
        else refundVal = rfItemRefund(rule, it.price);
      }
      var quick75 = Math.round(it.price * 0.75 * 100) / 100;
      var refundCellHtml;
      if (rule.blocked || viewOnly) {
        refundCellHtml = '<span class="rf-refund-text">' + (refundVal === null ? '—' : money(o.currency, refundVal)) + '</span>';
      } else {
        refundCellHtml = '<div class="rf-refund-edit">' +
          '<button type="button" class="rf-quick75" title="点击将退款金额设为订单金额×75%">75%</button>' +
          '<input class="rf-refund-input" type="text" inputmode="decimal" aria-label="退款金额 ' + it.name + '" value="' + (refundVal === null ? '' : refundVal) + '">' +
          '</div>';
      }
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="rf-table__check"></td>' +
        '<td class="rf-table__name"><span class="rf-table__name-text"></span></td>' +
        '<td class="num"></td>' +
        '<td><span class="rf-tag">' + o.orderStatus + '</span></td>' +
        '<td class="num">' + refundCellHtml + '</td>';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.disabled = disabled || viewOnly;
      cb.setAttribute('aria-label', '勾选订单 ' + it.name);
      var cbLabel = document.createElement('label');
      cbLabel.className = 'rf-checkbox';
      cbLabel.appendChild(cb);
      var box = document.createElement('span');
      box.className = 'rf-checkbox__box';
      cbLabel.appendChild(box);
      tr.querySelector('.rf-table__check').appendChild(cbLabel);
      tr.querySelector('.rf-table__name-text').textContent = it.name;
      tr.querySelectorAll('td')[2].textContent = money(o.currency, it.price);
      body.appendChild(tr);
      var entry = { input: cb, refund: refundVal === null ? 0 : refundVal };
      rfState.checks.push(entry);
      cb.addEventListener('change', rfCalc);
      var qBtn = tr.querySelector('.rf-quick75');
      var rInput = tr.querySelector('.rf-refund-input');
      if (qBtn && rInput) {
        qBtn.addEventListener('click', function () {
          entry.refund = quick75;
          rInput.value = quick75;
          rfState.customRefund = true;
          rfCalc();
        });
        rInput.addEventListener('input', function () {
          var v = parseFloat(rInput.value);
          if (!isNaN(v) && v >= 0) {
            entry.refund = Math.round(v * 100) / 100;
            rfState.customRefund = true;
          } else {
            entry.refund = 0;
          }
          rfCalc();
        });
      }
    });

    rfCalc();
    rfOverlay.classList.add('is-open');
    rfOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rf-lock');
    rfOverlay.querySelector('#rfClose').focus();
  }

  function closeRefund() {
    rfOverlay.classList.remove('is-open');
    rfOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rf-lock');
    rfClosePopper();
    activeOrder = null;
    rfState.order = null;
    rfState.checks = [];
    rfState.customRefund = false;
  }
  var rfFromPick = false;
  function cancelRefund() {
    closeRefund();
    if (rfFromPick) studentModal.hidden = false;
    rfFromPick = false;
  }

  rfOverlay.querySelector('#rfClose').addEventListener('click', cancelRefund);
  rfOverlay.querySelector('[data-close]').addEventListener('click', cancelRefund);
  rfOverlay.addEventListener('click', function (e) { if (e.target === rfOverlay) cancelRefund(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (rfState.popper) { rfClosePopper(); return; }
      if (rfOverlay.classList.contains('is-open')) { cancelRefund(); return; }
      if (!studentModal.hidden) studentModal.hidden = true;
      if (!recordModal.hidden) recordModal.hidden = true;
    }
  });

  var rfSubmitBtn = rfOverlay.querySelector('[data-submit]');
  rfSubmitBtn.addEventListener('click', function () {
    if (rfState.submitting) return;
    var o = rfState.order;
    if (!o) return;
    if (rfState.viewOnly) return;
    var rule = rfState.rule;
    if (rule.blocked) { rfToast(rule.label, 'error'); return; }
    var required = [
      ['所属项目', rfState.values.project, '[data-select="project"]'],
      ['标题', rfNodes.inputs.title.value.trim(), '[data-input="title"]'],
      ['审批人', rfState.values.approver, '[data-select="approver"]'],
      ['报销日期', rfNodes.inputs.date.value, '[data-input="date"]'],
      ['法人实体', rfState.values.entity, '[data-select="entity"]'],
      ['申请原因', rfNodes.inputs.reason.value.trim(), '[data-input="reason"]'],
      ['描述', rfNodes.inputs.desc.value.trim(), '[data-input="desc"]']
    ];
    var missing = null;
    required.forEach(function (r) {
      var node = rfOverlay.querySelector(r[2]);
      if (node) node.classList.toggle('is-error', !r[1]);
      if (!r[1] && !missing) missing = r[0];
    });
    if (missing) { rfToast('请填写必填项：' + missing, 'error'); return; }

    rfState.submitting = true;
    rfSubmitBtn.classList.add('is-loading');
    rfOverlay.querySelector('[data-submit-label]').textContent = '提交中…';
    setTimeout(function () {
      var bill = rfState.values.bill;
      var value = rfCalc();
      var allChecked = rfState.checks.length > 0;
      rfState.checks.forEach(function (c) { if (!c.input.checked) allChecked = false; });
      if (rule.fixed !== undefined) allChecked = true;
      var modifyInfo = o.source === '小程序加购' && rfState.values.modify && rfState.values.modify !== '不修改'
        ? ' · 是否修改订单：' + rfState.values.modify : '';
      o.refunded += value;
      o.orderStatus = allChecked ? '已退费' : '已缴费';
      o.progress = '已提交易快报';
      o.submitter = '当前操作员';
      o.applyTime = nowStr();
      o.approverTime = '';
      o.refundTime = '';
      render();
      rfState.submitting = false;
      rfSubmitBtn.classList.remove('is-loading');
      rfOverlay.querySelector('[data-submit-label]').textContent = '提 交';
      closeRefund();
      rfFromPick = false;
      rfToast('已提交易快报：' + bill + modifyInfo + ' · 退款金额 ' + money(o.currency, value), 'success');
    }, 700);
  });
  /* ---------- 记录弹窗（退费申请流程记录） ---------- */
  var recordModal = document.getElementById('recordModal');
  var recordMeta = document.getElementById('recordMeta');
  var recordWrap = recordModal.querySelector('[data-record-wrap]');
  var recordBody = recordModal.querySelector('[data-record-body]');
  var recordEmpty = recordModal.querySelector('[data-record-empty]');
  document.getElementById('recordClose').addEventListener('click', function () { recordModal.hidden = true; });
  recordModal.addEventListener('click', function (e) { if (e.target === recordModal) recordModal.hidden = true; });

  function recordTimeAdd(timeStr, minutes) {
    if (!timeStr) return '—';
    var d = new Date(timeStr.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return timeStr;
    d = new Date(d.getTime() + minutes * 60 * 1000);
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function recordSec(timeStr) { return timeStr ? timeStr + ':00' : '—'; }

  function buildRecords(o) {
    var list = [];
    if (!o.progress || !o.applyTime) return list;
    var submitter = o.submitter || '操作员';
    var t1 = o.approverTime || '';
    var afterApprover = ['财务审批完成', '财务审批驳回', '等待退费中', '退款完成', '退款失败'].indexOf(o.progress) !== -1;
    var afterFinance = ['等待退费中', '退款完成', '退款失败'].indexOf(o.progress) !== -1;
    list.push({ op: submitter, time: recordSec(o.applyTime), text: '【' + submitter + '】提交易快报' });
    if (o.progress === '负责人审批完成' || afterApprover) {
      list.push({ op: 'EKB同步', time: recordSec(t1), text: '【定时同步】易快报单据-负责人审批完成' });
    } else if (o.progress === '负责人审批驳回') {
      list.push({ op: 'EKB同步', time: recordSec(t1), text: '【定时同步】易快报单据-负责人审批驳回', tone: 'action--danger' });
    }
    if (['财务审批完成', '等待退费中', '退款完成', '退款失败'].indexOf(o.progress) !== -1) {
      list.push({ op: 'EKB同步', time: recordTimeAdd(t1, 10), text: '【定时同步】易快报单据-财务审批完成' });
    } else if (o.progress === '财务审批驳回') {
      list.push({ op: 'EKB同步', time: recordTimeAdd(t1, 10), text: '【定时同步】易快报单据-财务审批驳回', tone: 'action--danger' });
    }
    if (afterFinance) {
      list.push({ op: 'APASS', time: recordTimeAdd(t1, 10), text: '【apass】发起微信退费申请' });
    }
    if (o.progress === '退款完成') {
      list.push({ op: '微信服务', time: recordSec(o.refundTime), text: '【微信服务】退款成功', tone: 'action--ok' });
    } else if (o.progress === '退款失败') {
      list.push({ op: 'APASS', time: recordTimeAdd(t1, 20), text: '【apass】发起微信退费申请【失败】', tone: 'action--danger' });
    }
    return list;
  }

  function openRecord(o) {
    recordMeta.textContent = o.student + '（' + o.phone + '） · 订单号 ' + o.orderNo + ' · 类型 ' + o.source + ' · 订单金额 ' + money(o.currency, o.amount) + ' · 已退 ' + money(o.currency, o.refunded);
    var list = buildRecords(o);
    recordBody.innerHTML = list.map(function (r) {
      return '<tr><td>' + r.op + '</td><td class="mono-time">' + r.time + '</td><td class="' + (r.tone || '') + '">' + r.text + '</td></tr>';
    }).join('');
    recordWrap.hidden = list.length === 0;
    recordEmpty.hidden = list.length !== 0;
    recordModal.hidden = false;
  }

  /* ---------- 列表事件（退费 / 记录 / 推进流转） ---------- */
  tbody.addEventListener('click', function (e) {
    var refundBtn = e.target.closest ? e.target.closest('.act-refund') : null;
    var recordBtn = e.target.closest ? e.target.closest('.act-record') : null;
    var advanceBtn = e.target.closest ? e.target.closest('.act-advance') : null;
    if (refundBtn) {
      var o1 = ORDERS.filter(function (x) { return String(x.id) === refundBtn.dataset.id; })[0];
      if (o1) openRefund(o1);
      return;
    }
    if (recordBtn) {
      var o3 = ORDERS.filter(function (x) { return String(x.id) === recordBtn.dataset.id; })[0];
      if (o3) openRecord(o3);
      return;
    }
    if (advanceBtn) {
      var o2 = ORDERS.filter(function (x) { return String(x.id) === advanceBtn.dataset.id; })[0];
      if (!o2) return;
      var next = CHAIN[o2.progress];
      if (!next) return;
      o2.progress = next;
      if (next === '负责人审批完成') o2.approverTime = nowStr();
      if (next === '退款完成') { o2.refundTime = nowStr(); if (o2.refunded > 0) o2.orderStatus = '已退费'; }
      render();
    }
  });

  /* ---------- 新增退费（两步：搜索选择学生 → 该生的 APASS 会员套餐订单） ---------- */
  var studentSearch = document.getElementById('studentSearch');
  var pickStep1 = document.getElementById('pickStep1');
  var pickStep2 = document.getElementById('pickStep2');
  var pickedStudentEl = document.getElementById('pickedStudent');
  var pickOrdersEl = document.getElementById('pickOrders');

  function apassCount(student) {
    return APASS_ORDERS.filter(function (o) { return o.student === student; }).length;
  }
  function renderStudentList(kw) {
    kw = (kw || '').trim().toLowerCase();
    var seen = {}; var html = '';
    APASS_ORDERS.forEach(function (o) {
      if (seen[o.student]) return;
      var text = (o.student + ' ' + o.phone + ' ' + o.orderNo).toLowerCase();
      if (kw !== '' && text.indexOf(kw) === -1) return;
      seen[o.student] = true;
      html += '<li data-name="' + o.student + '">' + o.student + '<span class="stu-meta">' + o.phone + ' · ' + apassCount(o.student) + ' 笔 APASS 订单</span></li>';
    });
    if (!html) html = '<li class="stu-empty">未找到匹配学生（仅统计与 APASS 会员套餐相关的订单）</li>';
    document.getElementById('studentList').innerHTML = html;
  }
  function renderPickOrders(student) {
    var info = APASS_ORDERS.filter(function (o) { return o.student === student; })[0] || {};
    pickedStudentEl.textContent = student + '（' + (info.phone || '') + '）';
    var html = '';
    APASS_ORDERS.filter(function (o) { return o.student === student; }).forEach(function (o) {
      var blocked = false; var reason = '';
      if (o.progress) {
        /* 已进入退费流程（含退款完成）：退费按钮保持蓝色可点击，弹窗以只读（填写框禁用）方式打开 */
        blocked = false;
      } else if (o.orderStatus !== '已缴费') { blocked = true; reason = '订单状态（' + o.orderStatus + '），不可发起退费'; }
      else if (o.refunded >= o.amount) { blocked = true; reason = '该订单已退费过，不可再次退费'; }
      var name = o.source === '小程序加购'
        ? (o.formName || '') + ' APASS加购表'
        : o.items.map(function (it) { return it.name; }).join('、') + '（' + o.items.length + ' 件）';
      var srcCls = o.source === 'APASS平台' ? 'tag--brand' : (o.source === '小程序续费' ? 'tag--ok' : 'tag--warn');
      html += '<div class="pick-card' + (blocked ? ' is-disabled' : '') + '" data-id="' + o.id + '">' +
        '<div class="pick-card__head">' +
          '<span class="tag ' + srcCls + '">' + o.source + '</span>' +
          '<span class="pick-card__name">' + name + '</span>' +
        '</div>' +
        '<div class="pick-card__meta">' +
          '<span class="mono">' + o.orderNo + '</span>' +
          '<span>' + (o.payTime || '—') + '</span>' +
          '<span class="pick-card__amount num">' + money(o.currency, o.amount) + '</span>' +
          '<span class="tag">' + o.orderStatus + '</span>' +
          '<span class="pick-card__progress">' + progressTag(o.progress) + '</span>' +
        '</div>' +
        '<div class="pick-card__foot">' +
          (blocked
            ? '<span class="pick-card__blocked" title="' + reason + '">不可退</span>'
            : '<button class="btn btn--sm btn--primary act-refund" data-id="' + o.id + '">退费</button>') +
        '</div>' +
      '</div>';
    });
    if (!html) html = '<div class="pick-card"><div class="pick-card__head"><span class="pick-card__name">该学生暂无与 APASS 会员套餐相关的订单</span></div></div>';
    pickOrdersEl.innerHTML = html;
  }
  function showStep(step) {
    pickStep1.hidden = step !== 1;
    pickStep2.hidden = step !== 2;
  }

  newRefundBtn.addEventListener('click', function () {
    studentSearch.value = '';
    renderStudentList('');
    showStep(1);
    studentModal.hidden = false;
    studentSearch.focus();
  });
  document.getElementById('repickStudent').addEventListener('click', function () {
    showStep(1);
    studentSearch.focus();
  });
  studentSearch.addEventListener('input', function () { renderStudentList(studentSearch.value); });
  document.getElementById('studentCancel').addEventListener('click', function () { studentModal.hidden = true; });
  studentModal.addEventListener('click', function (e) { if (e.target === studentModal) studentModal.hidden = true; });
  document.getElementById('studentList').addEventListener('click', function (e) {
    var li = e.target.closest ? e.target.closest('li[data-name]') : null;
    if (!li) return;
    renderPickOrders(li.dataset.name);
    showStep(2);
  });
  pickOrdersEl.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.act-refund') : null;
    if (!btn) return;
    var o = ORDERS.filter(function (x) { return String(x.id) === btn.dataset.id; })[0];
    if (!o) return;
    studentModal.hidden = true;
    openRefund(o, true);
  });

  /* ---------- 初始化 ---------- */
  searchInput.addEventListener('input', function () { pagerState.page = 1; render(); });
  progressFilter.addEventListener('change', function () { pagerState.page = 1; render(); });
  pagerPrev.addEventListener('click', function () { if (pagerState.page > 1) { pagerState.page--; render(); } });
  pagerNext.addEventListener('click', function () {
    var pages = Math.max(1, Math.ceil(getFiltered().length / pagerState.size));
    if (pagerState.page < pages) { pagerState.page++; render(); }
  });
  pagerSize.addEventListener('change', function () { pagerState.size = parseInt(pagerSize.value, 10) || 10; pagerState.page = 1; render(); });
  pagerPages.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.pager__num') : null;
    if (!b) return;
    var p = parseInt(b.dataset.page, 10);
    if (p && p !== pagerState.page) { pagerState.page = p; render(); }
  });
  render();
})();