const DB = {
  bills: [
    { id: "REFUND", label: "退费申请单" },
    { id: "EXPENSE", label: "日常报销单" },
    { id: "TRAVEL", label: "差旅报销单" },
    { id: "PAYMENT", label: "付款申请单" }
  ],
  forms: [
    {
      id: "F-BPHO-2026-001",
      label: "BPhO 英国物理测评 · 2026 报名表",
      projectLabel: "BPhO 英国物理测评（理工科）",
      titleProgram: "BPhO英国物理测评",
      students: [
        {
          name: "王雨桐",
          fee: 4800,
          refundRate: 0.75,
          payNo: "WXP2026091210355008123",
          merchantNo: "ASD-M-20260912-000382",
          school: "本校",
          reason: "已退出",
          payMeta: {
            createdAt: "2026-09-01 10:12",
            paidAt: "2026-09-01 10:20",
            orderNo: "MP2026090100046"
          },
          orders: [
            { name: "BPhO 英国物理测评（理工科）报名费", amount: 4800, refundable: 3600, currency: "CNY", status: "已支付" },
            { name: "BPhO 历年真题集（电子版）", amount: 200, refundable: 200, currency: "CNY", status: "已支付" }
          ]
        }
      ]
    },
    {
      id: "F-BPHO-2026-002",
      label: "BPhO 英国物理测评 · 2026 报名表（成都七中团体）",
      projectLabel: "BPhO 英国物理测评（理工科）",
      titleProgram: "BPhO英国物理测评",
      students: [
        {
          name: "周子墨",
          fee: 4800,
          refundRate: 0.75,
          payNo: "WXP2026090816223477901",
          merchantNo: "ASD-M-20260908-000361",
          school: "外校",
          reason: "已退出",
          payMeta: {
            createdAt: "2026-08-28 14:03",
            paidAt: "2026-08-28 14:11",
            orderNo: "MP2026082800031"
          },
          orders: [
            { name: "BPhO 英国物理测评（理工科）报名费", amount: 4800, refundable: 3600, currency: "CNY", status: "已支付" },
            { name: "BPhO 考前冲刺讲座", amount: 300, refundable: 300, currency: "CNY", status: "已支付" }
          ]
        },
        {
          name: "林一诺",
          fee: 4800,
          refundRate: 0.75,
          payNo: "WXP2026090816223477902",
          merchantNo: "ASD-M-20260908-000362",
          school: "本校",
          reason: "课程调整",
          payMeta: {
            createdAt: "2026-08-28 15:26",
            paidAt: "2026-08-28 15:33",
            orderNo: "MP2026082800032"
          },
          orders: [
            { name: "BPhO 英国物理测评（理工科）报名费", amount: 4800, refundable: 3600, currency: "CNY", status: "已支付" },
            { name: "BPhO 历年真题集（电子版）", amount: 200, refundable: 200, currency: "CNY", status: "已支付" }
          ]
        }
      ]
    },
    {
      id: "F-AMC-2026-014",
      label: "AMC 美国数学测评 · 2026 报名表",
      projectLabel: "AMC 美国数学测评（理工科）",
      titleProgram: "AMC美国数学测评",
      students: [
        {
          name: "李思远",
          fee: 3200,
          refundRate: 0.75,
          payNo: "ALP2026090509331288456",
          merchantNo: "ASD-M-20260905-000297",
          school: "本校",
          reason: "已退出",
          payMeta: {
            createdAt: "2026-09-05 09:18",
            paidAt: "2026-09-05 09:25",
            orderNo: "MP2026090500027"
          },
          orders: [
            { name: "AMC 美国数学测评报名费", amount: 3200, refundable: 2400, currency: "CNY", status: "已支付" },
            { name: "AMC 备考讲义（纸质邮寄）", amount: 150, refundable: 150, currency: "CNY", status: "已支付" }
          ]
        }
      ]
    },
    {
      id: "F-BMO-2025-009",
      label: "BMO 英国数学测评 · 2025 报名表",
      projectLabel: "BMO 英国数学测评（理工科）",
      titleProgram: "BMO英国数学测评",
      students: [
        {
          name: "苏婉晴",
          fee: 4200,
          refundRate: 0.75,
          payNo: "WXP2025082014119023378",
          merchantNo: "ASD-M-20250820-000155",
          school: "外校",
          reason: "已退出",
          payMeta: {
            createdAt: "2025-08-12 11:40",
            paidAt: "2025-08-12 11:48",
            orderNo: "MP2025081200019"
          },
          orders: [
            { name: "BMO 英国数学测评报名费", amount: 4200, refundable: 3150, currency: "HKD", status: "已支付" },
            { name: "BMO 历年真题集（电子版）", amount: 300, refundable: 300, currency: "HKD", status: "已支付" }
          ]
        }
      ]
    },
    {
      id: "F-VOL-2025-077",
      label: "国际志愿者项目 · 2025 报名表",
      projectLabel: "国际志愿者项目（志愿者）",
      titleProgram: "国际志愿者项目",
      students: [
        {
          name: "陈嘉禾",
          fee: 5600,
          refundRate: 0.75,
          payNo: "UNP2025073018556120943",
          merchantNo: "ASD-M-20250730-000118",
          school: "本校",
          reason: "行程取消",
          payMeta: {
            createdAt: "2025-07-21 16:52",
            paidAt: "2025-07-21 17:00",
            orderNo: "MP2025072100008"
          },
          orders: [
            { name: "国际志愿者项目费（斯里兰卡支教）", amount: 5600, refundable: 4200, currency: "CNY", status: "已支付" }
          ]
        }
      ]
    }
  ],
  projects: [
    "BPhO 英国物理测评（理工科）",
    "AMC 美国数学测评（理工科）",
    "BMO 英国数学测评（理工科）",
    "国际志愿者项目（志愿者）",
    "IPC 国际物理挑战（理工科）"
  ],
  approvers: ["张敏（财务）", "刘倩（校区运营）", "王浩（项目部）", "赵蕾（财务总监）"],
  entities: [
    "阿思丹（成都）教育科技有限公司",
    "阿思丹（北京）教育咨询有限公司",
    "阿思丹（香港）教育科技有限公司"
  ],
  departments: ["理工科项目部", "志愿者项目部", "文科项目部", "财务部", "市场部"]
};
