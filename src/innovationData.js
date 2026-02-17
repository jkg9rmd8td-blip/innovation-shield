export const APP_CONFIG = {
  storageKey: 'innovation_shield_v5_state',
  onboardingKey: 'innovation_shield_v5_onboarding_seen',
  orgName: 'التجمع الصحي بالطائف',
  version: 'V5',
  strategicGoal: 'تحويل الابتكار إلى قدرة تشغيلية مستدامة بأثر سنوي قابل للقياس',
}

export const VIEWS = [
  { id: 'overview', label: 'القيادة التنفيذية' },
  { id: 'lifecycle', label: 'دورة الحياة' },
  { id: 'workflow', label: 'Workflow & Approvals' },
  { id: 'workspace', label: 'لوحة الفريق' },
  { id: 'prototype', label: 'Prototype Builder' },
  { id: 'impact', label: 'Impact Simulator' },
  { id: 'governance', label: 'الحوكمة وIP' },
  { id: 'knowledge', label: 'المعرفة' },
  { id: 'audit', label: 'السجل' },
]

export const LIFECYCLE_STAGES = [
  'Idea Intake',
  'Prototype',
  'Testing',
  'Adoption',
]

export const STATUS_OPTIONS = [
  'جديد',
  'قيد العمل',
  'قيد الاختبار',
  'قيد المراجعة',
  'معتمد',
  'مطبق',
  'متعثر',
]

export const ROLE_OPTIONS = ['مبتكر', 'مراجع', 'حوكمة', 'مدير المنصة']

export const ROLE_PERMISSIONS = {
  مبتكر: {
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canGovernance: false,
    canMoveStage: false,
  },
  مراجع: {
    canCreate: false,
    canEdit: true,
    canApprove: true,
    canGovernance: false,
    canMoveStage: true,
  },
  حوكمة: {
    canCreate: false,
    canEdit: true,
    canApprove: false,
    canGovernance: true,
    canMoveStage: true,
  },
  'مدير المنصة': {
    canCreate: true,
    canEdit: true,
    canApprove: true,
    canGovernance: true,
    canMoveStage: true,
  },
}

export const DOMAIN_OPTIONS = ['تشغيلي', 'تقني', 'سريري', 'تجربة مريض', 'جودة', 'مالي', 'موارد بشرية']

export const WORKFLOW_FLOWS = {
  operational: [
    { id: 'screening', title: 'Gate 1 - فرز الفكرة' },
    { id: 'prototype', title: 'Gate 2 - صلاحية النموذج الأولي' },
    { id: 'pilot', title: 'Gate 3 - جاهزية الاختبار' },
    { id: 'adoption', title: 'Gate 4 - قرار الاعتماد' },
  ],
  technical: [
    { id: 'screening', title: 'Gate 1 - فرز الفكرة' },
    { id: 'architecture', title: 'Gate 2 - اعتماد المعمارية التقنية' },
    { id: 'security', title: 'Gate 3 - أمن المعلومات والتكامل' },
    { id: 'pilot', title: 'Gate 4 - جاهزية الاختبار' },
    { id: 'adoption', title: 'Gate 5 - قرار الاعتماد' },
  ],
  clinical: [
    { id: 'screening', title: 'Gate 1 - فرز الفكرة' },
    { id: 'ethics', title: 'Gate 2 - الموافقة الأخلاقية' },
    { id: 'clinicalSafety', title: 'Gate 3 - التحقق من السلامة السريرية' },
    { id: 'pilot', title: 'Gate 4 - جاهزية الاختبار' },
    { id: 'adoption', title: 'Gate 5 - قرار الاعتماد' },
  ],
}

export const STAGE_GATE_REQUIREMENTS = {
  operational: {
    'Idea Intake': 'screening',
    Prototype: 'prototype',
    Testing: 'pilot',
    Adoption: 'adoption',
  },
  technical: {
    'Idea Intake': 'screening',
    Prototype: 'architecture',
    Testing: 'security',
    Adoption: 'adoption',
  },
  clinical: {
    'Idea Intake': 'screening',
    Prototype: 'ethics',
    Testing: 'clinicalSafety',
    Adoption: 'adoption',
  },
}

