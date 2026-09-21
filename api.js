function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function fetchBillOptions() {
  await delay(200);
  return { code: 0, data: JSON.parse(JSON.stringify(DB.bills)) };
}

async function fetchFormOptions() {
  await delay(240);
  return { code: 0, data: DB.forms.map(function (f) { return { id: f.id, label: f.label }; }) };
}

async function fetchFormDetail(formId) {
  await delay(320);
  const f = DB.forms.find(function (x) { return x.id === formId; });
  if (!f) {
    return { code: 40401, message: "报名表不存在或已被删除" };
  }
  return { code: 0, data: JSON.parse(JSON.stringify(f)) };
}

async function fetchDictionary() {
  await delay(180);
  return {
    code: 0,
    data: {
      projects: DB.projects.slice(),
      approvers: DB.approvers.slice(),
      entities: DB.entities.slice(),
      departments: DB.departments.slice()
    }
  };
}

async function submitRefund(payload) {
  await delay(900);
  if (!payload || !payload.title) {
    return { code: 40001, message: "标题不能为空" };
  }
  return {
    code: 0,
    data: {
      ticketNo: "YKB-20260916-000183",
      status: "审批中",
      approver: payload.approver
    }
  };
}
