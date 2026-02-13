import { readJson, writeJson, nowISO } from "./storage.js";
import { INITIATIVE_STATUS, JOURNEY_STAGES, HEALTH_GOALS } from "./constants.js";

const STATE_KEY = "STATE";

function starterHistory() {
  const first = JOURNEY_STAGES[0];
  return [
    {
      stage: first.key,
      stageLabel: first.label,
      at: nowISO(),
      by: "system",
      note: "بدء المسار",
    },
  ];
}

const DEFAULT_STATE = {
  initiatives: [
    {
      id: "IN-1001",
      title: "تحسين رحلة المراجع الرقمية",
      description: "رقمنة نقاط التماس وتقليل زمن الخدمة.",
      owner: "فريق التحول الرقمي",
      ownerUserId: "innovator-001",
      ownerDepartment: "التحول الرقمي",
      goalKey: "patient_experience",
      status: INITIATIVE_STATUS.DRAFT,
      stage: "idea_submission",
      stageHistory: starterHistory(),
      effortScore: 48,
      expectedValueScore: 81,
      aiScreening: {
        clarity: 78,
        feasibility: 72,
        impact: 84,
        alignment: 88,
        total: 80,
        label: "مرشح قوي",
      },
      valueEffortClass: "Quick Win",
      workflow: {
        requiredEvaluations: 3,
        autoLockEnabled: true,
        evaluationDueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      createdAt: nowISO(),
      scores: [],
      averageScore: null,
      reward: null,
      judgingLocked: false,
      prototype: {
        status: "not_started",
        scope: "",
        progress: 0,
        templatesUsed: [],
        tasks: [],
        files: [],
        notes: [],
        ai: null,
        quality: null,
        supportRequest: null,
        ipLog: [],
        updatedAt: nowISO(),
      },
      integrationSync: {
        hr: null,
        training: null,
        hospital_ops: null,
      },
    },
    {
      id: "IN-1002",
      title: "مساعد ذكاء اصطناعي للفرز الأولي",
      description: "مساعد ذكي لتصنيف الأفكار ورفع جودة القرارات.",
      owner: "فريق الابتكار",
      ownerUserId: "innovator-002",
      ownerDepartment: "الإدارة العليا",
      goalKey: "operational_efficiency",
      status: INITIATIVE_STATUS.IN_REVIEW,
      stage: "evaluation",
      stageHistory: [
        {
          stage: "idea_submission",
          stageLabel: "تقديم الفكرة",
          at: nowISO(),
          by: "system",
          note: "تسجيل الفكرة",
        },
        {
          stage: "screening",
          stageLabel: "الفرز الأولي",
          at: nowISO(),
          by: "AI Engine",
          note: "اجتياز الفرز الأولي",
        },
        {
          stage: "evaluation",
          stageLabel: "التقييم",
          at: nowISO(),
          by: "Workflow",
          note: "تحويل تلقائي للتحكيم",
        },
      ],
      effortScore: 62,
      expectedValueScore: 91,
      aiScreening: {
        clarity: 86,
        feasibility: 70,
        impact: 90,
        alignment: 95,
        total: 86,
        label: "مرشح استراتيجي",
      },
      valueEffortClass: "Strategic Bet",
      workflow: {
        requiredEvaluations: 3,
        autoLockEnabled: true,
        evaluationDueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      createdAt: nowISO(),
      scores: [],
      averageScore: null,
      reward: null,
      judgingLocked: false,
      prototype: {
        status: "in_progress",
        scope: "نسخة أولية لمساعد فرز يعتمد واجهة بسيطة ولوحة نتائج",
        progress: 42,
        templatesUsed: ["Dashboard", "Data Flow Diagram"],
        tasks: [
          {
            id: "PT-1001",
            type: "design",
            title: "تصميم شاشة الفرز الأولي",
            assigneeId: "support_entity-001",
            assigneeName: "فريق UX",
            dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 70,
            impact: "رفع وضوح القرارات",
            status: "in_progress",
            createdAt: nowISO(),
            updatedAt: nowISO(),
          },
        ],
        files: [],
        notes: [],
        ai: null,
        quality: null,
        supportRequest: {
          status: "in_progress",
          slaHours: 72,
          requestedBy: "innovator-002",
          requestedByName: "فريق الابتكار",
          note: "نحتاج دعم سريع لإخراج النموذج",
          requestedAt: nowISO(),
          managedBy: "manager-001",
          managedByName: "مدير الابتكار",
        },
        ipLog: [],
        updatedAt: nowISO(),
      },
      integrationSync: {
        hr: null,
        training: null,
        hospital_ops: null,
      },
    },
  ],
  teams: [
    {
      id: "TM-1001",
      name: "فريق التحول الرقمي",
      members: ["سارة", "فهد", "ريم"],
      department: "التحول الرقمي",
    },
    {
      id: "TM-1002",
      name: "فريق الحوكمة والامتثال",
      members: ["عبدالله", "هند"],
      department: "الجودة وسلامة المرضى",
    },
  ],
  governance: {
    approvals: [],
    confidentialityApprovals: [],
  },
  notifications: [
    {
      id: "NT-1001",
      roleTarget: "evaluator",
      type: "evaluation_due",
      message: "يوجد مبادرة جاهزة للتقييم: IN-1002",
      entityId: "IN-1002",
      at: nowISO(),
      read: false,
    },
  ],
  integrations: {
    hr: { status: "connected", lastSyncAt: nowISO(), owner: "الموارد البشرية" },
    training: { status: "connected", lastSyncAt: nowISO(), owner: "إدارة التدريب" },
    hospital_ops: { status: "connected", lastSyncAt: nowISO(), owner: "التشغيل" },
  },
  marketplace: {
    offers: [],
  },
  training: {
    completions: [],
  },
  strategicGoals: HEALTH_GOALS,
};

export function getState() {
  return readJson(STATE_KEY, DEFAULT_STATE);
}

export function saveState(state) {
  writeJson(STATE_KEY, state);
}

export function mutateState(mutator) {
  const current = getState();
  const next = mutator(structuredClone(current));
  saveState(next);
  return next;
}