export const PROTOTYPE_TEMPLATES = [
  {
    id: 'chatbot-flow',
    name: 'Chatbot Flow',
    focus: 'بناء تدفق محادثة لخدمة داخلية أو مسار مستفيد.',
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard',
    focus: 'لوحة مؤشرات تنفيذية مع تنبيهات وتشغيل فوري.',
  },
  {
    id: 'process-map',
    name: 'Process Map',
    focus: 'تصميم الوضع الحالي والمستهدف مع نقاط الاختناق.',
  },
]

export const IMPACT_MODELS = [
  {
    id: 'financial',
    name: 'وفورات مالية',
    summary: 'قياس التوفير السنوي في التكلفة المباشرة.',
  },
  {
    id: 'patient',
    name: 'تحسين تجربة المريض',
    summary: 'قياس أثر التجربة والرضا والانسيابية.',
  },
  {
    id: 'service',
    name: 'تقليل وقت الخدمة',
    summary: 'قياس خفض الزمن التشغيلي وطاقة الخدمة.',
  },
]

export const GOVERNANCE_CHECKLIST = [
  {
    id: 'ipProtection',
    title: 'تسجيل الملكية الفكرية',
    note: 'توثيق حقوق الفكرة ونطاق الحماية المؤسسية.',
  },
  {
    id: 'confidentiality',
    title: 'اتفاقيات السرية',
    note: 'ضبط مشاركة البيانات مع الأطراف ذات العلاقة.',
  },
  {
    id: 'ethicsReview',
    title: 'مراجعة أخلاقية',
    note: 'التحقق من التوافق الأخلاقي خصوصًا في الحالات السريرية.',
  },
  {
    id: 'dataPolicy',
    title: 'امتثال حوكمة البيانات',
    note: 'الالتزام بسياسات الأمن والخصوصية واستمرارية الأعمال.',
  },
  {
    id: 'ownershipDefined',
    title: 'تحديد الملكية والمسؤوليات',
    note: 'تسمية مالك القرار ومسار المسؤولية التنفيذية.',
  },
]

export const STAGE_KPI_DEFINITION = [
  {
    id: 'intake',
    title: 'Idea Intake',
    focus: 'وضوح المشكلة والقيمة.',
  },
  {
    id: 'prototype',
    title: 'Prototype',
    focus: 'جودة النموذج والفرضيات.',
  },
  {
    id: 'testing',
    title: 'Testing',
    focus: 'جاهزية الاختبار والتحكم بالمخاطر.',
  },
  {
    id: 'adoption',
    title: 'Adoption',
    focus: 'جاهزية التبني المؤسسي.',
  },
]

export const KNOWLEDGE_SHORTS = [
  {
    id: 'short-1',
    title: 'Idea Intake خلال 3 دقائق',
    stage: 'Idea Intake',
    duration: '2-3 دقائق',
    detail: 'حوّل التحدي إلى مشكلة تنفيذية قابلة للقياس.',
  },
  {
    id: 'short-2',
    title: 'Prototype Readiness سريع',
    stage: 'Prototype',
    duration: '2-3 دقائق',
    detail: 'اربط الفرضية بالمؤشر وأغلق فجوات التجربة.',
  },
  {
    id: 'short-3',
    title: 'Testing Plan محكم',
    stage: 'Testing',
    duration: '2-3 دقائق',
    detail: 'نفّذ اختبار محدود مع قرار أسبوعي واضح.',
  },
  {
    id: 'short-4',
    title: 'Adoption Deck قيادي',
    stage: 'Adoption',
    duration: '2-3 دقائق',
    detail: 'قدّم قرار الاعتماد بصيغة تنفيذية مقنعة.',
  },
]

export const KNOWLEDGE_TEMPLATES = [
  {
    id: 'tmpl-1',
    title: 'Canvas',
    detail: 'قالب قيمة وتشغيل لتوحيد الرؤية قبل التنفيذ.',
  },
  {
    id: 'tmpl-2',
    title: 'Business Case',
    detail: 'قالب جدوى مالي/تشغيلي جاهز لقرار القيادة.',
  },
  {
    id: 'tmpl-3',
    title: 'Prototype Checklist',
    detail: 'قائمة تحقق لاكتمال النموذج قبل الاختبار.',
  },
]

