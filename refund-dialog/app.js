(function () {
  "use strict";

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  const fmt = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  const fmtMoney = function (currency, n) {
    return (currency === "HKD" ? "HK$ " : "¥ ") + Number(n).toLocaleString("en-US");
  };
  const parseDate = function (s) { const p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const todayStr = function () { return fmt(new Date()); };

  const state = {
    open: false,
    bill: null,
    modifyOrder: "no",
    formId: null,
    student: null,
    project: null,
    title: "",
    approver: null,
    date: null,
    entity: null,
    payNo: "",
    merchantNo: "",
    school: "本校",
    reason: "",
    dept: null,
    desc: "",
    files: [],
    selectedOrders: [],
    orderAmounts: {},
    openingUntil: 0
  };

  const cache = { bills: [], forms: [], dict: null, formDetail: null };
  let submitting = false;
  let popper = null;
  let dateView = null;
  let invalidAmounts = {};

  const el = {
    overlay: $("#rfOverlay"),
    dialog: $("#rfDialog"),
    closeBtn: $("#rfClose"),
    form: $("#rfForm"),
    toastWrap: $("#rfToastWrap"),
    selects: {},
    orders: {},
    inputs: {},
    copyBtns: {},
    noteFee: $("[data-note-fee]"),
    schoolBtn: $("[data-school]"),
    ordersBox: $("[data-orders]"),
    ordersMeta: $("[data-orders-meta]"),
    ordersBody: $("[data-orders-body]"),
    ordersCount: $("[data-orders-count]"),
    ordersSum: $("[data-orders-sum]"),
    dateNode: $("[data-date]"),
    dateValue: $("[data-date] .rf-date__value"),
    fileInput: $("[data-file-input]"),
    filelist: $("[data-filelist]"),
    submitBtn: $("[data-submit]"),
    submitLabel: $("[data-submit-label]")
  };

  $$("[data-select]").forEach(function (n) { el.selects[n.dataset.select] = n; });
  $$("[data-order]").forEach(function (n) { el.orders[n.dataset.order] = n; });
  $$("[data-input]").forEach(function (n) { el.inputs[n.dataset.input] = n; });
  $$("[data-copy]").forEach(function (n) { el.copyBtns[n.dataset.copy] = n; });

  const ICONS = {
    success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M5 8.2 7.1 10.3 11 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.9v3.7M8 11.3v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.6v3.3M8 5v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.9 15 13.8H1L8 1.9Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.3v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="currentColor"/></svg>'
  };

  const DOC_ICON = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h5.5L12 4.5V13H3V1Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M8.5 1v3.5H12" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>';
  const X_ICON = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const CHEV_L = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5 4 6l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHEV_R = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function toast(msg, type) {
    const t = type || "info";
    const node = document.createElement("div");
    node.className = "rf-message rf-message--" + t;
    node.setAttribute("role", "status");
    const icon = document.createElement("span");
    icon.className = "rf-message__icon";
    icon.innerHTML = ICONS[t] || ICONS.info;
    const text = document.createElement("span");
    text.textContent = msg;
    node.appendChild(icon);
    node.appendChild(text);
    el.toastWrap.appendChild(node);
    setTimeout(function () {
      node.classList.add("is-leaving");
      setTimeout(function () { node.remove(); }, 260);
    }, 2600);
  }

  function setSelectDisplay(key, text, placeholder) {
    const node = el.selects[key];
    if (!node) return;
    const t = $(".rf-select__text", node);
    const show = text || "";
    t.textContent = show || placeholder;
    t.classList.toggle("is-placeholder", !show);
  }

  function setInput(key, value) {
    const node = el.inputs[key];
    if (node && node.value !== value) node.value = value;
  }

  function billLabel(id) {
    const b = cache.bills.find(function (x) { return x.id === id; });
    return b ? b.label : "";
  }

  function formLabel(id) {
    const f = cache.forms.find(function (x) { return x.id === id; });
    return f ? f.label : "";
  }

  function currentStudentPreview() {
    if (!cache.formDetail || !cache.formDetail.students.length) return null;
    if (state.student) {
      const s = cache.formDetail.students.find(function (x) { return x.name === state.student; });
      if (s) return s;
    }
    return cache.formDetail.students[0];
  }

  function feeNote() {
    const s = currentStudentPreview();
    if (!s) return "注：请先选择报名表，带出学生费用信息";
    const refundable = Math.round(s.fee * s.refundRate);
    const rate = Math.round(s.refundRate * 100);
    return "注：该学生报名时报名费为：" + s.fee + "，默认退费费用为此的" + rate + "%；该学生可退金额：" + refundable + "（学生支付费用：" + s.fee + "）";
  }

  function renderState() {
    setSelectDisplay("bill", billLabel(state.bill), "请选择单据");
    setSelectDisplay("form", formLabel(state.formId), "请选择报名表");

    const st = el.selects.student;
    if (st) {
      st.dataset.placeholder = cache.formDetail ? "请选择退费学生" : "请先选择报名表";
      st.classList.toggle("rf-select--disabled", !cache.formDetail);
      setSelectDisplay("student", state.student, st.dataset.placeholder);
    }

    setSelectDisplay("project", state.project, "请选择");
    setSelectDisplay("approver", state.approver, "请选择");
    setSelectDisplay("entity", state.entity, "请选择");
    setSelectDisplay("dept", state.dept, "请选择");

    ["payNo", "merchantNo"].forEach(function (k) {
      const node = el.orders[k];
      if (!node) return;
      const t = $(".rf-select__text", node);
      t.textContent = state[k];
      t.classList.toggle("is-placeholder", !state[k]);
      node.classList.toggle("rf-select--disabled", !state[k]);
      if (el.copyBtns[k]) el.copyBtns[k].disabled = !state[k];
    });

    setInput("title", state.title);
    setInput("reason", state.reason);
    el.dateValue.textContent = state.date || "请选择日期";
    el.noteFee.textContent = feeNote();
    el.schoolBtn.textContent = state.school;
  }

  function currentStudentData() {
    if (!cache.formDetail || !state.student) return null;
    return cache.formDetail.students.find(function (x) { return x.name === state.student; }) || null;
  }

  function selectedOrderData() {
    const s = currentStudentData();
    if (!s) return [];
    return state.selectedOrders.map(function (i) {
      const o = s.orders[i];
      return o ? { name: o.name, refundable: getOrderAmount(s, i), currency: o.currency } : null;
    }).filter(Boolean);
  }

  function getOrderAmount(s, idx) {
    return Object.prototype.hasOwnProperty.call(state.orderAmounts, idx) ? state.orderAmounts[idx] : s.orders[idx].refundable;
  }

  function updateOrdersTotal(s) {
    let count = 0;
    let sum = 0;
    let currency = "CNY";
    if (s) {
      count = state.selectedOrders.length;
      sum = state.selectedOrders.reduce(function (a, i) {
        if (i < s.orders.length) a += getOrderAmount(s, i);
        return a;
      }, 0);
      if (s.orders.length) currency = s.orders[0].currency;
    }
    el.ordersCount.textContent = count;
    el.ordersSum.textContent = fmtMoney(currency, sum);
  }

  function renderOrders() {
    const s = currentStudentData();
    el.ordersMeta.innerHTML = "";
    if (!s) {
      el.ordersMeta.textContent = "创建时间 — · 支付时间 — · 订单号 —";
      el.ordersBody.innerHTML = "";
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.className = "rf-table__empty";
      td.colSpan = 5;
      td.textContent = "请先选择报名表与退费学生";
      tr.appendChild(td);
      el.ordersBody.appendChild(tr);
      updateOrdersTotal(null);
      return;
    }
    const m = s.payMeta;
    ["创建时间 " + m.createdAt, "支付时间 " + m.paidAt, "订单号 " + m.orderNo].forEach(function (part, i) {
      if (i > 0) {
        const dot = document.createElement("span");
        dot.textContent = " · ";
        el.ordersMeta.appendChild(dot);
      }
      const b = document.createElement("b");
      b.textContent = part;
      el.ordersMeta.appendChild(b);
    });
    el.ordersBody.innerHTML = "";
    s.orders.forEach(function (o, idx) {
      const tr = document.createElement("tr");

      const tdCheck = document.createElement("td");
      tdCheck.className = "rf-table__check";
      const label = document.createElement("label");
      label.className = "rf-checkbox";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.selectedOrders.indexOf(idx) > -1;
      input.setAttribute("aria-label", "勾选订单 " + o.name);
      const box = document.createElement("span");
      box.className = "rf-checkbox__box";
      label.appendChild(input);
      label.appendChild(box);
      tdCheck.appendChild(label);
      input.addEventListener("change", function () {
        const at = state.selectedOrders.indexOf(idx);
        if (input.checked && at === -1) state.selectedOrders.push(idx);
        if (!input.checked && at > -1) state.selectedOrders.splice(at, 1);
        updateOrdersTotal(s);
        clearError("orders");
      });
      tr.appendChild(tdCheck);

      const tdName = document.createElement("td");
      tdName.className = "rf-table__name";
      const nameText = document.createElement("span");
      nameText.className = "rf-table__name-text";
      nameText.textContent = o.name;
      nameText.title = o.name;
      tdName.appendChild(nameText);
      tr.appendChild(tdName);

      const tdAmount = document.createElement("td");
      tdAmount.textContent = fmtMoney(o.currency, o.amount);
      tr.appendChild(tdAmount);

      const tdStatus = document.createElement("td");
      const tag = document.createElement("span");
      tag.className = "rf-tag";
      tag.textContent = o.status;
      tdStatus.appendChild(tag);
      tr.appendChild(tdStatus);

      const tdRefund = document.createElement("td");
      const amountWrap = document.createElement("div");
      amountWrap.className = "rf-orders__amount";
      const pctBtn = document.createElement("button");
      pctBtn.type = "button";
      pctBtn.className = "rf-amount-btn";
      pctBtn.textContent = "75%";
      pctBtn.title = "按订单金额的 75% 填入退费金额";
      pctBtn.addEventListener("click", function () {
        const v = Math.round(o.amount * 0.75 * 100) / 100;
        state.orderAmounts[idx] = v;
        delete invalidAmounts[idx];
        amountInput.classList.remove("is-error");
        amountInput.value = String(v);
        updateOrdersTotal(s);
      });
      const cur = document.createElement("span");
      cur.className = "rf-orders__cur";
      cur.textContent = o.currency === "HKD" ? "HK$" : "¥";
      const amountInput = document.createElement("input");
      amountInput.type = "text";
      amountInput.inputMode = "decimal";
      amountInput.className = "rf-order-input";
      amountInput.value = String(getOrderAmount(s, idx));
      amountInput.setAttribute("aria-label", o.name + " 退费金额");
      amountInput.addEventListener("input", function () {
        const raw = amountInput.value.trim();
        if (raw !== "" && /^\d+(\.\d{1,2})?$/.test(raw)) {
          amountInput.classList.remove("is-error");
          delete invalidAmounts[idx];
          state.orderAmounts[idx] = parseFloat(raw);
        } else {
          amountInput.classList.add("is-error");
          invalidAmounts[idx] = true;
        }
        updateOrdersTotal(s);
      });
      amountInput.addEventListener("blur", function () {
        if (invalidAmounts[idx]) {
          delete invalidAmounts[idx];
          amountInput.classList.remove("is-error");
          amountInput.value = String(getOrderAmount(s, idx));
          updateOrdersTotal(s);
        } else if (Object.prototype.hasOwnProperty.call(state.orderAmounts, idx)) {
          amountInput.value = String(state.orderAmounts[idx]);
        }
      });
      amountWrap.appendChild(pctBtn);
      amountWrap.appendChild(cur);
      amountWrap.appendChild(amountInput);
      tdRefund.appendChild(amountWrap);
      tr.appendChild(tdRefund);

      el.ordersBody.appendChild(tr);
    });
    updateOrdersTotal(s);
  }

  function closePopper() {
    if (!popper) return;
    popper.el.remove();
    if (popper.anchor) popper.anchor.classList.remove("is-active");
    popper = null;
    dateView = null;
  }

  function ensurePopper(cls, anchor) {
    closePopper();
    const p = document.createElement("div");
    p.className = "rf-popper " + cls;
    document.body.appendChild(p);
    anchor.classList.add("is-active");
    popper = { el: p, anchor: anchor };
    return p;
  }

  function positionPopper() {
    if (!popper) return;
    const r = popper.anchor.getBoundingClientRect();
    const p = popper.el;
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    let left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - w - 8));
    p.style.top = top + "px";
    p.style.left = left + "px";
  }

  function optionsFor(key) {
    if (key === "bill") return cache.bills.map(function (b) { return { value: b.id, label: b.label }; });
    if (key === "form") return cache.forms.map(function (f) { return { value: f.id, label: f.label }; });
    if (key === "student") {
      return (cache.formDetail ? cache.formDetail.students : []).map(function (s) { return { value: s.name, label: s.name }; });
    }
    const d = cache.dict || {};
    const map = {
      project: d.projects,
      approver: d.approvers,
      entity: d.entities,
      dept: d.departments
    };
    return (map[key] || []).map(function (v) { return { value: v, label: v }; });
  }

  function openDropdown(key) {
    const node = el.selects[key];
    if (!node || node.classList.contains("rf-select--disabled")) return;
    if (Date.now() < state.openingUntil) return;
    if (popper && popper.anchor === node) { closePopper(); return; }
    const p = ensurePopper("rf-popper--dropdown", node);
    p.style.minWidth = node.getBoundingClientRect().width + "px";
    const items = optionsFor(key);
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "rf-dropdown__empty";
      empty.textContent = "暂无数据";
      p.appendChild(empty);
    } else {
      const current = key === "bill" ? state.bill : state[key];
      items.forEach(function (it) {
        const d = document.createElement("div");
        d.className = "rf-dropdown__item";
        if (current && current === it.value) d.classList.add("is-selected");
        d.textContent = it.label;
        d.addEventListener("click", function () { choose(key, it.value); });
        p.appendChild(d);
      });
    }
    requestAnimationFrame(function () {
      p.classList.add("is-in");
      positionPopper();
    });
  }

  function choose(key, value) {
    if (key === "form") {
      closePopper();
      renderState();
      selectForm(value);
      return;
    }
    if (key === "student") {
      applyStudent(value);
    } else {
      state[key] = value;
    }
    clearError(key);
    renderState();
    closePopper();
  }

  async function selectForm(id) {
    state.formId = id;
    state.student = null;
    state.selectedOrders = [];
    state.orderAmounts = {};
    invalidAmounts = {};
    state.payNo = "";
    state.merchantNo = "";
    cache.formDetail = null;
    renderState();
    renderOrders();
    setSelectDisplay("student", "", "加载中…");
    try {
      const r = await fetchFormDetail(id);
      if (r.code !== 0) {
        toast(r.message || "报名表加载失败", "error");
        renderState();
        return;
      }
      cache.formDetail = r.data;
      state.project = r.data.projectLabel;
      const s0 = r.data.students[0];
      state.title = r.data.titleProgram + "退费申请-" + s0.name;
      state.reason = s0.reason;
      state.school = "本校";
      clearError("project");
    } catch (e) {
      toast("报名表信息加载失败，请重试", "error");
    }
    renderState();
    renderOrders();
  }

  function applyStudent(name) {
    if (!cache.formDetail) return;
    const s = cache.formDetail.students.find(function (x) { return x.name === name; });
    if (!s) return;
    state.student = name;
    state.payNo = s.payNo;
    state.merchantNo = s.merchantNo;
    state.school = s.school;
    state.reason = s.reason;
    state.title = cache.formDetail.titleProgram + "退费申请-" + name;
    state.selectedOrders = [];
    state.orderAmounts = {};
    invalidAmounts = {};
    clearError("orders");
    renderOrders();
  }

  function openDatepicker() {
    const node = el.dateNode;
    if (Date.now() < state.openingUntil) return;
    if (popper && popper.anchor === node) { closePopper(); return; }
    const base = state.date ? parseDate(state.date) : new Date();
    dateView = { y: base.getFullYear(), m: base.getMonth() + 1 };
    const p = ensurePopper("rf-popper--date", node);
    renderCalendar();
    requestAnimationFrame(function () {
      p.classList.add("is-in");
      positionPopper();
    });
  }

  function renderCalendar() {
    const p = popper.el;
    p.innerHTML = "";

    const head = document.createElement("div");
    head.className = "rf-date__head";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "rf-date__nav";
    prev.setAttribute("aria-label", "上个月");
    prev.innerHTML = CHEV_L;
    prev.addEventListener("click", function () {
      dateView.m -= 1;
      if (dateView.m === 0) { dateView.m = 12; dateView.y -= 1; }
      renderCalendar();
      positionPopper();
    });

    const title = document.createElement("span");
    title.className = "rf-date__title";
    title.textContent = dateView.y + " 年 " + dateView.m + " 月";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "rf-date__nav";
    next.setAttribute("aria-label", "下个月");
    next.innerHTML = CHEV_R;
    next.addEventListener("click", function () {
      dateView.m += 1;
      if (dateView.m === 13) { dateView.m = 1; dateView.y += 1; }
      renderCalendar();
      positionPopper();
    });

    head.appendChild(prev);
    head.appendChild(title);
    head.appendChild(next);
    p.appendChild(head);

    const week = document.createElement("div");
    week.className = "rf-date__week";
    ["一", "二", "三", "四", "五", "六", "日"].forEach(function (w) {
      const s = document.createElement("span");
      s.textContent = w;
      week.appendChild(s);
    });
    p.appendChild(week);

    const grid = document.createElement("div");
    grid.className = "rf-date__grid";

    const first = new Date(dateView.y, dateView.m - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const today = todayStr();

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(dateView.y, dateView.m - 1, 1 - offset + i);
      const str = fmt(cellDate);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rf-date__day";
      btn.textContent = cellDate.getDate();
      if (cellDate.getMonth() !== dateView.m - 1) btn.classList.add("is-out");
      if (str === today) btn.classList.add("is-today");
      if (state.date && str === state.date) btn.classList.add("is-selected");
      btn.addEventListener("click", function () {
        state.date = str;
        clearError("date");
        renderState();
        closePopper();
      });
      grid.appendChild(btn);
    }
    p.appendChild(grid);
  }

  function controlNode(key) {
    if (key === "orders") return el.ordersBox;
    if (el.selects[key]) return el.selects[key];
    if (key === "date") return el.dateNode;
    if (el.inputs[key]) return el.inputs[key];
    return null;
  }

  function showError(key, msg) {
    const node = controlNode(key);
    if (!node) return;
    node.classList.add("is-error");
    const host = node.closest(".rf-control") || node;
    let err = $(".rf-error", host);
    if (!err) {
      err = document.createElement("div");
      err.className = "rf-error";
      host.appendChild(err);
    }
    err.textContent = msg;
  }

  function clearError(key) {
    const node = controlNode(key);
    if (node) node.classList.remove("is-error");
    const host = node ? (node.closest(".rf-control") || node) : null;
    if (host) {
      const err = $(".rf-error", host);
      if (err) err.remove();
    }
  }

  const RULES = [
    { key: "project", msg: "请选择所属项目" },
    { key: "title", msg: "请输入标题" },
    { key: "approver", msg: "请选择审批人" },
    { key: "orders", msg: "" },
    { key: "date", msg: "请选择报销日期" },
    { key: "entity", msg: "请选择法人实体" },
    { key: "reason", msg: "请输入申请原因" },
    { key: "desc", msg: "请输入描述" }
  ];

  function validate() {
    const errors = [];
    RULES.forEach(function (r) {
      let v;
      let msg = r.msg;
      if (r.key === "orders") {
        v = state.selectedOrders.length > 0 ? "ok" : "";
        msg = currentStudentData() ? "请至少勾选一个需退费的订单" : "请先选择报名表与退费学生";
      } else {
        v = state[r.key];
      }
      if (v === null || v === undefined || String(v).trim() === "") {
        showError(r.key, msg);
        errors.push(r);
      } else {
        clearError(r.key);
      }
    });
    return errors;
  }

  function snapshot() {
    return {
      bill: state.bill,
      modifyOrder: state.modifyOrder === "exit" ? "修改为已退出" : "不修改",
      formId: state.formId,
      formLabel: formLabel(state.formId),
      student: state.student,
      project: state.project,
      title: el.inputs.title.value.trim(),
      approver: state.approver,
      orders: selectedOrderData().map(function (o) {
        return { name: o.name, refundable: o.refundable, currency: o.currency };
      }),
      refundTotal: el.ordersSum.textContent.trim(),
      date: state.date,
      entity: state.entity,
      payNo: state.payNo,
      merchantNo: state.merchantNo,
      reason: el.inputs.reason.value.trim(),
      dept: state.dept,
      desc: el.inputs.desc.value.trim(),
      files: state.files.map(function (f) { return f.name; })
    };
  }

  async function copyText(text, label) {
    if (!text) {
      toast("暂无可复制的内容", "warning");
      return;
    }
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch (e2) {
        ok = false;
      }
    }
    if (ok) toast(label ? "已复制" + label : "复制成功", "success");
    else toast("复制失败，请手动选择复制", "error");
  }

  function fmtSize(b) {
    if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + " MB";
    if (b >= 1024) return (b / 1024).toFixed(1) + " KB";
    return b + " B";
  }

  function renderFiles() {
    const list = el.filelist;
    list.hidden = state.files.length === 0;
    list.innerHTML = "";
    state.files.forEach(function (f) {
      const li = document.createElement("li");
      li.className = "rf-file";

      const icon = document.createElement("span");
      icon.className = "rf-file__icon";
      icon.innerHTML = DOC_ICON;

      const main = document.createElement("div");
      main.className = "rf-file__main";
      const meta = document.createElement("div");
      meta.className = "rf-file__meta";
      const name = document.createElement("span");
      name.className = "rf-file__name";
      name.textContent = f.name;
      name.title = f.name;
      const size = document.createElement("span");
      size.className = "rf-file__size";
      size.textContent = fmtSize(f.size);
      meta.appendChild(name);
      meta.appendChild(size);
      main.appendChild(meta);
      if (f.status === "uploading") {
        const bar = document.createElement("div");
        bar.className = "rf-file__bar";
        const inner = document.createElement("i");
        inner.style.width = Math.min(100, Math.round(f.progress)) + "%";
        bar.appendChild(inner);
        main.appendChild(bar);
      }

      const stateNode = document.createElement("span");
      stateNode.className = "rf-file__state" + (f.status === "done" ? " is-done" : "");
      stateNode.textContent = f.status === "done" ? "已上传" : "上传中 " + Math.min(100, Math.round(f.progress)) + "%";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rf-file__remove";
      remove.setAttribute("data-remove", f.id);
      remove.setAttribute("aria-label", "移除文件 " + f.name);
      remove.innerHTML = X_ICON;

      li.appendChild(icon);
      li.appendChild(main);
      li.appendChild(stateNode);
      li.appendChild(remove);
      list.appendChild(li);
    });
  }

  function addFiles(fileList) {
    Array.prototype.forEach.call(fileList, function (f) {
      const item = {
        id: "f" + Date.now() + Math.random().toString(16).slice(2, 6),
        name: f.name,
        size: f.size,
        progress: 0,
        status: "uploading",
        timer: null
      };
      state.files.push(item);
      item.timer = setInterval(function () {
        item.progress += 10 + Math.random() * 20;
        if (item.progress >= 100) {
          item.progress = 100;
          item.status = "done";
          clearInterval(item.timer);
        }
        renderFiles();
      }, 150);
    });
    renderFiles();
    toast("已添加 " + fileList.length + " 个文件，正在上传…", "info");
  }

  function removeFile(id) {
    const i = state.files.findIndex(function (f) { return f.id === id; });
    if (i > -1) {
      if (state.files[i].timer) clearInterval(state.files[i].timer);
      state.files.splice(i, 1);
      renderFiles();
    }
  }

  function toggleSchool() {
    state.school = state.school === "本校" ? "外校" : "本校";
    renderState();
    toast("学生学校已切换为：" + state.school, "info");
  }

  function syncRadioClasses() {
    $$(".rf-radio").forEach(function (label) {
      const input = $(".rf-radio__input", label);
      label.classList.toggle("rf-radio--checked", input.checked);
    });
  }

  function openDialog() {
    if (state.open) return;
    closePopper();
    state.openingUntil = Date.now() + 420;
    state.open = true;
    el.overlay.classList.add("is-open");
    el.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("rf-lock");
    setTimeout(function () { el.closeBtn.focus(); }, 280);
  }

  function closeDialog() {
    if (!state.open || submitting) return;
    closePopper();
    state.open = false;
    el.overlay.classList.remove("is-open");
    el.overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("rf-lock");
  }

  async function handleSubmit() {
    if (submitting) return;
    const errors = validate();
    if (errors.length) {
      toast("请完善表单必填项后再提交", "error");
      const node = controlNode(errors[0].key);
      if (node) node.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (Object.keys(invalidAmounts).length) {
      toast("请输入正确的退费金额", "error");
      const firstInvalid = el.ordersBody.querySelector(".rf-order-input.is-error");
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    submitting = true;
    el.submitBtn.classList.add("is-loading");
    el.submitLabel.textContent = "提 交 中";
    try {
      const r = await submitRefund(snapshot());
      if (r.code === 0) {
        submitting = false;
        el.submitBtn.classList.remove("is-loading");
        el.submitLabel.textContent = "提 交";
        state.selectedOrders = [];
        state.orderAmounts = {};
        invalidAmounts = {};
        renderOrders();
        toast("提交成功，单号 " + r.data.ticketNo + " 已进入审批", "success");
        closeDialog();
      } else {
        toast(r.message || "提交失败，请稍后重试", "error");
      }
    } catch (e) {
      toast("网络异常，请稍后重试", "error");
    }
    submitting = false;
    el.submitBtn.classList.remove("is-loading");
    el.submitLabel.textContent = "提 交";
  }

  function bindEvents() {
    document.addEventListener("click", function (e) {
      const open = e.target.closest("[data-open]");
      if (open) { openDialog(); return; }

      const close = e.target.closest("[data-close]");
      if (close) { closeDialog(); return; }

      const cp = e.target.closest("[data-copy]");
      if (cp) {
        const key = cp.dataset.copy;
        const value = key === "reason" ? el.inputs.reason.value.trim() : (state[key] || "");
        copyText(value, cp.dataset.copyLabel || "");
        return;
      }

      const up = e.target.closest("[data-upload]");
      if (up) { el.fileInput.click(); return; }

      const rm = e.target.closest("[data-remove]");
      if (rm) { removeFile(rm.dataset.remove); return; }

      if (e.target.closest("[data-school]")) { toggleSchool(); return; }
    });

    el.closeBtn.addEventListener("click", closeDialog);

    el.overlay.addEventListener("mousedown", function (e) {
      if (e.target === el.overlay) closeDialog();
    });

    Object.keys(el.selects).forEach(function (key) {
      const node = el.selects[key];
      node.addEventListener("click", function () { openDropdown(key); });
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDropdown(key);
        }
      });
    });

    el.dateNode.addEventListener("click", openDatepicker);
    el.dateNode.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDatepicker();
      }
    });

    ["title", "reason", "desc"].forEach(function (key) {
      el.inputs[key].addEventListener("input", function (e) {
        state[key] = e.target.value;
        clearError(key);
      });
    });

    $$(".rf-radio__input").forEach(function (r) {
      r.addEventListener("change", function () {
        state.modifyOrder = r.value;
        if (r.value === "exit") state.reason = "已退出";
        syncRadioClasses();
        renderState();
      });
    });

    el.fileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files.length) addFiles(e.target.files);
      e.target.value = "";
    });

    el.submitBtn.addEventListener("click", handleSubmit);

    el.form.addEventListener("submit", function (e) { e.preventDefault(); });

    document.addEventListener("mousedown", function (e) {
      if (popper && !popper.el.contains(e.target) && !popper.anchor.contains(e.target)) {
        closePopper();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (popper) closePopper();
      else closeDialog();
    });

    document.addEventListener("focusin", function (e) {
      if (popper && !popper.el.contains(e.target) && !popper.anchor.contains(e.target)) {
        closePopper();
      }
    });

    el.overlay.addEventListener("scroll", function () { closePopper(); }, { passive: true });
    window.addEventListener("resize", function () { closePopper(); });
  }

  async function init() {
    $$(".rf-popper").forEach(function (n) { n.remove(); });
    bindEvents();

    const parts = await Promise.all([fetchBillOptions(), fetchFormOptions(), fetchDictionary()]);
    cache.bills = parts[0].data;
    cache.forms = parts[1].data;
    cache.dict = parts[2].data;

    const r = await fetchFormDetail("F-BPHO-2026-001");
    if (r.code === 0) {
      cache.formDetail = r.data;
      state.formId = r.data.id;
      state.project = r.data.projectLabel;
      const s0 = r.data.students[0];
      state.title = r.data.titleProgram + "退费申请-" + s0.name;
      state.reason = s0.reason;
    }

    state.entity = cache.dict.entities[0];
    state.date = todayStr();
    renderState();
    renderOrders();
    closePopper();

    requestAnimationFrame(function () {
      requestAnimationFrame(openDialog);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