export const V4_ROADMAP = [
  {
    id: 'road-1',
    title: 'تكامل منصة فكرة - منشآت',
    note: 'رفع الابتكارات الواعدة تلقائيًا بعد الاعتماد.',
  },
  {
    id: 'road-2',
    title: 'ربط مع نظام الموارد البشرية',
    note: 'اقتراح أعضاء الفريق تلقائيًا حسب نوع الابتكار.',
  },
  {
    id: 'road-3',
    title: 'لوحة أثر سنوية للتجمع',
    note: 'متابعة الأداء على مستوى السنة بالكامل.',
  },
]

export const QUICK_GUIDE = [
  {
    id: 'guide-1',
    title: '1) سجّل الفكرة',
    detail: 'عنوان + مشكلة + حل + مستفيد في شاشة واحدة.',
  },
  {
    id: 'guide-2',
    title: '2) ابنِ نموذجًا أوليًا',
    detail: 'اختر قالبًا، ارفع الأصول، فعّل Auto-Scoring.',
  },
  {
    id: 'guide-3',
    title: '3) اختبر واعتمد',
    detail: 'اتبع Workflow ديناميكيًا حسب نوع الابتكار.',
  },
]

export const ONBOARDING_STEPS = [
  {
    id: 'ob-1',
    title: 'مرحبًا بك في درع الابتكار V5',
    detail: 'هذه نسخة تنفيذية جاهزة لإدارة الابتكار من الالتقاط حتى التبني.',
  },
  {
    id: 'ob-2',
    title: 'ابدأ من دورة الحياة',
    detail: 'سجل فكرة جديدة، ثم انتقل للنموذج والاختبار والاعتماد.',
  },
  {
    id: 'ob-3',
    title: 'لوحة الفريق الذكية',
    detail: 'تابع النضج، المخاطر، مهام الأسبوع، والخطوة التالية تلقائيًا.',
  },
]

export const YEAR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export const DEFAULT_SIMULATION = {
  model: 'financial',
  baselineCost: 180,
  baselineMinutes: 24,
  transactionsPerYear: 1600,
  expectedCostReduction: 18,
  expectedTimeReduction: 20,
}

export const DEFAULT_MONITORING = {
  tocInput: 0,
  tocOutput: 0,
  tocOutcome: 0,
  cashIn: 0,
  cashOut: 0,
  investment: 250000,
  paybackMonths: 18,
  lastReview: null,
}

export const DEFAULT_GOVERNANCE = {
  ipProtection: false,
  confidentiality: false,
  ethicsReview: false,
  dataPolicy: false,
  ownershipDefined: false,
  ipReadiness: 45,
  protectionNeeded: false,
  protectionRequestedAt: null,
  gateApproved: false,
}

export const DEFAULT_MATURITY = {
  clarity: 60,
  feasibility: 55,
  value: 62,
  readiness: 48,
  riskHandling: 52,
}

export const DEFAULT_RISK = {
  operational: 3,
  financial: 2,
  technical: 2,
  compliance: 2,
}

export const DEFAULT_PROTOTYPE = {
  template: 'chatbot-flow',
  progress: 15,
  hypothesis: '',
  testPlan: '',
  validationMetric: '',
  lastDeck: '',
  assets: [],
}

export const DEFAULT_IMPACT = {
  costSaving: 0,
  timeSaving: 0,
  qualityImprovement: 0,
  satisfaction: 0,
}

export const DEFAULT_IDEA = {
  id: '',
  title: 'فكرة جديدة',
  owner: 'فريق الابتكار',
  department: 'التجمع الصحي بالطائف',
  domain: 'تشغيلي',
  problem: '',
  solution: '',
  beneficiary: '',
  stage: 'Idea Intake',
  status: 'جديد',
  maturity: DEFAULT_MATURITY,
  risk: DEFAULT_RISK,
  prototype: DEFAULT_PROTOTYPE,
  impact: DEFAULT_IMPACT,
  simulation: DEFAULT_SIMULATION,
  monitoring: DEFAULT_MONITORING,
  governance: DEFAULT_GOVERNANCE,
  approvals: {},
  workspace: {
    tasks: [],
    notes: [],
  },
  timeline: [],
  createdAt: '',
  updatedAt: '',
}

export const DEFAULT_SESSION = {
  isAuthenticated: false,
  name: '',
  role: ROLE_OPTIONS[0],
  lastLoginAt: null,
}

export const DEFAULT_STATE = {
  meta: {
    orgName: APP_CONFIG.orgName,
    version: APP_CONFIG.version,
    strategicGoal: APP_CONFIG.strategicGoal,
    lastUpdated: '2026-02-17T22:30:00.000Z',
  },
  engagement: {
    contributors: 23,
    activeSquads: 8,
  },
  session: DEFAULT_SESSION,
  auditLog: [],
  ideas: [
    {
      id: 'INN-501',
      title: 'مركز تنبيهات التحويلات السريرية',
      owner: 'فريق الابتكار السريري',
      department: 'إدارة التشغيل السريري',
      domain: 'سريري',
      problem: 'تأخر الاستجابة للتحويلات الداخلية الحرجة بين المنشآت.',
      solution: 'محرك تنبيهات مرحلي مع لوحة تحكم فورية ونقاط تصعيد آلية.',
      beneficiary: 'الأطباء والمرضى وفرق التنسيق',
      stage: 'Testing',
      status: 'قيد الاختبار',
      maturity: {
        clarity: 84,
        feasibility: 76,
        value: 88,
        readiness: 72,
        riskHandling: 70,
      },
      risk: {
        operational: 3,
        financial: 2,
        technical: 3,
        compliance: 2,
      },
      prototype: {
        template: 'kpi-dashboard',
        progress: 68,
        hypothesis: 'التنبيه المبكر سيخفض زمن التحويل بنسبة 25%.',
        testPlan: 'اختبار 3 أسابيع على مسارين سريريين عاليي الكثافة.',
        validationMetric: 'متوسط زمن الإغلاق لكل تحويل',
        lastDeck: 'Executive Deck v1',
        assets: [],
      },
      impact: {
        costSaving: 280000,
        timeSaving: 24,
        qualityImprovement: 21,
        satisfaction: 17,
      },
      simulation: {
        model: 'service',
        baselineCost: 230,
        baselineMinutes: 31,
        transactionsPerYear: 1800,
        expectedCostReduction: 15,
        expectedTimeReduction: 27,
      },
      monitoring: {
        tocInput: 62,
        tocOutput: 48,
        tocOutcome: 41,
        cashIn: 0,
        cashOut: 0,
        investment: 320000,
        paybackMonths: 17,
        lastReview: '2026-02-16T09:10:00.000Z',
      },
      governance: {
        ipProtection: true,
        confidentiality: true,
        ethicsReview: true,
        dataPolicy: true,
        ownershipDefined: true,
        ipReadiness: 82,
        protectionNeeded: false,
        protectionRequestedAt: null,
        gateApproved: true,
      },
      approvals: {
        screening: {
          status: 'approved',
          requested: false,
          requestedAt: '2026-02-06T10:20:00.000Z',
          decidedBy: 'مراجع أول',
          decidedAt: '2026-02-06T15:00:00.000Z',
          note: 'اجتازت الفرز.',
        },
        ethics: {
          status: 'approved',
          requested: false,
          requestedAt: '2026-02-08T09:00:00.000Z',
          decidedBy: 'لجنة أخلاقيات',
          decidedAt: '2026-02-09T12:00:00.000Z',
          note: 'موافقة أخلاقية.',
        },
        clinicalSafety: {
          status: 'approved',
          requested: false,
          requestedAt: '2026-02-10T09:00:00.000Z',
          decidedBy: 'قسم السلامة',
          decidedAt: '2026-02-11T11:00:00.000Z',
          note: 'تمت مراجعة السلامة.',
        },
        pilot: {
          status: 'pending',
          requested: true,
          requestedAt: '2026-02-17T08:00:00.000Z',
          decidedBy: '',
          decidedAt: null,
          note: '',
        },
        adoption: {
          status: 'not_requested',
          requested: false,
          requestedAt: null,
          decidedBy: '',
          decidedAt: null,
          note: '',
        },
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-501-1',
            text: 'إغلاق قائمة مخاطر الاختبار السريري',
            done: false,
            dueAt: '2026-02-20T10:00:00.000Z',
          },
          {
            id: 'TSK-501-2',
            text: 'تحديث لوحة الأداء اليومية',
            done: true,
            dueAt: '2026-02-15T10:00:00.000Z',
          },
        ],
        notes: [
          {
            id: 'NTE-501-1',
            author: 'مدير الابتكار',
            text: 'الفريق جاهز لطلب اعتماد اختبار أوسع في الأسبوع القادم.',
            at: '2026-02-16T13:00:00.000Z',
          },
        ],
      },
      timeline: [
        {
          id: 'EVT-501-1',
          at: '2026-02-17T08:00:00.000Z',
          title: 'طلب اعتماد Gate pilot',
          detail: 'تم رفع الطلب من قائد الفريق.',
        },
      ],
      createdAt: '2026-02-03T07:00:00.000Z',
      updatedAt: '2026-02-17T08:00:00.000Z',
    },
    {
      id: 'INN-502',
      title: 'مساعد HR الذكي لتوجيه الطلبات',
      owner: 'فريق التحول الرقمي',
      department: 'الموارد البشرية',
      domain: 'تقني',
      problem: 'تأخر توجيه الطلبات الإدارية وتكرار الاستفسارات.',
      solution: 'مساعد ذكي يصنف الطلب ويوجهه للمسار التنفيذي الصحيح.',
      beneficiary: 'الموظفون وإدارات الدعم',
      stage: 'Prototype',
      status: 'قيد العمل',
      maturity: {
        clarity: 74,
        feasibility: 71,
        value: 80,
        readiness: 60,
        riskHandling: 57,
      },
      risk: {
        operational: 2,
        financial: 2,
        technical: 3,
        compliance: 3,
      },
      prototype: {
        template: 'chatbot-flow',
        progress: 46,
        hypothesis: 'المساعد سيخفض زمن الرد الأول بنسبة 35%.',
        testPlan: 'اختبار تجريبي على 4 إدارات لمدة أسبوعين.',
        validationMetric: 'First Response Time',
        lastDeck: 'Prototype Brief v0.9',
        assets: [],
      },
      impact: {
        costSaving: 140000,
        timeSaving: 18,
        qualityImprovement: 12,
        satisfaction: 19,
      },
      simulation: {
        model: 'financial',
        baselineCost: 140,
        baselineMinutes: 21,
        transactionsPerYear: 2600,
        expectedCostReduction: 16,
        expectedTimeReduction: 22,
      },
      monitoring: {
        tocInput: 0,
        tocOutput: 0,
        tocOutcome: 0,
        cashIn: 0,
        cashOut: 0,
        investment: 210000,
        paybackMonths: 15,
        lastReview: null,
      },
      governance: {
        ipProtection: true,
        confidentiality: true,
        ethicsReview: false,
        dataPolicy: true,
        ownershipDefined: false,
        ipReadiness: 58,
        protectionNeeded: true,
        protectionRequestedAt: null,
        gateApproved: false,
      },
      approvals: {
        screening: {
          status: 'approved',
          requested: false,
          requestedAt: '2026-02-11T08:00:00.000Z',
          decidedBy: 'مراجع أول',
          decidedAt: '2026-02-11T14:30:00.000Z',
          note: 'مقبولة للانتقال إلى المعمارية.',
        },
        architecture: {
          status: 'pending',
          requested: true,
          requestedAt: '2026-02-16T08:00:00.000Z',
          decidedBy: '',
          decidedAt: null,
          note: '',
        },
        security: {
          status: 'not_requested',
          requested: false,
          requestedAt: null,
          decidedBy: '',
          decidedAt: null,
          note: '',
        },
        pilot: {
          status: 'not_requested',
          requested: false,
          requestedAt: null,
          decidedBy: '',
          decidedAt: null,
          note: '',
        },
        adoption: {
          status: 'not_requested',
          requested: false,
          requestedAt: null,
          decidedBy: '',
          decidedAt: null,
          note: '',
        },
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-502-1',
            text: 'استكمال خريطة التكامل مع أنظمة HR',
            done: false,
            dueAt: '2026-02-21T12:00:00.000Z',
          },
        ],
        notes: [],
      },
      timeline: [
        {
          id: 'EVT-502-1',
          at: '2026-02-16T08:00:00.000Z',
          title: 'طلب اعتماد Gate architecture',
          detail: 'بانتظار قرار المعمارية التقنية.',
        },
      ],
      createdAt: '2026-02-08T10:00:00.000Z',
      updatedAt: '2026-02-17T09:10:00.000Z',
    },
  ],
}
