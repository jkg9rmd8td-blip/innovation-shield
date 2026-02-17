import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { BENCHMARK_CATALOG, PROTOTYPE_TEMPLATES } from './innovationData'
import { METHOD_TOOLKIT } from './methodToolkit'
import {
  benchmarkInitiative,
  buildPitchDeck,
  calcMaturity,
  calcReadiness,
  calcRisk,
  cloneInitiative,
  formatDate,
  formatNumber,
  newId,
  simulateImpact,
} from './engine'

const STORAGE_KEY = 'innovation_shield_v4_state'
const ONBOARDING_SEEN_KEY = 'innovation_shield_v4_onboarding_seen'

const QUICK_START_STEPS = [
  {
    id: 'step-1',
    title: '1) قدم فكرتك',
    detail: 'اكتب المشكلة والحل والمستفيد خلال أقل من 5 دقائق.',
  },
  {
    id: 'step-2',
    title: '2) اختبر بسرعة',
    detail: 'ابنِ نموذجًا أوليًا واضبط خطة الاختبار مع مؤشرات قياس واضحة.',
  },
  {
    id: 'step-3',
    title: '3) اعتمد وطبّق',
    detail: 'مر عبر Workflow الموافقات والحوكمة للوصول إلى التطبيق المؤسسي.',
  },
]

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'مرحبًا بك في درع الابتكار',
    detail: 'المنصة تمكّن موظفي التجمع الصحي من تحويل الفكرة إلى نموذج أولي خلال 6 أسابيع.',
  },
  {
    id: 'flow',
    title: 'المسار المختصر',
    detail: 'ابدأ من "دورة حياة الابتكار": قدم الفكرة → اختبرها → اطلب الاعتماد.',
  },
  {
    id: 'actions',
    title: 'ابدأ الآن',
    detail: 'استخدم زر "ابدأ ابتكار جديد" الثابت للانتقال المباشر إلى نموذج إدخال الفكرة.',
  },
]

const SUCCESS_CASES = [
  {
    id: 'case-1',
    title: 'تقليل زمن التحويل الداخلي',
    result: 'خفض زمن التحويل 22% خلال 8 أسابيع',
    owner: 'إدارة التشغيل',
  },
  {
    id: 'case-2',
    title: 'تسريع الرد على استفسارات الموظفين',
    result: 'خفض زمن الاستجابة 30%',
    owner: 'الموارد البشرية',
  },
  {
    id: 'case-3',
    title: 'تحسين رحلة المريض في العيادات',
    result: 'انخفاض وقت الانتظار 20%',
    owner: 'إدارة تجربة المريض',
  },
]

const MICRO_LEARNING = [
  {
    id: 'ml-1',
    title: 'Idea Intake في 3 دقائق',
    stage: 'التقاط الفكرة',
    duration: '2-3 دقائق',
    focus: 'صياغة مشكلة تنفيذية قابلة للقياس.',
  },
  {
    id: 'ml-2',
    title: 'Business Case سريع',
    stage: 'الفرز المؤسسي',
    duration: '2-3 دقائق',
    focus: 'ربط الحل بالعائد والتكلفة والمخاطر.',
  },
  {
    id: 'ml-3',
    title: 'Prototype Checklist',
    stage: 'بناء النموذج الأولي',
    duration: '2-3 دقائق',
    focus: 'تحقق من الفرضية، القياس، وأدلة الاختبار.',
  },
  {
    id: 'ml-4',
    title: 'Canvas عملي',
    stage: 'الاختبار الميداني',
    duration: '2-3 دقائق',
    focus: 'تحويل نتائج الاختبار إلى قرار اعتماد.',
  },
]

const STRATEGIC_V4_TRACKS = [
  {
    id: 'track-1',
    title: 'تكامل منصة فكرة - منشآت',
    note: 'رفع الابتكارات الواعدة تلقائيًا بعد اجتياز الاعتماد.',
  },
  {
    id: 'track-2',
    title: 'تكامل نظام الموارد البشرية',
    note: 'تحديد الفريق الأنسب تلقائيًا حسب نوع الابتكار.',
  },
  {
    id: 'track-3',
    title: 'لوحة أثر سنوية للتجمع الصحي',
    note: 'متابعة الأثر الكلي شهريًا على مستوى سنة كاملة.',
  },
]

const YEAR_MONTHS = [
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

const VIEWS = [
  { id: 'overview', label: 'الرؤية التنفيذية' },
  { id: 'lifecycle', label: 'دورة حياة الابتكار' },
  { id: 'workflow', label: 'Workflow & Approvals' },
  { id: 'workspace', label: 'Innovation Workspace' },
  { id: 'prototype', label: 'Prototype Builder' },
  { id: 'impact', label: 'Impact Simulator' },
  { id: 'knowledge', label: 'المكتبة المعرفية' },
  { id: 'governance', label: 'الحوكمة والملكية الفكرية' },
  { id: 'audit', label: 'Audit Log' },
]

const LIFECYCLE_STAGES = [
  'التقاط الفكرة',
  'الفرز المؤسسي',
  'بناء النموذج الأولي',
  'الاختبار الميداني',
  'الاعتماد',
  'التوسع والتطبيق',
]

const STATUS_OPTIONS = ['جديد', 'قيد العمل', 'قيد الاختبار', 'قيد المراجعة', 'معتمد', 'مطبق']

const ROLE_OPTIONS = ['مبتكر', 'مراجع', 'حوكمة', 'مدير المنصة']

const ROLE_PERMISSIONS = {
  مبتكر: {
    canCreate: true,
    canEdit: true,
    canMoveStages: false,
    canApprove: false,
    canGovernance: false,
  },
  مراجع: {
    canCreate: false,
    canEdit: true,
    canMoveStages: true,
    canApprove: true,
    canGovernance: false,
  },
  حوكمة: {
    canCreate: false,
    canEdit: true,
    canMoveStages: true,
    canApprove: false,
    canGovernance: true,
  },
  'مدير المنصة': {
    canCreate: true,
    canEdit: true,
    canMoveStages: true,
    canApprove: true,
    canGovernance: true,
  },
}

const APPROVAL_FLOWS = {
  operational: [
    { id: 'screening', title: 'Gate 1 - فرز الفكرة' },
    { id: 'prototype', title: 'Gate 2 - صلاحية النموذج' },
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
    { id: 'clinicalSafety', title: 'Gate 3 - سلامة سريرية' },
    { id: 'pilot', title: 'Gate 4 - جاهزية الاختبار' },
    { id: 'adoption', title: 'Gate 5 - قرار الاعتماد' },
  ],
}

const STAGE_GATE_REQUIREMENTS_BY_TYPE = {
  operational: {
    'الفرز المؤسسي': 'screening',
    'بناء النموذج الأولي': 'prototype',
    'الاختبار الميداني': 'pilot',
    الاعتماد: 'adoption',
    'التوسع والتطبيق': 'adoption',
  },
  technical: {
    'الفرز المؤسسي': 'screening',
    'بناء النموذج الأولي': 'architecture',
    'الاختبار الميداني': 'security',
    الاعتماد: 'pilot',
    'التوسع والتطبيق': 'adoption',
  },
  clinical: {
    'الفرز المؤسسي': 'screening',
    'بناء النموذج الأولي': 'ethics',
    'الاختبار الميداني': 'clinicalSafety',
    الاعتماد: 'pilot',
    'التوسع والتطبيق': 'adoption',
  },
}

const ALL_APPROVAL_GATES = Array.from(
  new Map(
    Object.values(APPROVAL_FLOWS)
      .flat()
      .map((gate) => [gate.id, gate]),
  ).values(),
)

const STAGE_MATURITY_KPIS = [
  { id: 'intake', title: 'Idea Intake', focus: 'وضوح المشكلة والقيمة' },
  { id: 'prototype', title: 'Prototype', focus: 'جودة الفرضية وتجهيز النموذج' },
  { id: 'testing', title: 'Testing', focus: 'جاهزية الاختبار وإدارة المخاطر' },
  { id: 'adoption', title: 'Adoption', focus: 'الجاهزية للتبني المؤسسي' },
]

const IMPACT_MODELS = [
  { id: 'financial', label: 'وفورات مالية' },
  { id: 'patient', label: 'تحسين تجربة المريض' },
  { id: 'service', label: 'تقليل وقت الخدمة' },
]

const DOMAIN_OPTIONS = ['تشغيلي', 'تقني', 'سريري', 'جودة', 'تجربة مريض', 'موارد بشرية', 'مالي']

const REQUIRED_GOVERNANCE_FIELDS = [
  'ipProtection',
  'confidentiality',
  'ethicsReview',
  'dataPolicy',
  'ownershipDefined',
]

const DEFAULT_INTAKE_FORM = {
  title: '',
  owner: '',
  department: 'التجمع الصحي بالطائف',
  domain: 'تشغيلي',
  problem: '',
  solution: '',
  beneficiary: '',
}

const DEFAULT_LOGIN_FORM = {
  name: '',
  role: ROLE_OPTIONS[0],
}

const DEFAULT_SIMULATION_INPUTS = {
  model: IMPACT_MODELS[0].id,
  baselineCost: 180,
  baselineMinutes: 24,
  transactionsPerYear: 1500,
  expectedCostReduction: 15,
  expectedTimeReduction: 20,
}

const DEFAULT_MONITORING = {
  tocInput: 0,
  tocOutput: 0,
  tocOutcome: 0,
  cashIn: 0,
  cashOut: 0,
  investment: 250000,
  paybackMonths: 18,
  lastReview: null,
}

const DEFAULT_SESSION = {
  isAuthenticated: false,
  name: '',
  role: ROLE_OPTIONS[0],
  lastLoginAt: null,
}

const DEFAULT_STATE = {
  meta: {
    orgName: 'التجمع الصحي بالطائف',
    version: 'V4',
    strategicGoal: 'منظومة إنتاج ابتكاري مؤسسية مستدامة',
    lastUpdated: '2026-02-17T20:20:00.000Z',
  },
  engagement: {
    contributors: 18,
    activeSquads: 6,
  },
  session: DEFAULT_SESSION,
  auditLog: [],
  ideas: [
    {
      id: 'INN-201',
      title: 'منصة ذكية لإدارة التحويلات الداخلية',
      owner: 'فريق التحول التشغيلي',
      department: 'إدارة التشغيل',
      domain: 'تشغيلي',
      problem: 'تفاوت أزمنة التحويل بين المرافق وتأخر وصول الخدمة.',
      solution: 'تدفق رقمي موحد للتحويل مع تنبيهات فورية وتتبّع لحظي.',
      beneficiary: 'الطواقم السريرية والمرضى',
      stage: 'بناء النموذج الأولي',
      status: 'قيد العمل',
      maturity: {
        clarity: 82,
        feasibility: 74,
        value: 86,
        readiness: 70,
        riskHandling: 66,
      },
      prototype: {
        template: 'service-blueprint',
        progress: 58,
        hypothesis: 'التدفق الموحد سيخفض زمن التحويل بنسبة 20%.',
        testPlan: 'اختبار 4 أسابيع على عيادتين ومركزي تحويل.',
        validationMetric: 'متوسط زمن التحويل',
        lastDeck: '',
      },
      impact: {
        costSaving: 210000,
        timeSaving: 22,
        qualityImprovement: 18,
        satisfaction: 15,
      },
      simulationInputs: {
        baselineCost: 220,
        baselineMinutes: 30,
        transactionsPerYear: 1700,
        expectedCostReduction: 19,
        expectedTimeReduction: 24,
      },
      workspace: {
        tasks: [
          { id: 'TSK-201-1', text: 'اعتماد خارطة رحلة التحويل الحالية', done: true },
          { id: 'TSK-201-2', text: 'إنهاء سيناريوهات الاختبار الميداني', done: false },
        ],
        notes: [
          {
            id: 'NTE-201-1',
            author: 'مدير الابتكار',
            text: 'المرحلة الحالية مناسبة للانتقال إلى اختبار ميداني محدود.',
            at: '2026-02-16T08:20:00.000Z',
          },
        ],
      },
      governance: {
        ipProtection: true,
        confidentiality: true,
        ethicsReview: true,
        dataPolicy: true,
        ownershipDefined: true,
      },
      monitoring: {
        tocInput: 55,
        tocOutput: 42,
        tocOutcome: 37,
        cashIn: 0,
        cashOut: 0,
        investment: 310000,
        paybackMonths: 20,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      createdAt: '2026-02-05T07:30:00.000Z',
      updatedAt: '2026-02-17T09:10:00.000Z',
    },
    {
      id: 'INN-202',
      title: 'مساعد رقمي لاستفسارات الموظفين',
      owner: 'فريق تجربة الموظف',
      department: 'إدارة الموارد البشرية',
      domain: 'موارد بشرية',
      problem: 'تكرار الاستفسارات وتأخر الرد على الطلبات الداخلية.',
      solution: 'مساعد ذكي يوجه الطلبات ويربطها بالمسارات المناسبة تلقائياً.',
      beneficiary: 'موظفو التجمع',
      stage: 'الفرز المؤسسي',
      status: 'قيد العمل',
      maturity: {
        clarity: 73,
        feasibility: 66,
        value: 78,
        readiness: 52,
        riskHandling: 58,
      },
      prototype: {
        template: 'digital-mvp',
        progress: 24,
        hypothesis: 'توجيه الطلبات آلياً سيخفض زمن الاستجابة بنسبة 30%.',
        testPlan: 'تجربة أولية على 3 إدارات لمدة أسبوعين.',
        validationMetric: 'زمن الاستجابة الأولي',
        lastDeck: '',
      },
      impact: {
        costSaving: 120000,
        timeSaving: 18,
        qualityImprovement: 14,
        satisfaction: 17,
      },
      simulationInputs: {
        baselineCost: 120,
        baselineMinutes: 18,
        transactionsPerYear: 2400,
        expectedCostReduction: 14,
        expectedTimeReduction: 28,
      },
      workspace: {
        tasks: [{ id: 'TSK-202-1', text: 'تحديد نطاق MVP', done: false }],
        notes: [],
      },
      governance: {
        ipProtection: true,
        confidentiality: true,
        ethicsReview: false,
        dataPolicy: true,
        ownershipDefined: false,
      },
      monitoring: DEFAULT_MONITORING,
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      createdAt: '2026-02-10T10:30:00.000Z',
      updatedAt: '2026-02-17T10:10:00.000Z',
    },
  ],
}

function createDefaultApprovalGate() {
  return {
    status: 'not_requested',
    requested: false,
    requestedAt: null,
    decidedBy: '',
    decidedAt: null,
    note: '',
  }
}

function createDefaultApprovals() {
  return ALL_APPROVAL_GATES.reduce((acc, gate) => {
    acc[gate.id] = createDefaultApprovalGate()
    return acc
  }, {})
}

function safeParse(input, fallback) {
  try {
    return JSON.parse(input)
  } catch {
    return fallback
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function resolveTemplateId(inputId) {
  const fallback = PROTOTYPE_TEMPLATES[0]?.id || 'service-blueprint'
  if (!inputId) return fallback
  return PROTOTYPE_TEMPLATES.some((item) => item.id === inputId) ? inputId : fallback
}

function addDays(baseIso, days) {
  const base = new Date(baseIso || new Date().toISOString())
  if (Number.isNaN(base.getTime())) return new Date().toISOString()
  base.setDate(base.getDate() + Number(days || 0))
  return base.toISOString()
}

function resolveWorkflowType(domain) {
  const text = String(domain || '').toLowerCase()
  if (text.includes('تقني')) return 'technical'
  if (text.includes('سريري') || text.includes('تجربة')) return 'clinical'
  return 'operational'
}

function getApprovalFlow(domain) {
  const type = resolveWorkflowType(domain)
  return APPROVAL_FLOWS[type] || APPROVAL_FLOWS.operational
}

function getStageGateRequirement(domain, stage) {
  const type = resolveWorkflowType(domain)
  const map = STAGE_GATE_REQUIREMENTS_BY_TYPE[type] || STAGE_GATE_REQUIREMENTS_BY_TYPE.operational
  return map[stage] || null
}

function getAutoOwnerByDomain(domain) {
  if (resolveWorkflowType(domain) === 'technical') return 'فريق التحول الرقمي'
  if (resolveWorkflowType(domain) === 'clinical') return 'فريق الابتكار السريري'
  return 'فريق الابتكار التشغيلي'
}

function getProgressPercentByStage(stage) {
  const index = LIFECYCLE_STAGES.indexOf(stage)
  if (index < 0) return 0
  return Math.round(((index + 1) / LIFECYCLE_STAGES.length) * 100)
}

function calcPrototypeQuality(idea) {
  if (!idea) return 0
  const progress = clamp(idea.prototype?.progress || 0, 0, 100)
  const hasHypothesis = idea.prototype?.hypothesis?.trim() ? 1 : 0
  const hasPlan = idea.prototype?.testPlan?.trim() ? 1 : 0
  const hasMetric = idea.prototype?.validationMetric?.trim() ? 1 : 0
  const assetsCount = Array.isArray(idea.prototype?.assets) ? idea.prototype.assets.length : 0
  const assetScore = Math.min(20, assetsCount * 5)

  return clamp(
    Math.round(progress * 0.45 + hasHypothesis * 15 + hasPlan * 15 + hasMetric * 10 + assetScore),
    0,
    100,
  )
}

function calcStageMaturityKpis(idea) {
  const maturity = calcMaturity(idea)
  const readiness = calcReadiness(idea)
  const risk = calcRisk(idea)
  const prototypeQuality = calcPrototypeQuality(idea)
  const byId = {
    intake: clamp(Math.round((idea?.maturity?.clarity || 0) * 0.55 + (idea?.maturity?.value || 0) * 0.45), 0, 100),
    prototype: clamp(Math.round(prototypeQuality * 0.7 + (idea?.maturity?.feasibility || 0) * 0.3), 0, 100),
    testing: clamp(Math.round(readiness * 0.6 + (100 - risk) * 0.4), 0, 100),
    adoption: clamp(
      Math.round(
        maturity * 0.3 +
          readiness * 0.35 +
          (idea?.governance?.gateApproved ? 100 : 45) * 0.2 +
          (idea?.status === 'معتمد' || idea?.status === 'مطبق' ? 100 : 55) * 0.15,
      ),
      0,
      100,
    ),
  }

  return STAGE_MATURITY_KPIS.map((item) => ({
    ...item,
    score: byId[item.id] || 0,
  }))
}

function collectIdeaAlerts(idea) {
  if (!idea) return []
  const alerts = []
  const maturity = calcMaturity(idea)
  const readiness = calcReadiness(idea)
  const risk = calcRisk(idea)
  const overdueTasks = (idea.workspace?.tasks || []).filter((task) => {
    if (task.done || !task.dueAt) return false
    const due = new Date(task.dueAt).getTime()
    return !Number.isNaN(due) && due < Date.now()
  })

  if (maturity < 60) {
    alerts.push({
      id: 'maturity-low',
      tone: 'bad',
      text: `النضج منخفض (${maturity}%). يلزم رفع وضوح الفكرة والجدوى خلال هذا الأسبوع.`,
    })
  }

  if (risk >= 65) {
    alerts.push({
      id: 'risk-high',
      tone: 'bad',
      text: `المخاطر مرتفعة (${risk}%). فعّل خطة تخفيف قبل الانتقال للمرحلة التالية.`,
    })
  }

  if (readiness < 55) {
    alerts.push({
      id: 'readiness-low',
      tone: 'mid',
      text: `الجاهزية التشغيلية منخفضة (${readiness}%). أوصِ الفريق بخطة تحسين جاهزية مركزة.`,
    })
  }

  if (overdueTasks.length) {
    alerts.push({
      id: 'tasks-overdue',
      tone: 'mid',
      text: `يوجد ${overdueTasks.length} مهمة متأخرة تتطلب تذكيرًا فوريًا.`,
    })
  }

  if (!idea.governance?.gateApproved) {
    alerts.push({
      id: 'governance-incomplete',
      tone: 'mid',
      text: 'الحوكمة غير مكتملة. لا يمكن الاعتماد النهائي قبل استيفاء متطلبات الملكية والامتثال.',
    })
  }

  return alerts
}

function buildActionPlan(idea) {
  if (!idea) return []
  const plan = []
  const maturity = calcMaturity(idea)
  const risk = calcRisk(idea)
  const quality = calcPrototypeQuality(idea)
  const workflowType = resolveWorkflowType(idea.domain)

  if (maturity < 60) {
    plan.push('تنفيذ جلسة صياغة مشكلة مع أصحاب المصلحة وتحديث القيمة المتوقعة في نفس اليوم.')
  }
  if (quality < 65) {
    plan.push('رفع جودة النموذج الأولي عبر استكمال الفرضية، خطة الاختبار، ومؤشر التحقق الأساسي.')
  }
  if (risk >= 65) {
    plan.push('إعداد مصفوفة مخاطر مصغرة وتحديد مالك لكل خطر خلال 48 ساعة.')
  }
  if (!idea.governance?.ipProtection || !idea.governance?.ownershipDefined) {
    plan.push('استكمال نموذج الملكية الفكرية وتحديد الجهة المالكة قبل رفع الاعتماد.')
  }
  if (workflowType === 'technical') {
    plan.push('جدولة مراجعة معمارية وأمن معلومات قبل الانتقال للاختبار الميداني.')
  }
  if (workflowType === 'clinical') {
    plan.push('تأكيد موافقة أخلاقية وسلامة سريرية قبل الاختبار على نطاق أوسع.')
  }

  if (!plan.length) {
    plan.push('الحالة مستقرة. ركّز على تسريع الاعتماد وبدء خطة التوسع المؤسسي.')
  }
  return plan
}

function buildAssistantAdvice(idea) {
  if (!idea) return []
  const base = [
    `المرحلة الحالية: ${idea.stage}`,
    `المطلوب الآن: ${getStageGateRequirement(idea.domain, idea.stage) || 'لا يوجد Gate إلزامي'}`,
  ]

  if (idea.stage === 'التقاط الفكرة') {
    base.push('اختصر المشكلة في جملة تنفيذية واحدة ثم اربطها بمؤشر قابل للقياس.')
  }
  if (idea.stage === 'الفرز المؤسسي') {
    base.push('جهّز Canvas مختصر + Business Case أولي لقرار الفرز.')
  }
  if (idea.stage === 'بناء النموذج الأولي') {
    base.push('ارفع أصول Figma/Miro أو ملف تدفقي وفعّل Auto-Scoring للنموذج.')
  }
  if (idea.stage === 'الاختبار الميداني') {
    base.push('نفّذ اختبارًا محدودًا أسبوعيًا مع تقرير تقدم قابل للطباعة.')
  }
  if (idea.stage === 'الاعتماد' || idea.stage === 'التوسع والتطبيق') {
    base.push('جهّز تقريرًا تنفيذيًا مختصرًا للقيادة مع توصية قرار واضحة.')
  }
  return base
}

function buildIdeaExecutiveReport(idea, modelLabel, result, stageKpis, alerts) {
  if (!idea) return ''
  const lines = [
    `تقرير تنفيذي - ${idea.title}`,
    `المعرف: ${idea.id}`,
    `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`,
    `المرحلة: ${idea.stage} | الحالة: ${idea.status}`,
    `النضج: ${calcMaturity(idea)}% | الجاهزية: ${calcReadiness(idea)}% | المخاطر: ${calcRisk(idea)}%`,
    '',
    `نموذج الأثر: ${modelLabel}`,
    `الوفر السنوي المقدر: ${formatNumber(idea.impact?.costSaving || 0)} ريال`,
    `خفض الزمن المتوقع: ${idea.impact?.timeSaving || 0}%`,
    `تحسين الجودة: ${idea.impact?.qualityImprovement || 0}%`,
    `تحسين رضا المستفيد: ${idea.impact?.satisfaction || 0}%`,
  ]

  if (result) {
    lines.push(`ساعات موفرة سنويًا: ${formatNumber(result.annualHoursSaved || 0)} ساعة`)
  }

  lines.push('', 'مؤشرات النضج المرحلية:')
  stageKpis.forEach((kpi) => {
    lines.push(`- ${kpi.title}: ${kpi.score}%`)
  })

  lines.push('', 'تنبيهات ذكية:')
  if (alerts.length) {
    alerts.forEach((alert) => lines.push(`- ${alert.text}`))
  } else {
    lines.push('- لا توجد تنبيهات حرجة حاليًا.')
  }

  lines.push('', 'توصية تنفيذية: متابعة خطة العمل الأسبوعية ورفع تقرير الاعتماد المرحلي.')
  return lines.join('\n')
}

function buildWeeklyExecutiveReport(ideas, metrics) {
  const troubled = ideas.filter((idea) => {
    const hasAlert = collectIdeaAlerts(idea).length > 0
    return hasAlert || calcReadiness(idea) < 55 || calcRisk(idea) > 65
  })

  const recommendations = troubled.slice(0, 5).map((idea) => {
    return `- ${idea.title}: ${buildActionPlan(idea)[0]}`
  })

  const lines = [
    `تقرير أسبوعي - منصة درع الابتكار`,
    `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`,
    '',
    `عدد الأفكار: ${metrics.total}`,
    `نسبة النضج المتوسطة: ${metrics.avgMaturity}%`,
    `نسبة الجاهزية المتوسطة: ${metrics.avgReadiness}%`,
    `الأفكار المتعثرة: ${troubled.length}`,
    '',
    'أهم التوصيات للقيادة:',
    ...(recommendations.length ? recommendations : ['- لا توجد حالات حرجة.']),
  ]

  return lines.join('\n')
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function normalizeIdea(input) {
  const now = new Date().toISOString()
  const idea = cloneInitiative(input || {})
  const workflowType = resolveWorkflowType(idea.domain)
  const stageGateMap =
    STAGE_GATE_REQUIREMENTS_BY_TYPE[workflowType] || STAGE_GATE_REQUIREMENTS_BY_TYPE.operational

  const governance = {
    ipProtection: false,
    confidentiality: false,
    ethicsReview: false,
    dataPolicy: false,
    ownershipDefined: false,
    ipReadiness: 45,
    protectionNeeded: false,
    protectionRequestedAt: null,
    ...(idea.governance || {}),
  }

  governance.ipReadiness = clamp(governance.ipReadiness, 0, 100)
  governance.protectionNeeded = Boolean(governance.protectionNeeded)
  const gateApproved = REQUIRED_GOVERNANCE_FIELDS.every((field) => Boolean(governance[field]))

  const defaultApprovals = createDefaultApprovals()
  const approvals = Object.keys(defaultApprovals).reduce((acc, gateId) => {
    acc[gateId] = {
      ...createDefaultApprovalGate(),
      ...(idea.approvals?.[gateId] || {}),
    }
    return acc
  }, {})

  const ideaStageIndex = LIFECYCLE_STAGES.indexOf(idea.stage)
  const autoGateOrder = []
  const seenGateIds = new Set()
  LIFECYCLE_STAGES.forEach((stage) => {
    const gateId = stageGateMap[stage]
    if (!gateId || seenGateIds.has(gateId)) return
    seenGateIds.add(gateId)
    autoGateOrder.push({ gateId, stage })
  })

  autoGateOrder.forEach((item) => {
    const threshold = LIFECYCLE_STAGES.indexOf(item.stage)
    if (ideaStageIndex >= threshold) {
      const gate = approvals[item.gateId]
      if (gate.status === 'not_requested' || gate.status === 'pending') {
        approvals[item.gateId] = {
          ...gate,
          status: 'approved',
          requested: false,
          decidedBy: gate.decidedBy || 'system',
          decidedAt: gate.decidedAt || idea.updatedAt || now,
          note: gate.note || 'اعتماد تلقائي بسبب تقدم الفكرة في دورة الحياة.',
        }
      }
    }
  })

  const evidence = Array.isArray(idea.evidence) ? idea.evidence : []
  const tasks = Array.isArray(idea.workspace?.tasks)
    ? idea.workspace.tasks.map((task, index) => ({
        id: task.id || `TSK-${index + 1}`,
        text: task.text || 'مهمة بدون وصف',
        done: Boolean(task.done),
        dueAt: task.dueAt || addDays(idea.updatedAt || now, 7 + index),
      }))
    : []

  const notes = Array.isArray(idea.workspace?.notes) ? idea.workspace.notes : []
  const prototypeAssets = Array.isArray(idea.prototype?.assets)
    ? idea.prototype.assets.map((asset, index) => ({
        id: asset.id || `AST-${index + 1}`,
        name: asset.name || 'asset',
        size: Number(asset.size || 0),
        source: asset.source || 'upload',
        uploadedAt: asset.uploadedAt || now,
      }))
    : []

  const timeline = Array.isArray(idea.timeline)
    ? idea.timeline.map((event, index) => ({
        id: event.id || `EVT-${index + 1}`,
        at: event.at || now,
        title: event.title || 'حدث',
        detail: event.detail || '',
      }))
    : []

  if (!timeline.length) {
    timeline.push({
      id: 'EVT-INIT',
      at: idea.createdAt || now,
      title: 'إنشاء الفكرة',
      detail: 'تم تسجيل الفكرة داخل منصة درع الابتكار.',
    })
  }

  return {
    id: idea.id || newId('INN'),
    title: idea.title || 'فكرة جديدة',
    owner: idea.owner || 'فريق الابتكار',
    department: idea.department || 'التجمع الصحي بالطائف',
    domain: idea.domain || 'تشغيلي',
    problem: idea.problem || '',
    solution: idea.solution || '',
    beneficiary: idea.beneficiary || '',
    stage: LIFECYCLE_STAGES.includes(idea.stage) ? idea.stage : LIFECYCLE_STAGES[0],
    status: STATUS_OPTIONS.includes(idea.status) ? idea.status : STATUS_OPTIONS[0],
    maturity: {
      clarity: 55,
      feasibility: 50,
      value: 60,
      readiness: 40,
      riskHandling: 45,
      ...(idea.maturity || {}),
    },
    prototype: {
      template: resolveTemplateId(idea.prototype?.template),
      progress: clamp(idea.prototype?.progress ?? 0, 0, 100),
      hypothesis: idea.prototype?.hypothesis || '',
      testPlan: idea.prototype?.testPlan || '',
      validationMetric: idea.prototype?.validationMetric || '',
      lastDeck: idea.prototype?.lastDeck || '',
      assets: prototypeAssets,
    },
    impact: {
      costSaving: Number(idea.impact?.costSaving || 0),
      timeSaving: clamp(idea.impact?.timeSaving || 0, 0, 100),
      qualityImprovement: clamp(idea.impact?.qualityImprovement || 0, 0, 100),
      satisfaction: clamp(idea.impact?.satisfaction || 0, 0, 100),
    },
    simulationInputs: {
      ...DEFAULT_SIMULATION_INPUTS,
      ...(idea.simulationInputs || {}),
      model: IMPACT_MODELS.some((item) => item.id === idea.simulationInputs?.model)
        ? idea.simulationInputs.model
        : DEFAULT_SIMULATION_INPUTS.model,
    },
    workspace: {
      tasks,
      notes,
    },
    governance: {
      ...governance,
      gateApproved,
    },
    monitoring: {
      ...DEFAULT_MONITORING,
      ...(idea.monitoring || {}),
    },
    benchmark: {
      lastRun: idea.benchmark?.lastRun || null,
      topMatches: Array.isArray(idea.benchmark?.topMatches) ? idea.benchmark.topMatches : [],
    },
    approvals,
    workflowType,
    evidence,
    timeline,
    createdAt: idea.createdAt || now,
    updatedAt: idea.updatedAt || idea.createdAt || now,
  }
}

function normalizeState(input) {
  const seed = cloneInitiative(DEFAULT_STATE)
  const raw = cloneInitiative(input || {})

  const ideas =
    Array.isArray(raw.ideas) && raw.ideas.length
      ? raw.ideas.map(normalizeIdea)
      : seed.ideas.map(normalizeIdea)

  return {
    meta: {
      ...seed.meta,
      ...(raw.meta || {}),
      lastUpdated: raw.meta?.lastUpdated || new Date().toISOString(),
    },
    engagement: {
      ...seed.engagement,
      ...(raw.engagement || {}),
    },
    session: {
      ...DEFAULT_SESSION,
      ...(raw.session || {}),
    },
    auditLog: Array.isArray(raw.auditLog) ? raw.auditLog : [],
    ideas,
  }
}

function loadState() {
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  if (!fromStorage) return normalizeState(DEFAULT_STATE)
  const parsed = safeParse(fromStorage, normalizeState(DEFAULT_STATE))
  return normalizeState(parsed)
}

function stageTone(stage) {
  if (stage === 'التوسع والتطبيق' || stage === 'الاعتماد') return 'good'
  if (stage === 'بناء النموذج الأولي' || stage === 'الاختبار الميداني') return 'mid'
  return 'neutral'
}

function scoreTone(score) {
  if (score >= 80) return 'good'
  if (score >= 40) return 'mid'
  return 'bad'
}

function canMoveToStage(idea, nextStage) {
  const currentIndex = LIFECYCLE_STAGES.indexOf(idea.stage)
  const nextIndex = LIFECYCLE_STAGES.indexOf(nextStage)
  const requiredGate = getStageGateRequirement(idea.domain, nextStage)

  if (nextIndex === -1) {
    return { ok: false, message: 'مرحلة غير معروفة.' }
  }

  if (nextIndex <= currentIndex) {
    return { ok: true }
  }

  if (requiredGate) {
    const gate = idea.approvals?.[requiredGate]
    if (!gate || gate.status !== 'approved') {
      return { ok: false, message: 'يلزم اعتماد البوابة المرحلية قبل الانتقال.' }
    }
  }

  if (nextStage === 'الفرز المؤسسي') {
    const hasBasics = idea.problem && idea.solution && idea.beneficiary
    if (!hasBasics) {
      return { ok: false, message: 'الفرز المؤسسي يتطلب تعريف المشكلة والحل والمستفيد بوضوح.' }
    }
    return { ok: true }
  }

  if (nextStage === 'بناء النموذج الأولي') {
    if (calcMaturity(idea) < 60) {
      return { ok: false, message: 'الانتقال للنموذج الأولي يتطلب نضجًا لا يقل عن 60%.' }
    }
    return { ok: true }
  }

  if (nextStage === 'الاختبار الميداني') {
    if (idea.prototype.progress < 40 || !idea.prototype.hypothesis || !idea.prototype.testPlan) {
      return { ok: false, message: 'أكمل فرضية وتجربة النموذج الأولي وارفع التقدم إلى 40% على الأقل.' }
    }
    return { ok: true }
  }

  if (nextStage === 'الاعتماد') {
    if (!idea.governance.gateApproved) {
      return { ok: false, message: 'لا يمكن الوصول للاعتماد قبل استكمال متطلبات الحوكمة والملكية الفكرية.' }
    }
    if (Number(idea.impact.costSaving || 0) <= 0) {
      return { ok: false, message: 'شغّل محاكاة الأثر أولاً قبل طلب الاعتماد.' }
    }
    return { ok: true }
  }

  if (nextStage === 'التوسع والتطبيق') {
    if (idea.status !== 'معتمد' && !idea.governance.gateApproved) {
      return { ok: false, message: 'التوسع يتطلب حالة معتمد أو بوابة حوكمة مكتملة.' }
    }
    return { ok: true }
  }

  return { ok: true }
}

function App() {
  const [state, setState] = useState(loadState)
  const [activeView, setActiveView] = useState('overview')
  const [selectedId, setSelectedId] = useState(state.ideas[0]?.id || null)
  const [ideaSearch, setIdeaSearch] = useState('')
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN_FORM)
  const [intakeForm, setIntakeForm] = useState(DEFAULT_INTAKE_FORM)
  const [taskInput, setTaskInput] = useState('')
  const [noteAuthor, setNoteAuthor] = useState('صاحب الفكرة')
  const [noteInput, setNoteInput] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [evidenceType, setEvidenceType] = useState('ملف اختبار')
  const [evidenceNote, setEvidenceNote] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingIndex, setOnboardingIndex] = useState(0)
  const [flashMessage, setFlashMessage] = useState('')
  const [impactResult, setImpactResult] = useState(null)

  const session = state.session || DEFAULT_SESSION
  const permissions = ROLE_PERMISSIONS[session.role] || ROLE_PERMISSIONS[ROLE_OPTIONS[0]]

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!flashMessage) return undefined
    const timer = window.setTimeout(() => setFlashMessage(''), 5000)
    return () => window.clearTimeout(timer)
  }, [flashMessage])

  const visibleIdeas = useMemo(() => {
    const query = ideaSearch.trim().toLowerCase()
    if (!query) return state.ideas
    return state.ideas.filter((idea) => {
      const bag = [
        idea.id,
        idea.title,
        idea.owner,
        idea.domain,
        idea.stage,
        idea.status,
        idea.problem,
        idea.solution,
      ]
        .join(' ')
        .toLowerCase()
      return bag.includes(query)
    })
  }, [state.ideas, ideaSearch])

  const selectedIdea = useMemo(
    () => state.ideas.find((item) => item.id === selectedId) || visibleIdeas[0] || state.ideas[0] || null,
    [state.ideas, selectedId, visibleIdeas],
  )

  const lifecycleGroups = useMemo(() => {
    return LIFECYCLE_STAGES.reduce((acc, stage) => {
      acc[stage] = visibleIdeas.filter((item) => item.stage === stage)
      return acc
    }, {})
  }, [visibleIdeas])

  const stageKpis = useMemo(
    () => (selectedIdea ? calcStageMaturityKpis(selectedIdea) : []),
    [selectedIdea],
  )

  const smartAlerts = useMemo(
    () => (selectedIdea ? collectIdeaAlerts(selectedIdea) : []),
    [selectedIdea],
  )

  const autoActionPlan = useMemo(
    () => (selectedIdea ? buildActionPlan(selectedIdea) : []),
    [selectedIdea],
  )

  const assistantAdvice = useMemo(
    () => (selectedIdea ? buildAssistantAdvice(selectedIdea) : []),
    [selectedIdea],
  )

  const weeklyTasks = useMemo(() => {
    if (!selectedIdea) return []
    const now = new Date(state.meta.lastUpdated || selectedIdea.updatedAt || 0).getTime()
    if (Number.isNaN(now)) return []
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    return (selectedIdea.workspace?.tasks || []).filter((task) => {
      if (task.done || !task.dueAt) return false
      const dueAt = new Date(task.dueAt).getTime()
      return !Number.isNaN(dueAt) && dueAt >= now && dueAt <= now + oneWeek
    })
  }, [selectedIdea, state.meta.lastUpdated])

  const metrics = useMemo(() => {
    const total = state.ideas.length
    const avgMaturity =
      total > 0
        ? Math.round(state.ideas.reduce((sum, item) => sum + calcMaturity(item), 0) / total)
        : 0

    const avgReadiness =
      total > 0
        ? Math.round(state.ideas.reduce((sum, item) => sum + calcReadiness(item), 0) / total)
        : 0

    const activePrototypes = state.ideas.filter((item) => item.prototype.progress > 0).length
    const approved = state.ideas.filter((item) => item.status === 'معتمد' || item.status === 'مطبق').length
    const implemented = state.ideas.filter((item) => item.stage === 'التوسع والتطبيق' || item.status === 'مطبق').length

    const annualSaving = state.ideas.reduce(
      (sum, item) => sum + Math.max(0, Number(item.impact.costSaving || 0)),
      0,
    )

    const governanceReady = state.ideas.filter((item) => item.governance.gateApproved).length

    const allGateStates = state.ideas.flatMap((idea) =>
      ALL_APPROVAL_GATES.map((gate) => idea.approvals?.[gate.id]?.status || 'not_requested'),
    )
    const pendingApprovals = allGateStates.filter((status) => status === 'pending').length
    const approvedGates = allGateStates.filter((status) => status === 'approved').length
    const rejectedGates = allGateStates.filter((status) => status === 'rejected').length

    const cycleDays = state.ideas
      .map((idea) => {
        const created = new Date(idea.createdAt).getTime()
        const updated = new Date(idea.updatedAt).getTime()
        if (Number.isNaN(created) || Number.isNaN(updated) || updated < created) return 0
        return Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)))
      })
      .filter((value) => value > 0)

    const averageCycleDays =
      cycleDays.length > 0
        ? Math.round(cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length)
        : 0

    return {
      total,
      avgMaturity,
      avgReadiness,
      activePrototypes,
      approved,
      implemented,
      annualSaving,
      governanceReady,
      pendingApprovals,
      approvedGates,
      rejectedGates,
      averageCycleDays,
    }
  }, [state.ideas])

  const annualImpactProjection = useMemo(() => {
    const monthlyBase = Math.round((metrics.annualSaving || 0) / 12)
    return YEAR_MONTHS.map((month, index) => {
      const factor = 0.82 + (index % 4) * 0.06
      return {
        month,
        value: Math.max(0, Math.round(monthlyBase * factor)),
      }
    })
  }, [metrics.annualSaving])

  const buildAuditEntry = (action, target, detail) => ({
    id: newId('AUD'),
    at: new Date().toISOString(),
    actor: session.name || 'system',
    role: session.role || 'مبتكر',
    action,
    target,
    detail,
  })

  const updateIdea = (ideaId, updater, audit = null) => {
    setState((prev) => {
      const updatedIdeas = prev.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea
        const draft = normalizeIdea(idea)
        const updated = updater(draft) || draft
        if (audit) {
          const event = {
            id: newId('EVT'),
            at: new Date().toISOString(),
            title: audit.action,
            detail: audit.detail || '',
          }
          updated.timeline = [event, ...(updated.timeline || [])].slice(0, 80)
        }
        return normalizeIdea({
          ...updated,
          updatedAt: new Date().toISOString(),
        })
      })

      return {
        ...prev,
        ideas: updatedIdeas,
        auditLog: audit
          ? [buildAuditEntry(audit.action, audit.target || ideaId, audit.detail), ...prev.auditLog].slice(0, 300)
          : prev.auditLog,
        meta: {
          ...prev.meta,
          lastUpdated: new Date().toISOString(),
        },
      }
    })
  }

  const handleLogin = () => {
    if (!loginForm.name.trim()) {
      setFlashMessage('اكتب الاسم قبل تسجيل الدخول.')
      return
    }

    const now = new Date().toISOString()
    setState((prev) => ({
      ...prev,
      session: {
        isAuthenticated: true,
        name: loginForm.name.trim(),
        role: loginForm.role,
        lastLoginAt: now,
      },
      auditLog: [
        {
          id: newId('AUD'),
          at: now,
          actor: loginForm.name.trim(),
          role: loginForm.role,
          action: 'login',
          target: 'session',
          detail: 'تسجيل دخول إلى المنصة',
        },
        ...prev.auditLog,
      ].slice(0, 300),
      meta: {
        ...prev.meta,
        lastUpdated: now,
      },
    }))

    const seen = localStorage.getItem(ONBOARDING_SEEN_KEY)
    if (!seen) {
      setShowOnboarding(true)
      setOnboardingIndex(0)
    }

    setFlashMessage(`تم تسجيل الدخول كـ ${loginForm.role}.`)
  }

  const handleLogout = () => {
    const now = new Date().toISOString()
    setState((prev) => ({
      ...prev,
      session: {
        ...DEFAULT_SESSION,
      },
      auditLog: [
        {
          id: newId('AUD'),
          at: now,
          actor: session.name || 'unknown',
          role: session.role || 'مبتكر',
          action: 'logout',
          target: 'session',
          detail: 'تسجيل خروج من المنصة',
        },
        ...prev.auditLog,
      ].slice(0, 300),
      meta: {
        ...prev.meta,
        lastUpdated: now,
      },
    }))
    setShowOnboarding(false)
    setOnboardingIndex(0)
  }

  const createIdeaFromForm = () => {
    if (!permissions.canCreate) {
      setFlashMessage('صلاحياتك الحالية لا تسمح بإنشاء أفكار جديدة.')
      return
    }

    if (!intakeForm.title.trim()) {
      setFlashMessage('اكتب عنوان الابتكار أولاً.')
      return
    }

    if (!intakeForm.problem.trim() || !intakeForm.solution.trim() || !intakeForm.beneficiary.trim()) {
      setFlashMessage('أكمل الحقول الأساسية: المشكلة، الحل، المستفيد.')
      return
    }

    const now = new Date().toISOString()
    const suggestedOwner = getAutoOwnerByDomain(intakeForm.domain)
    const newIdea = normalizeIdea({
      id: newId('INN'),
      title: intakeForm.title.trim(),
      owner: intakeForm.owner.trim() || session.name || suggestedOwner,
      department: intakeForm.department.trim() || 'التجمع الصحي بالطائف',
      domain: intakeForm.domain,
      problem: intakeForm.problem.trim(),
      solution: intakeForm.solution.trim(),
      beneficiary: intakeForm.beneficiary.trim(),
      stage: 'التقاط الفكرة',
      status: 'جديد',
      maturity: {
        clarity: 62,
        feasibility: 54,
        value: 66,
        readiness: 42,
        riskHandling: 48,
      },
      prototype: {
        template: resolveTemplateId(PROTOTYPE_TEMPLATES[0]?.id),
        progress: 10,
        hypothesis: '',
        testPlan: '',
        validationMetric: '',
        lastDeck: '',
        assets: [],
      },
      workspace: {
        tasks: [
          {
            id: newId('TSK'),
            text: 'تأكيد تعريف المشكلة مع أصحاب المصلحة',
            done: false,
            dueAt: addDays(now, 3),
          },
          {
            id: newId('TSK'),
            text: 'إعداد خطة فرز مؤسسي أولية',
            done: false,
            dueAt: addDays(now, 6),
          },
        ],
        notes: [],
      },
      createdAt: now,
      updatedAt: now,
    })

    setState((prev) => ({
      ...prev,
      ideas: [newIdea, ...prev.ideas],
      auditLog: [
        {
          id: newId('AUD'),
          at: now,
          actor: session.name || 'system',
          role: session.role || 'مبتكر',
          action: 'create_idea',
          target: newIdea.id,
          detail: `إنشاء فكرة جديدة بعنوان "${newIdea.title}"`,
        },
        ...prev.auditLog,
      ].slice(0, 300),
      engagement: {
        ...prev.engagement,
        contributors: prev.engagement.contributors + 1,
      },
      meta: {
        ...prev.meta,
        lastUpdated: now,
      },
    }))

    setSelectedId(newIdea.id)
    setIntakeForm(DEFAULT_INTAKE_FORM)
    setActiveView('lifecycle')
    setFlashMessage('تم تسجيل الفكرة بنموذج خطوة واحدة وربطها بدورة حياة الابتكار المؤسسية.')
  }

  const handleIdeaStageChange = (ideaId, nextStage) => {
    if (!permissions.canMoveStages) {
      setFlashMessage('صلاحياتك لا تسمح بتغيير المراحل.')
      return
    }

    const idea = state.ideas.find((item) => item.id === ideaId)
    if (!idea) return

    const gate = canMoveToStage(idea, nextStage)
    if (!gate.ok) {
      setFlashMessage(gate.message)
      return
    }

    updateIdea(ideaId, (draft) => {
      draft.stage = nextStage

      if (nextStage === 'الفرز المؤسسي' && draft.status === 'جديد') {
        draft.status = 'قيد العمل'
      }
      if (nextStage === 'الاختبار الميداني') {
        draft.status = 'قيد الاختبار'
      }
      if (nextStage === 'الاعتماد') {
        draft.status = 'قيد المراجعة'
      }
      if (nextStage === 'التوسع والتطبيق') {
        draft.status = 'مطبق'
      }

      return draft
    }, {
      action: 'change_stage',
      target: ideaId,
      detail: `تغيير المرحلة إلى "${nextStage}"`,
    })
  }

  const handleIdeaStatusChange = (ideaId, nextStatus) => {
    if (!permissions.canMoveStages) {
      setFlashMessage('صلاحياتك لا تسمح بتغيير الحالة.')
      return
    }

    updateIdea(ideaId, (draft) => {
      draft.status = nextStatus
      if (nextStatus === 'معتمد' && LIFECYCLE_STAGES.indexOf(draft.stage) < LIFECYCLE_STAGES.indexOf('الاعتماد')) {
        draft.stage = 'الاعتماد'
      }
      if (nextStatus === 'مطبق') {
        draft.stage = 'التوسع والتطبيق'
      }
      return draft
    }, {
      action: 'change_status',
      target: ideaId,
      detail: `تغيير الحالة إلى "${nextStatus}"`,
    })
  }

  const handleMaturityChange = (field, value) => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتعديل التقييم.')
      return
    }

    if (!selectedIdea) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.maturity[field] = clamp(value, 0, 100)
      return draft
    }, {
      action: 'update_maturity',
      target: selectedIdea.id,
      detail: `تحديث مؤشر ${field}`,
    })
  }

  const handleAddTask = () => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بإضافة مهام.')
      return
    }

    if (!selectedIdea || !taskInput.trim()) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.workspace.tasks.unshift({
        id: newId('TSK'),
        text: taskInput.trim(),
        done: false,
        dueAt: addDays(new Date().toISOString(), 7),
      })
      return draft
    }, {
      action: 'add_task',
      target: selectedIdea.id,
      detail: 'إضافة مهمة جديدة إلى مساحة العمل',
    })
    setTaskInput('')
  }

  const handleApplyActionPlan = () => {
    if (!selectedIdea || !permissions.canEdit) return
    const planned = autoActionPlan.slice(0, 5)
    if (!planned.length) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        const existing = new Set(draft.workspace.tasks.map((task) => task.text))
        const batch = planned
          .filter((line) => !existing.has(line))
          .map((line, index) => ({
            id: newId('TSK'),
            text: line,
            done: false,
            dueAt: addDays(new Date().toISOString(), 3 + index * 2),
          }))

        draft.workspace.tasks = [...batch, ...draft.workspace.tasks]
        return draft
      },
      {
        action: 'apply_action_plan',
        target: selectedIdea.id,
        detail: `توليد خطة عمل تلقائية بعدد ${planned.length} بند`,
      },
    )

    setFlashMessage('تم تحويل خطة العمل التلقائية إلى مهام أسبوعية للفريق.')
  }

  const handleToggleTask = (taskId) => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتحديث المهام.')
      return
    }

    if (!selectedIdea) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.workspace.tasks = draft.workspace.tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      )
      return draft
    }, {
      action: 'toggle_task',
      target: selectedIdea.id,
      detail: `تحديث حالة المهمة ${taskId}`,
    })
  }

  const handleAddNote = () => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بإضافة ملاحظات.')
      return
    }

    if (!selectedIdea || !noteInput.trim()) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.workspace.notes.unshift({
        id: newId('NTE'),
        author: noteAuthor.trim() || 'صاحب الفكرة',
        text: noteInput.trim(),
        at: new Date().toISOString(),
      })
      return draft
    }, {
      action: 'add_note',
      target: selectedIdea.id,
      detail: 'إضافة ملاحظة في سجل التعاون',
    })
    setNoteInput('')
  }

  const handlePrototypeFieldChange = (field, value) => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتعديل النموذج الأولي.')
      return
    }

    if (!selectedIdea) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.prototype[field] = value
      return draft
    }, {
      action: 'update_prototype',
      target: selectedIdea.id,
      detail: `تعديل حقل ${field} في Prototype`,
    })
  }

  const handlePrototypeAssetUpload = (files) => {
    if (!selectedIdea || !permissions.canEdit) return
    const list = Array.from(files || [])
    if (!list.length) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        const assets = list.map((file) => ({
          id: newId('AST'),
          name: file.name,
          size: Number(file.size || 0),
          source: file.type || 'file',
          uploadedAt: new Date().toISOString(),
        }))
        draft.prototype.assets = [...assets, ...(draft.prototype.assets || [])].slice(0, 30)
        return draft
      },
      {
        action: 'upload_prototype_asset',
        target: selectedIdea.id,
        detail: `رفع ${list.length} ملف تصميم للنموذج الأولي`,
      },
    )
    setFlashMessage(`تم رفع ${list.length} ملف Figma/Miro أو أصل تصميمي.`)
  }

  const handleRemovePrototypeAsset = (assetId) => {
    if (!selectedIdea || !permissions.canEdit) return
    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.prototype.assets = (draft.prototype.assets || []).filter((asset) => asset.id !== assetId)
        return draft
      },
      {
        action: 'remove_prototype_asset',
        target: selectedIdea.id,
        detail: `حذف أصل تصميم ${assetId}`,
      },
    )
  }

  const handlePrototypeGenerate = () => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتوليد النموذج.')
      return
    }

    if (!selectedIdea) return

    const template = PROTOTYPE_TEMPLATES.find((item) => item.id === selectedIdea.prototype.template)
    const pitch = buildPitchDeck(selectedIdea, template)

    updateIdea(selectedIdea.id, (draft) => {
      draft.prototype.lastDeck = pitch
      draft.prototype.progress = Math.min(100, Number(draft.prototype.progress || 0) + 12)
      if (LIFECYCLE_STAGES.indexOf(draft.stage) < LIFECYCLE_STAGES.indexOf('بناء النموذج الأولي')) {
        draft.stage = 'بناء النموذج الأولي'
      }
      draft.status = draft.status === 'جديد' ? 'قيد العمل' : draft.status
      return draft
    }, {
      action: 'generate_pitch',
      target: selectedIdea.id,
      detail: 'توليد Deck أولي',
    })

    setFlashMessage('تم توليد نموذج عرض أولي وربطه بسجل الابتكار.')
  }

  const handleSimulationInputChange = (field, value) => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتعديل مدخلات المحاكاة.')
      return
    }

    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.simulationInputs[field] = field === 'model' ? value : Number(value)
      return draft
    }, {
      action: 'update_simulation',
      target: selectedIdea.id,
      detail: `تعديل مدخل ${field} في المحاكاة`,
    })
  }

  const handleRunImpact = () => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتشغيل محاكاة الأثر.')
      return
    }

    if (!selectedIdea) return

    const result = simulateImpact(selectedIdea, selectedIdea.simulationInputs)
    const model = selectedIdea.simulationInputs?.model || IMPACT_MODELS[0].id
    setImpactResult(result)

    updateIdea(selectedIdea.id, (draft) => {
      if (model === 'patient') {
        draft.impact.costSaving = Math.round(result.annualSaving * 0.35)
        draft.impact.timeSaving = Math.round(result.expectedTimeReduction * 0.6)
        draft.impact.qualityImprovement = clamp(result.qualityLift + 8, 0, 100)
        draft.impact.satisfaction = clamp(result.satisfactionLift + 14, 0, 100)
      } else if (model === 'service') {
        draft.impact.costSaving = Math.round(result.annualSaving * 0.55)
        draft.impact.timeSaving = clamp(result.expectedTimeReduction + 12, 0, 100)
        draft.impact.qualityImprovement = clamp(result.qualityLift + 4, 0, 100)
        draft.impact.satisfaction = clamp(result.satisfactionLift + 6, 0, 100)
      } else {
        draft.impact.costSaving = result.annualSaving
        draft.impact.timeSaving = result.expectedTimeReduction
        draft.impact.qualityImprovement = result.qualityLift
        draft.impact.satisfaction = result.satisfactionLift
      }
      return draft
    }, {
      action: 'run_impact_simulation',
      target: selectedIdea.id,
      detail: `تشغيل محاكاة الأثر - ${model}`,
    })

    const modelLabel = IMPACT_MODELS.find((item) => item.id === model)?.label || 'عام'
    setFlashMessage(`تم تنفيذ محاكاة الأثر (${modelLabel}) وتحديث المؤشرات.`)
  }

  const handleRunBenchmark = () => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتشغيل المقارنة المرجعية.')
      return
    }

    if (!selectedIdea) return
    const matches = benchmarkInitiative(selectedIdea, BENCHMARK_CATALOG)

    updateIdea(selectedIdea.id, (draft) => {
      draft.benchmark.topMatches = matches
      draft.benchmark.lastRun = new Date().toISOString()
      return draft
    }, {
      action: 'run_benchmark',
      target: selectedIdea.id,
      detail: 'تشغيل مقارنة مرجعية عالمية',
    })

    setFlashMessage('تمت المقارنة مع الحلول العالمية المرجعية.')
  }

  const handleExportIdeaExecutiveReport = () => {
    if (!selectedIdea) return
    const modelLabel =
      IMPACT_MODELS.find((item) => item.id === selectedIdea.simulationInputs?.model)?.label || 'وفورات مالية'
    const report = buildIdeaExecutiveReport(selectedIdea, modelLabel, impactResult, stageKpis, smartAlerts)
    downloadTextFile(`executive-report-${selectedIdea.id}.txt`, report)
    setFlashMessage('تم تصدير التقرير التنفيذي للفكرة.')
  }

  const handleExportWeeklyExecutiveReport = () => {
    const report = buildWeeklyExecutiveReport(state.ideas, metrics)
    downloadTextFile(`weekly-report-${new Date().toISOString().slice(0, 10)}.txt`, report)
    setFlashMessage('تم تصدير التقرير التنفيذي الأسبوعي للقيادات.')
  }

  const handleGovernanceToggle = (field) => {
    if (!permissions.canGovernance) {
      setFlashMessage('تعديل الحوكمة متاح لدور الحوكمة أو مدير المنصة.')
      return
    }

    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.governance[field] = !draft.governance[field]
      draft.governance.gateApproved = REQUIRED_GOVERNANCE_FIELDS.every((item) =>
        Boolean(draft.governance[item]),
      )
      return draft
    }, {
      action: 'toggle_governance',
      target: selectedIdea.id,
      detail: `تحديث بند الحوكمة ${field}`,
    })
  }

  const handleIpReadinessChange = (value) => {
    if (!selectedIdea || !permissions.canGovernance) return
    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.governance.ipReadiness = clamp(value, 0, 100)
        draft.governance.protectionNeeded = clamp(value, 0, 100) < 70
        return draft
      },
      {
        action: 'update_ip_readiness',
        target: selectedIdea.id,
        detail: `تحديث جاهزية الملكية الفكرية إلى ${value}%`,
      },
    )
  }

  const handleRequestIpProtection = () => {
    if (!selectedIdea || !permissions.canGovernance) return
    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.governance.protectionNeeded = true
        draft.governance.protectionRequestedAt = new Date().toISOString()
        return draft
      },
      {
        action: 'request_ip_protection',
        target: selectedIdea.id,
        detail: 'رفع طلب حماية ملكية فكرية',
      },
    )
    setFlashMessage('تم إرسال إشعار طلب حماية الملكية الفكرية للفريق.')
  }

  const handleMonitoringChange = (field, value) => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بتعديل متابعة التطبيق.')
      return
    }

    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.monitoring[field] = Number(value)
      return draft
    }, {
      action: 'update_monitoring',
      target: selectedIdea.id,
      detail: `تحديث مؤشر متابعة ${field}`,
    })
  }

  const handleSaveMonitoring = () => {
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بحفظ المتابعة.')
      return
    }

    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.monitoring.lastReview = new Date().toISOString()
      return draft
    }, {
      action: 'save_monitoring_review',
      target: selectedIdea.id,
      detail: 'حفظ مراجعة متابعة ما بعد التطبيق',
    })

    setFlashMessage('تم حفظ متابعة ما بعد التطبيق.')
  }

  const handleRequestApproval = (gateId) => {
    if (!selectedIdea) return
    if (!permissions.canEdit && !permissions.canCreate) {
      setFlashMessage('صلاحياتك الحالية لا تسمح بطلب اعتماد مرحلي.')
      return
    }

    updateIdea(selectedIdea.id, (draft) => {
      const gate = draft.approvals[gateId]
      if (!gate) return draft
      gate.requested = true
      gate.requestedAt = new Date().toISOString()
      if (gate.status !== 'approved') {
        gate.status = 'pending'
      }
      return draft
    }, {
      action: 'request_approval',
      target: selectedIdea.id,
      detail: `طلب اعتماد البوابة ${gateId}`,
    })

    setFlashMessage('تم إرسال طلب الاعتماد المرحلي.')
  }

  const handleDecideApproval = (gateId, decision) => {
    if (!selectedIdea) return
    if (!permissions.canApprove) {
      setFlashMessage('اعتماد المراحل متاح لدور المراجع أو مدير المنصة.')
      return
    }

    updateIdea(selectedIdea.id, (draft) => {
      const gate = draft.approvals[gateId]
      if (!gate) return draft
      gate.status = decision
      gate.requested = false
      gate.decidedBy = session.name || 'reviewer'
      gate.decidedAt = new Date().toISOString()
      gate.note = approvalNote.trim()
      return draft
    }, {
      action: decision === 'approved' ? 'approve_gate' : 'reject_gate',
      target: selectedIdea.id,
      detail: `${decision === 'approved' ? 'اعتماد' : 'رفض'} البوابة ${gateId}`,
    })

    setApprovalNote('')
    setFlashMessage(decision === 'approved' ? 'تم اعتماد البوابة.' : 'تم رفض البوابة.')
  }

  const handleEvidenceUpload = (files) => {
    if (!selectedIdea) return
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بإرفاق أدلة.')
      return
    }

    const list = Array.from(files || [])
    if (!list.length) return

    updateIdea(selectedIdea.id, (draft) => {
      const batch = list.map((file) => ({
        id: newId('EVD'),
        name: file.name,
        type: evidenceType,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        note: evidenceNote.trim(),
        uploadedBy: session.name || 'user',
        uploadedAt: new Date().toISOString(),
      }))

      draft.evidence = [...batch, ...(draft.evidence || [])].slice(0, 100)
      return draft
    }, {
      action: 'upload_evidence',
      target: selectedIdea.id,
      detail: `إرفاق ${list.length} ملف/دليل`,
    })

    setEvidenceNote('')
    setFlashMessage(`تم إرفاق ${list.length} ملف بنجاح.`)
  }

  const handleRemoveEvidence = (evidenceId) => {
    if (!selectedIdea) return
    if (!permissions.canEdit) {
      setFlashMessage('صلاحياتك لا تسمح بحذف الأدلة.')
      return
    }

    updateIdea(selectedIdea.id, (draft) => {
      draft.evidence = (draft.evidence || []).filter((item) => item.id !== evidenceId)
      return draft
    }, {
      action: 'remove_evidence',
      target: selectedIdea.id,
      detail: `حذف دليل ${evidenceId}`,
    })
  }

  const approvalStatusTone = (status) => {
    if (status === 'approved') return 'good'
    if (status === 'pending') return 'mid'
    if (status === 'rejected') return 'bad'
    return 'neutral'
  }

  const startNewInnovation = () => {
    if (!session.isAuthenticated) {
      setFlashMessage('سجّل الدخول أولاً ثم ابدأ فكرة جديدة.')
      return
    }

    if (!permissions.canCreate) {
      setFlashMessage('دورك الحالي لا يملك صلاحية إنشاء فكرة جديدة.')
      return
    }

    setActiveView('lifecycle')
    setFlashMessage('المسار جاهز: ابدأ بإدخال المشكلة والحل والمستفيد.')
  }

  const navigateFromFooter = (target) => {
    if (target === 'about') {
      setActiveView('overview')
      return
    }

    if (target === 'policies') {
      setActiveView('governance')
      return
    }

    if (target === 'support') {
      setActiveView('knowledge')
      return
    }

    setActiveView('overview')
    setFlashMessage('قناة التواصل الداخلي: مكتب الابتكار المؤسسي - التجمع الصحي بالطائف.')
  }

  const closeOnboarding = () => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
    setShowOnboarding(false)
    setOnboardingIndex(0)
  }

  const nextOnboardingStep = () => {
    if (onboardingIndex >= ONBOARDING_STEPS.length - 1) {
      closeOnboarding()
      return
    }
    setOnboardingIndex((prev) => prev + 1)
  }

  const renderOverview = () => {
    const coreTools = [
      {
        id: 'tool-1',
        title: 'Prototype Builder',
        detail: 'حوّل الفكرة إلى نموذج أولي خلال أسابيع مع خطة اختبار واضحة.',
        action: () => setActiveView('prototype'),
      },
      {
        id: 'tool-2',
        title: 'Innovation Workspace',
        detail: 'مساحة تعاون للمهام والملاحظات ومتابعة التنفيذ بشكل حي.',
        action: () => setActiveView('workspace'),
      },
      {
        id: 'tool-3',
        title: 'Experiment & Decision Templates',
        detail: 'ابدأ بقوالب جاهزة مثل Experiment Card وDecision Matrix.',
        action: () => setActiveView('knowledge'),
      },
    ]

    const trustSignals = [
      'حوكمة مرحلية موثقة لكل قرار',
      'تتبع كامل في Audit Log',
      'سياسات ملكية فكرية ظاهرة داخل المنصة',
      'اعتماد قبل التطبيق لضبط المخاطر',
    ]

    return (
      <div className="view-stack">
        <section className="panel home-hero-panel" id="about">
          <p className="home-kicker">من؟ ماذا؟ لماذا الآن؟</p>
          <h2 className="home-title">
            منصة تمكّن موظفي التجمع الصحي من تحويل فكرة إلى نموذج أولي خلال 6 أسابيع.
          </h2>
          <p className="lead-text">
            المستفيدون هم فرق التشغيل والجودة وتجربة المريض. تبدأ الرحلة من إدخال فكرة قصيرة، ثم
            اختبارها ميدانيًا، ثم اعتمادها وتطبيقها داخل التجمع بأثر قابل للقياس.
          </p>

          <div className="hero-cta-row">
            <button className="btn primary cta-main" onClick={startNewInnovation}>
              ابدأ ابتكار جديد
            </button>
            <button className="btn" onClick={() => setActiveView('knowledge')}>
              افتح القوالب الجاهزة
            </button>
            <button className="btn ghost" onClick={() => setActiveView('workflow')}>
              راجع مسار الاعتماد
            </button>
          </div>

          <div className="journey-line">
            {LIFECYCLE_STAGES.map((stage, index) => (
              <div key={stage} className="journey-node">
                <span>{stage}</span>
                {index < LIFECYCLE_STAGES.length - 1 ? <small>←</small> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="panel" id="support">
          <div className="panel-head">
            <h3>كيف تعمل المنصة؟</h3>
            <span>قدم → اختبر → اطبق</span>
          </div>
          <div className="steps-grid">
            {QUICK_START_STEPS.map((step) => (
              <article key={step.id} className="step-card">
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
          <div className="progress-track">
            <span className="progress-node done">قدم الفكرة</span>
            <span className="progress-node active">اختبر النموذج</span>
            <span className="progress-node">طبق على نطاق أوسع</span>
          </div>
        </section>

        <section className="kpi-grid">
          <article>
            <p>إجمالي الأفكار</p>
            <strong>{metrics.total}</strong>
          </article>
          <article>
            <p>متوسط النضج</p>
            <strong>{metrics.avgMaturity}%</strong>
          </article>
          <article>
            <p>متوسط الجاهزية</p>
            <strong>{metrics.avgReadiness}%</strong>
          </article>
          <article>
            <p>نماذج أولية نشطة</p>
            <strong>{metrics.activePrototypes}</strong>
          </article>
          <article>
            <p>ابتكارات معتمدة</p>
            <strong>{metrics.approved}</strong>
          </article>
          <article>
            <p>تطبيق فعلي</p>
            <strong>{metrics.implemented}</strong>
          </article>
          <article>
            <p>حالة حوكمة مكتملة</p>
            <strong>{metrics.governanceReady}</strong>
          </article>
          <article>
            <p>الوفر السنوي المقدر</p>
            <strong>{formatNumber(metrics.annualSaving)} ريال</strong>
          </article>
          <article>
            <p>اعتمادات معلقة</p>
            <strong>{metrics.pendingApprovals}</strong>
          </article>
          <article>
            <p>بوابات معتمدة</p>
            <strong>{metrics.approvedGates}</strong>
          </article>
          <article>
            <p>بوابات مرفوضة</p>
            <strong>{metrics.rejectedGates}</strong>
          </article>
          <article>
            <p>متوسط دورة الفكرة</p>
            <strong>{metrics.averageCycleDays} يوم</strong>
          </article>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>تقارير تنفيذية جاهزة</h3>
            <span>Weekly Executive Pack</span>
          </div>
          <p className="lead-text">
            تقرير أسبوعي تلقائي للقيادات يتضمن: عدد الأفكار، نسبة النضج، نسبة الجاهزية، الأفكار
            المتعثرة، وتوصيات القرار.
          </p>
          <div className="inline-actions wrap">
            <button className="btn primary" onClick={handleExportWeeklyExecutiveReport}>
              تصدير التقرير الأسبوعي
            </button>
            <button className="btn" onClick={handleExportIdeaExecutiveReport} disabled={!selectedIdea}>
              تصدير تقرير الفكرة المحددة
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>أدوات المنصة الأساسية</h3>
            <span>ابدأ مباشرة</span>
          </div>
          <div className="pillars-grid">
            {coreTools.map((tool) => (
              <article key={tool.id} className="pillar-card">
                <strong>{tool.title}</strong>
                <p>{tool.detail}</p>
                <button className="btn" onClick={tool.action}>
                  فتح الآن
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>التحسينات الاستراتيجية V4</h3>
            <span>Roadmap</span>
          </div>
          <div className="knowledge-grid">
            {STRATEGIC_V4_TRACKS.map((track) => (
              <article key={track.id} className="knowledge-card">
                <strong>{track.title}</strong>
                <p>{track.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>لوحة الأثر السنوية للتجمع</h3>
            <span>Yearly Impact Board</span>
          </div>
          <div className="impact-year-grid">
            {annualImpactProjection.map((item) => (
              <article key={item.month}>
                <p>{item.month}</p>
                <strong>{formatNumber(item.value)} ريال</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>قصص نجاح ودراسات حالة</h3>
            <span>نماذج تطبيقية داخلية</span>
          </div>
          <div className="cases-grid">
            {SUCCESS_CASES.map((item) => (
              <article key={item.id} className="case-card">
                <strong>{item.title}</strong>
                <p>{item.result}</p>
                <small>{item.owner}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel trust-panel" id="policies">
          <div className="panel-head">
            <h3>عناصر الثقة والشراكات</h3>
            <span>Governance & Trust</span>
          </div>
          <div className="trust-grid">
            <article className="trust-box">
              <strong>شركاء داخليون</strong>
              <p>إدارة التشغيل | إدارة الجودة | مكتب التحول | إدارة تقنية المعلومات</p>
            </article>
            <article className="trust-box">
              <strong>سياسات حماية الملكية الفكرية</strong>
              <p>سياسات الحماية والسرية والاعتماد موثقة ومرئية داخل تبويب الحوكمة.</p>
            </article>
            <article className="trust-box">
              <strong>ضمانات الامتثال</strong>
              <p>Workflow مرحلي + Audit Log + موافقات رسمية قبل التوسع.</p>
            </article>
          </div>
          <ul className="policy-list">
            {trustSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </section>

        <section className="panel contact-panel" id="contact">
          <div className="panel-head">
            <h3>انضم الآن</h3>
            <span>تواصل مع مكتب الابتكار</span>
          </div>
          <p className="lead-text">
            لديك فكرة تحتاج دعمًا أو تقييمًا سريعًا؟ ابدأ مباشرة عبر زر "ابدأ ابتكار جديد" أو تواصل
            مع مكتب الابتكار المؤسسي داخل التجمع لجدولة جلسة تمكين.
          </p>
          <div className="hero-cta-row">
            <button className="btn primary cta-main" onClick={startNewInnovation}>
              ابدأ ابتكار جديد
            </button>
            <button className="btn" onClick={() => setActiveView('knowledge')}>
              افتح القوالب
            </button>
          </div>
        </section>
      </div>
    )
  }

  const renderOnboardingModal = () => {
    if (!showOnboarding) return null

    const step = ONBOARDING_STEPS[onboardingIndex]
    const isLast = onboardingIndex === ONBOARDING_STEPS.length - 1

    return (
      <section className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="جولة تعريفية">
        <article className="onboarding-modal">
          <p className="home-kicker">
            جولة تعريفية {onboardingIndex + 1} / {ONBOARDING_STEPS.length}
          </p>
          <h3>{step.title}</h3>
          <p>{step.detail}</p>
          <div className="onboarding-dots" aria-hidden="true">
            {ONBOARDING_STEPS.map((item, index) => (
              <span key={item.id} className={index === onboardingIndex ? 'active' : ''} />
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="btn ghost" onClick={closeOnboarding}>
              تخطي
            </button>
            <button
              className="btn primary"
              onClick={() => {
                nextOnboardingStep()
                if (isLast) {
                  setActiveView('lifecycle')
                  setFlashMessage('ابدأ الآن بإدخال أول فكرة ابتكارية.')
                }
              }}
            >
              {isLast ? 'ابدأ الآن' : 'التالي'}
            </button>
          </div>
        </article>
      </section>
    )
  }

  const renderLifecycle = () => {
    return (
      <section className="lifecycle-layout">
        <article className="panel intake-panel">
          <div className="panel-head">
            <h3>التقاط فكرة جديدة</h3>
            <span>Idea Intake - خطوة واحدة</span>
          </div>
          <p className="lead-text">نموذج مختصر من شاشة واحدة لتسريع تسجيل الفكرة خلال أقل من 5 دقائق.</p>

          <label className="field">
            <span>عنوان الابتكار</span>
            <input
              value={intakeForm.title}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="مثال: تحسين مسار مواعيد العيادات"
            />
          </label>

          <label className="field">
            <span>المالك</span>
            <input
              value={intakeForm.owner}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, owner: event.target.value }))
              }
              placeholder="اسم الفريق أو القائد"
            />
          </label>

          <label className="field">
            <span>المجال</span>
            <select
              value={intakeForm.domain}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, domain: event.target.value }))
              }
            >
              {DOMAIN_OPTIONS.map((domain) => (
                <option key={domain}>{domain}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>ما المشكلة؟</span>
            <textarea
              rows={3}
              value={intakeForm.problem}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, problem: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>ما الحل المختصر؟</span>
            <textarea
              rows={3}
              value={intakeForm.solution}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, solution: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>من المستفيد؟</span>
            <input
              value={intakeForm.beneficiary}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, beneficiary: event.target.value }))
              }
            />
          </label>

          <button className="btn primary" onClick={createIdeaFromForm}>
            تسجيل الفكرة في المنصة
          </button>
        </article>

        <article className="panel board-panel">
          <div className="panel-head">
            <h3>لوحة دورة الحياة المؤسسية</h3>
            <span>{visibleIdeas.length} فكرة مطابقة للبحث</span>
          </div>

          <div className="board">
            {LIFECYCLE_STAGES.map((stage) => (
              <section key={stage} className="stage-column">
                <div className="stage-head">
                  <strong>{stage}</strong>
                  <span>{lifecycleGroups[stage]?.length || 0}</span>
                </div>

                <div className="card-list">
                  {(lifecycleGroups[stage] || []).map((idea) => {
                    const readiness = calcReadiness(idea)
                    const maturity = calcMaturity(idea)
                    const risk = calcRisk(idea)
                    const progress = getProgressPercentByStage(idea.stage)

                    return (
                      <article key={idea.id} className="idea-card">
                        <div className="idea-head">
                          <strong>{idea.title}</strong>
                          <span className={`badge ${stageTone(idea.stage)}`}>{idea.status}</span>
                        </div>

                        <p>{idea.owner}</p>

                        <div className="idea-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                          <span style={{ width: `${progress}%` }} />
                        </div>

                        <div className="metric-row">
                          <span>Maturity {maturity}%</span>
                          <span>Risk {risk}%</span>
                          <span>Readiness {readiness}%</span>
                        </div>

                        <div className="metric-row">
                          <span className={`badge ${scoreTone(readiness)}`}>جاهزية {readiness}%</span>
                          <span className={`badge ${idea.governance.gateApproved ? 'good' : 'bad'}`}>
                            {idea.governance.gateApproved ? 'حوكمة مكتملة' : 'حوكمة ناقصة'}
                          </span>
                        </div>

                        <div className="card-actions two-cols">
                          <select
                            value={idea.stage}
                            onChange={(event) => handleIdeaStageChange(idea.id, event.target.value)}
                            disabled={!permissions.canMoveStages}
                          >
                            {LIFECYCLE_STAGES.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                          <select
                            value={idea.status}
                            onChange={(event) => handleIdeaStatusChange(idea.id, event.target.value)}
                            disabled={!permissions.canMoveStages}
                          >
                            {STATUS_OPTIONS.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          className="btn ghost"
                          onClick={() => {
                            setSelectedId(idea.id)
                            setActiveView('workspace')
                          }}
                        >
                          فتح السجل
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
    )
  }

  const renderWorkflow = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>اختر فكرة أولاً من دورة الحياة.</p>
        </section>
      )
    }

    const approvals = selectedIdea.approvals || createDefaultApprovals()
    const workflowGates = getApprovalFlow(selectedIdea.domain)
    const requiredGateForStage = getStageGateRequirement(selectedIdea.domain, selectedIdea.stage)

    return (
      <section className="workflow-layout">
        <article className="panel">
          <div className="panel-head">
            <h3>Workflow & Stage Gates</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <p className="lead-text">
            الانتقال بين مراحل دورة الحياة يعتمد على اعتماد البوابات المرحلية من المراجعين، مع توثيق
            القرار والتاريخ والمسؤول.
          </p>
          <div className="chip-row">
            <span className="chip">نوع الابتكار: {selectedIdea.domain}</span>
            <span className="chip">مسار الموافقات: {resolveWorkflowType(selectedIdea.domain)}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>البوابة</th>
                  <th>الحالة</th>
                  <th>طلب</th>
                  <th>قرار</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {workflowGates.map((gate) => {
                  const item = approvals[gate.id] || createDefaultApprovalGate()
                  const isRequiredNow = requiredGateForStage === gate.id
                  return (
                    <tr key={gate.id}>
                      <td>
                        <strong>{gate.title}</strong>
                        {isRequiredNow ? <small>مطلوبة للمرحلة الحالية</small> : null}
                      </td>
                      <td>
                        <span className={`badge ${approvalStatusTone(item.status)}`}>{item.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => handleRequestApproval(gate.id)}
                          disabled={item.status === 'approved' || (!permissions.canEdit && !permissions.canCreate)}
                        >
                          طلب اعتماد
                        </button>
                      </td>
                      <td>
                        <div className="inline-actions">
                          <button
                            className="btn primary"
                            onClick={() => handleDecideApproval(gate.id, 'approved')}
                            disabled={!permissions.canApprove}
                          >
                            اعتماد
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => handleDecideApproval(gate.id, 'rejected')}
                            disabled={!permissions.canApprove}
                          >
                            رفض
                          </button>
                        </div>
                      </td>
                      <td>
                        <small>
                          {item.decidedBy ? `${item.decidedBy} - ${formatDate(item.decidedAt)}` : '—'}
                        </small>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <label className="field">
            <span>ملاحظة قرار الاعتماد</span>
            <textarea
              rows={2}
              value={approvalNote}
              onChange={(event) => setApprovalNote(event.target.value)}
              placeholder="اكتب سبب الاعتماد أو الرفض..."
            />
          </label>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>التحكم المرحلي</h3>
            <span>Lifecycle Control</span>
          </div>

          <div className="summary-grid mini">
            <article>
              <p>المرحلة الحالية</p>
              <strong>{selectedIdea.stage}</strong>
            </article>
            <article>
              <p>الحالة التشغيلية</p>
              <strong>{selectedIdea.status}</strong>
            </article>
            <article>
              <p>البوابة المطلوبة</p>
              <strong>{requiredGateForStage || 'لا يوجد'}</strong>
            </article>
            <article>
              <p>عدد البوابات في المسار</p>
              <strong>{workflowGates.length}</strong>
            </article>
          </div>

          <p className="lead-text">
            يمكن للمراجع أو مدير المنصة فقط اعتماد البوابات. يستطيع المبتكر طلب الاعتماد وتحديث
            الأدلة.
          </p>
        </article>
      </section>
    )
  }

  const renderWorkspace = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>لا توجد فكرة محددة. ابدأ بإضافة فكرة جديدة من دورة الحياة.</p>
        </section>
      )
    }

    const tasks = selectedIdea.workspace.tasks || []
    const notes = selectedIdea.workspace.notes || []
    const doneTasks = tasks.filter((task) => task.done).length

    return (
      <section className="workspace-layout">
        <article className="panel">
          <div className="panel-head">
            <h3>{selectedIdea.title}</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <p>{selectedIdea.problem}</p>

          <div className="chip-row">
            <span className="chip">المرحلة: {selectedIdea.stage}</span>
            <span className="chip">المالك: {selectedIdea.owner}</span>
            <span className="chip">المجال: {selectedIdea.domain}</span>
            <span className="chip">الجاهزية: {calcReadiness(selectedIdea)}%</span>
          </div>

          <div className="summary-grid mini">
            <article>
              <p>تقدم المهام</p>
              <strong>
                {doneTasks}/{tasks.length || 0}
              </strong>
            </article>
            <article>
              <p>Maturity</p>
              <strong>{calcMaturity(selectedIdea)}%</strong>
            </article>
            <article>
              <p>Risk</p>
              <strong>{calcRisk(selectedIdea)}%</strong>
            </article>
            <article>
              <p>مهام الأسبوع</p>
              <strong>{weeklyTasks.length}</strong>
            </article>
          </div>

          <div className="stage-kpi-grid">
            {stageKpis.map((kpi) => (
              <article key={kpi.id} className="stage-kpi-card">
                <strong>{kpi.title}</strong>
                <p>{kpi.score}%</p>
                <small>{kpi.focus}</small>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>Idea Maturity Score</h3>
            <span>تقييم مستمر</span>
          </div>

          <div className="maturity-grid">
            <label className="field">
              <span>وضوح المشكلة ({selectedIdea.maturity.clarity}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedIdea.maturity.clarity}
                onChange={(event) => handleMaturityChange('clarity', event.target.value)}
              />
            </label>
            <label className="field">
              <span>قابلية التطبيق ({selectedIdea.maturity.feasibility}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedIdea.maturity.feasibility}
                onChange={(event) => handleMaturityChange('feasibility', event.target.value)}
              />
            </label>
            <label className="field">
              <span>القيمة المتوقعة ({selectedIdea.maturity.value}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedIdea.maturity.value}
                onChange={(event) => handleMaturityChange('value', event.target.value)}
              />
            </label>
            <label className="field">
              <span>الاستعداد التشغيلي ({selectedIdea.maturity.readiness}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedIdea.maturity.readiness}
                onChange={(event) => handleMaturityChange('readiness', event.target.value)}
              />
            </label>
            <label className="field">
              <span>إدارة المخاطر ({selectedIdea.maturity.riskHandling}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedIdea.maturity.riskHandling}
                onChange={(event) => handleMaturityChange('riskHandling', event.target.value)}
              />
            </label>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>المساعد الذكي للفريق</h3>
            <span>Next Best Action</span>
          </div>

          <ul className="policy-list compact-list">
            {assistantAdvice.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="inline-actions wrap">
            <button className="btn primary" onClick={handleApplyActionPlan} disabled={!permissions.canEdit}>
              توليد خطة عمل تلقائية
            </button>
            <button className="btn" onClick={handleExportIdeaExecutiveReport}>
              تصدير تقرير تنفيذي
            </button>
          </div>

          <div className="alert-stack">
            {smartAlerts.map((alert) => (
              <p key={alert.id} className={`alert-item ${alert.tone}`}>
                {alert.text}
              </p>
            ))}
            {!smartAlerts.length ? <p className="alert-item good">لا توجد تنبيهات حرجة حالياً.</p> : null}
          </div>

          <h4 className="subhead">المهام المطلوبة خلال الأسبوع</h4>
          <ul className="list">
            {weeklyTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.text}</strong>
                <small>موعد الاستحقاق: {formatDate(task.dueAt)}</small>
              </li>
            ))}
            {!weeklyTasks.length ? <li className="empty">لا توجد مهام أسبوعية معلقة.</li> : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>المهام التشاركية</h3>
            <span>{tasks.length}</span>
          </div>

          <div className="inline-input">
            <input
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder="مهمة جديدة..."
            />
            <button className="btn" onClick={handleAddTask}>
              إضافة
            </button>
          </div>

          <ul className="list">
            {tasks.map((task) => (
              <li key={task.id}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggleTask(task.id)}
                  />
                  <span className={task.done ? 'done' : ''}>{task.text}</span>
                </label>
                <small>الاستحقاق: {formatDate(task.dueAt)}</small>
              </li>
            ))}
            {!tasks.length ? <li className="empty">لا توجد مهام بعد.</li> : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>سجل التعاون</h3>
            <span>{notes.length}</span>
          </div>

          <div className="inline-input wrap">
            <input
              value={noteAuthor}
              onChange={(event) => setNoteAuthor(event.target.value)}
              placeholder="الكاتب"
            />
            <input
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              placeholder="ملاحظة جديدة..."
            />
            <button className="btn" onClick={handleAddNote}>
              نشر
            </button>
          </div>

          <ul className="list notes-list">
            {notes.map((note) => (
              <li key={note.id}>
                <strong>{note.author}</strong>
                <p>{note.text}</p>
                <small>{formatDate(note.at)}</small>
              </li>
            ))}
            {!notes.length ? <li className="empty">لا توجد ملاحظات بعد.</li> : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>أدلة ومستندات الفكرة</h3>
            <span>{(selectedIdea.evidence || []).length}</span>
          </div>

          <div className="inline-input wrap">
            <select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}>
              <option>ملف اختبار</option>
              <option>مؤشر أداء</option>
              <option>تقرير مالي</option>
              <option>موافقة تشغيلية</option>
              <option>مستند حوكمة</option>
            </select>
            <input
              value={evidenceNote}
              onChange={(event) => setEvidenceNote(event.target.value)}
              placeholder="وصف مختصر للدليل..."
            />
            <input
              type="file"
              multiple
              onChange={(event) => handleEvidenceUpload(event.target.files)}
            />
          </div>

          <ul className="list">
            {(selectedIdea.evidence || []).map((item) => (
              <li key={item.id}>
                <div className="rank-row">
                  <strong>{item.name}</strong>
                  <button className="btn ghost" onClick={() => handleRemoveEvidence(item.id)}>
                    حذف
                  </button>
                </div>
                <p>
                  النوع: {item.type} | الحجم: {formatNumber(item.size)} بايت
                </p>
                <small>
                  رفع بواسطة {item.uploadedBy} - {formatDate(item.uploadedAt)}
                </small>
              </li>
            ))}
            {!(selectedIdea.evidence || []).length ? (
              <li className="empty">لا توجد أدلة مرفوعة بعد.</li>
            ) : null}
          </ul>
        </article>
      </section>
    )
  }

  const renderPrototype = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>لا توجد فكرة محددة.</p>
        </section>
      )
    }

    const template = PROTOTYPE_TEMPLATES.find((item) => item.id === selectedIdea.prototype.template)
    const prototypeQuality = calcPrototypeQuality(selectedIdea)
    const prototypeAssets = selectedIdea.prototype.assets || []

    return (
      <section className="prototype-layout">
        <article className="panel">
          <div className="panel-head">
            <h3>Prototype Builder</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <label className="field">
            <span>قالب النموذج الأولي</span>
            <select
              value={selectedIdea.prototype.template}
              onChange={(event) => handlePrototypeFieldChange('template', event.target.value)}
            >
              {PROTOTYPE_TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.focus}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>الفرضية المراد اختبارها</span>
            <textarea
              rows={3}
              value={selectedIdea.prototype.hypothesis}
              onChange={(event) => handlePrototypeFieldChange('hypothesis', event.target.value)}
            />
          </label>

          <label className="field">
            <span>خطة الاختبار</span>
            <textarea
              rows={3}
              value={selectedIdea.prototype.testPlan}
              onChange={(event) => handlePrototypeFieldChange('testPlan', event.target.value)}
            />
          </label>

          <label className="field">
            <span>مؤشر التحقق الأساسي</span>
            <input
              value={selectedIdea.prototype.validationMetric}
              onChange={(event) => handlePrototypeFieldChange('validationMetric', event.target.value)}
              placeholder="مثال: زمن الخدمة / رضا المستفيد"
            />
          </label>

          <label className="field">
            <span>تقدم النموذج ({selectedIdea.prototype.progress}%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedIdea.prototype.progress}
              onChange={(event) => handlePrototypeFieldChange('progress', clamp(event.target.value, 0, 100))}
            />
          </label>

          <label className="field">
            <span>رفع ملفات Figma / Miro أو مرفقات التصميم</span>
            <input type="file" multiple onChange={(event) => handlePrototypeAssetUpload(event.target.files)} />
          </label>

          <ul className="list compact-list">
            {prototypeAssets.map((asset) => (
              <li key={asset.id}>
                <div className="rank-row">
                  <strong>{asset.name}</strong>
                  <button className="btn ghost" onClick={() => handleRemovePrototypeAsset(asset.id)}>
                    حذف
                  </button>
                </div>
                <small>
                  الحجم: {formatNumber(asset.size)} بايت | التاريخ: {formatDate(asset.uploadedAt)}
                </small>
              </li>
            ))}
            {!prototypeAssets.length ? <li className="empty">لم يتم رفع ملفات تصميم بعد.</li> : null}
          </ul>

          <div className="chip-row">
            <span className="chip">النضج: {calcMaturity(selectedIdea)}%</span>
            <span className="chip">الجاهزية: {calcReadiness(selectedIdea)}%</span>
            <span className="chip">القالب: {template?.name || '—'}</span>
            <span className={`chip score-${scoreTone(prototypeQuality)}`}>جودة النموذج: {prototypeQuality}%</span>
          </div>

          <div className="inline-actions">
            <button className="btn primary" onClick={handlePrototypeGenerate}>
              توليد Deck أولي
            </button>
            <button
              className="btn"
              onClick={() => handleIdeaStageChange(selectedIdea.id, 'الاختبار الميداني')}
            >
              إرسال للاختبار الميداني
            </button>
          </div>
        </article>

        <article className="panel output-panel">
          <div className="panel-head">
            <h3>مخرجات العرض الأولي</h3>
            <span>{template?.name || 'Template'}</span>
          </div>
          <textarea
            readOnly
            value={
              selectedIdea.prototype.lastDeck ||
              'اضغط "توليد Deck أولي" لإنشاء مخرجات النموذج القابلة للعرض.'
            }
          />
        </article>
      </section>
    )
  }

  const renderImpact = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>لا توجد فكرة محددة.</p>
        </section>
      )
    }

    const matches = selectedIdea.benchmark.topMatches || []
    const monitoringEnabled =
      selectedIdea.stage === 'التوسع والتطبيق' || selectedIdea.status === 'مطبق'

    const netCash = Number(selectedIdea.monitoring.cashIn || 0) - Number(selectedIdea.monitoring.cashOut || 0)
    const roi =
      Number(selectedIdea.monitoring.investment || 0) > 0
        ? Math.round((netCash / Number(selectedIdea.monitoring.investment)) * 100)
        : 0

    const tocScore = Math.round(
      (Number(selectedIdea.monitoring.tocInput || 0) +
        Number(selectedIdea.monitoring.tocOutput || 0) +
        Number(selectedIdea.monitoring.tocOutcome || 0)) /
        3,
    )

    return (
      <div className="view-stack">
        <section className="impact-layout">
          <article className="panel">
            <div className="panel-head">
              <h3>Impact Simulator</h3>
              <span>{selectedIdea.id}</span>
            </div>

            <div className="form-grid two">
              <label className="field">
                <span>نموذج المحاكاة</span>
                <select
                  value={selectedIdea.simulationInputs.model}
                  onChange={(event) => handleSimulationInputChange('model', event.target.value)}
                >
                  {IMPACT_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>تكلفة العملية (ريال)</span>
                <input
                  type="number"
                  value={selectedIdea.simulationInputs.baselineCost}
                  onChange={(event) => handleSimulationInputChange('baselineCost', event.target.value)}
                />
              </label>
              <label className="field">
                <span>زمن العملية (دقيقة)</span>
                <input
                  type="number"
                  value={selectedIdea.simulationInputs.baselineMinutes}
                  onChange={(event) => handleSimulationInputChange('baselineMinutes', event.target.value)}
                />
              </label>
              <label className="field">
                <span>عدد المعاملات السنوي</span>
                <input
                  type="number"
                  value={selectedIdea.simulationInputs.transactionsPerYear}
                  onChange={(event) =>
                    handleSimulationInputChange('transactionsPerYear', event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>خفض التكلفة المتوقع (%)</span>
                <input
                  type="number"
                  value={selectedIdea.simulationInputs.expectedCostReduction}
                  onChange={(event) =>
                    handleSimulationInputChange('expectedCostReduction', event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>خفض الزمن المتوقع (%)</span>
                <input
                  type="number"
                  value={selectedIdea.simulationInputs.expectedTimeReduction}
                  onChange={(event) =>
                    handleSimulationInputChange('expectedTimeReduction', event.target.value)
                  }
                />
              </label>
            </div>

            <div className="inline-actions wrap">
              <button className="btn primary" onClick={handleRunImpact}>
                تشغيل المحاكاة
              </button>
              <button className="btn" onClick={handleExportIdeaExecutiveReport}>
                تصدير التقرير التنفيذي
              </button>
            </div>

            {impactResult ? (
              <div className="impact-result">
                <p>
                  النموذج الحالي:{' '}
                  {IMPACT_MODELS.find((model) => model.id === selectedIdea.simulationInputs.model)?.label}
                </p>
                <p>الوفر المالي السنوي: {formatNumber(impactResult.annualSaving)} ريال</p>
                <p>الساعات الموفرة سنويًا: {formatNumber(impactResult.annualHoursSaved)} ساعة</p>
                <p>تحسين الجودة: {impactResult.qualityLift}%</p>
              </div>
            ) : null}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>مؤشرات الأثر الحالية</h3>
              <span>Live KPIs</span>
            </div>

            <div className="summary-grid mini">
              <article>
                <p>الوفر المالي</p>
                <strong>{formatNumber(selectedIdea.impact.costSaving)} ريال</strong>
              </article>
              <article>
                <p>خفض الزمن</p>
                <strong>{selectedIdea.impact.timeSaving}%</strong>
              </article>
              <article>
                <p>تحسين الجودة</p>
                <strong>{selectedIdea.impact.qualityImprovement}%</strong>
              </article>
              <article>
                <p>رضا المستفيد</p>
                <strong>{selectedIdea.impact.satisfaction}%</strong>
              </article>
            </div>

            <div className="inline-actions">
              <button className="btn" onClick={handleRunBenchmark}>
                مقارنة عالمية
              </button>
              <button
                className="btn ghost"
                onClick={() => handleIdeaStageChange(selectedIdea.id, 'الاعتماد')}
              >
                طلب اعتماد الفكرة
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الحل المرجعي</th>
                    <th>الدولة</th>
                    <th>التشابه</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td>{match.solution}</td>
                      <td>{match.country}</td>
                      <td>{match.score}%</td>
                    </tr>
                  ))}
                  {!matches.length ? (
                    <tr>
                      <td colSpan="3">لم يتم تشغيل المقارنة بعد.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Post-Implementation Monitoring</h3>
            <span>{monitoringEnabled ? 'Active' : 'يتفعل بعد التطبيق'}</span>
          </div>

          <div className="form-grid two">
            <label className="field">
              <span>Theory of Change - Input (%)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.tocInput}
                onChange={(event) => handleMonitoringChange('tocInput', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Theory of Change - Output (%)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.tocOutput}
                onChange={(event) => handleMonitoringChange('tocOutput', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Theory of Change - Outcome (%)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.tocOutcome}
                onChange={(event) => handleMonitoringChange('tocOutcome', event.target.value)}
              />
            </label>
            <label className="field">
              <span>التدفق النقدي الداخل</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.cashIn}
                onChange={(event) => handleMonitoringChange('cashIn', event.target.value)}
              />
            </label>
            <label className="field">
              <span>التدفق النقدي الخارج</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.cashOut}
                onChange={(event) => handleMonitoringChange('cashOut', event.target.value)}
              />
            </label>
            <label className="field">
              <span>الاستثمار الأساسي</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.investment}
                onChange={(event) => handleMonitoringChange('investment', event.target.value)}
              />
            </label>
            <label className="field">
              <span>فترة الاسترداد (شهر)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.paybackMonths}
                onChange={(event) => handleMonitoringChange('paybackMonths', event.target.value)}
              />
            </label>
          </div>

          <div className="summary-grid mini">
            <article>
              <p>TOC Score</p>
              <strong>{tocScore}%</strong>
            </article>
            <article>
              <p>Net Cash</p>
              <strong>{formatNumber(netCash)} ريال</strong>
            </article>
            <article>
              <p>ROI</p>
              <strong>{roi}%</strong>
            </article>
            <article>
              <p>Payback</p>
              <strong>{selectedIdea.monitoring.paybackMonths} شهر</strong>
            </article>
          </div>

          <button className="btn" disabled={!monitoringEnabled} onClick={handleSaveMonitoring}>
            حفظ مراجعة المتابعة
          </button>
        </section>
      </div>
    )
  }

  const renderKnowledge = () => {
    const extraResources = [
      {
        id: 'res-1',
        title: 'Canvas Template',
        detail: 'قالب Canvas جاهز لصياغة القيمة والمسار التنفيذي.',
      },
      {
        id: 'res-2',
        title: 'Business Case Template',
        detail: 'قالب حالة عمل مختصر للقيادة مع التكلفة والعائد والمخاطر.',
      },
      {
        id: 'res-3',
        title: 'Prototype Checklist',
        detail: 'قائمة تحقق قياسية قبل الانتقال إلى الاختبار أو الاعتماد.',
      },
    ]

    const stageLinkedMicro =
      MICRO_LEARNING.filter((item) => item.stage === selectedIdea?.stage) || []

    return (
      <div className="view-stack">
        <section className="panel">
          <div className="panel-head">
            <h3>مكتبة أدوات الابتكار</h3>
            <span>{METHOD_TOOLKIT.length} أداة</span>
          </div>
          <div className="knowledge-grid">
            {METHOD_TOOLKIT.map((tool) => (
              <article key={tool.id} className="knowledge-card">
                <strong>{tool.title}</strong>
                <p>{tool.purpose}</p>
                <small>
                  المرحلة: {tool.stage} | المصدر: {tool.source}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>موارد تمكين إضافية</h3>
            <span>Self-Learning</span>
          </div>
          <div className="knowledge-grid">
            {extraResources.map((resource) => (
              <article key={resource.id} className="knowledge-card">
                <strong>{resource.title}</strong>
                <p>{resource.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Micro-Learning</h3>
            <span>2-3 دقائق</span>
          </div>
          <div className="knowledge-grid">
            {(stageLinkedMicro.length ? stageLinkedMicro : MICRO_LEARNING).map((item) => (
              <article key={item.id} className="knowledge-card">
                <strong>{item.title}</strong>
                <p>{item.focus}</p>
                <small>
                  المرحلة المرتبطة: {item.stage} | المدة: {item.duration}
                </small>
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  const renderAudit = () => {
    const logs = (state.auditLog || []).slice(0, 120)

    return (
      <section className="panel">
        <div className="panel-head">
          <h3>Audit Log</h3>
          <span>{logs.length} سجل</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الوقت</th>
                <th>المستخدم</th>
                <th>الدور</th>
                <th>الإجراء</th>
                <th>الهدف</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.at)}</td>
                  <td>{log.actor}</td>
                  <td>{log.role}</td>
                  <td>{log.action}</td>
                  <td>{log.target}</td>
                  <td>{log.detail || '—'}</td>
                </tr>
              ))}
              {!logs.length ? (
                <tr>
                  <td colSpan="6">لا يوجد نشاط مسجل بعد.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const renderGovernance = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>اختر فكرة أولاً.</p>
        </section>
      )
    }

    const policies = [
      {
        field: 'ipProtection',
        title: 'تسجيل الملكية الفكرية',
        note: 'توثيق حقوق الفكرة ونطاق الاستخدام المؤسسي.',
      },
      {
        field: 'confidentiality',
        title: 'اتفاقيات السرية',
        note: 'حماية البيانات الحساسة للمستفيدين والجهات المشاركة.',
      },
      {
        field: 'ethicsReview',
        title: 'مراجعة أخلاقية',
        note: 'التأكد من ملاءمة التطبيق للمعايير الصحية والأخلاقية.',
      },
      {
        field: 'dataPolicy',
        title: 'توافق سياسات البيانات',
        note: 'الامتثال لسياسات أمن المعلومات وحوكمة البيانات.',
      },
      {
        field: 'ownershipDefined',
        title: 'وضوح الملكية والمسؤوليات',
        note: 'تحديد المالك التنفيذي ومسار القرار المرحلي.',
      },
    ]

    const completion = Math.round(
      (REQUIRED_GOVERNANCE_FIELDS.filter((field) => selectedIdea.governance[field]).length /
        REQUIRED_GOVERNANCE_FIELDS.length) *
        100,
    )

    return (
      <div className="view-stack">
        <section className="panel">
          <div className="panel-head">
            <h3>حوكمة الابتكار</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <p className="lead-text">
            لا تنتقل الفكرة إلى الاعتماد أو التطبيق قبل إكمال متطلبات الحوكمة وحماية الملكية
            الفكرية.
          </p>

          <div className="governance-grid">
            {policies.map((policy) => (
              <label key={policy.field} className="governance-item">
                <div className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIdea.governance[policy.field])}
                    onChange={() => handleGovernanceToggle(policy.field)}
                  />
                  <strong>{policy.title}</strong>
                </div>
                <p>{policy.note}</p>
              </label>
            ))}
          </div>

          <div className="summary-grid mini">
            <article>
              <p>نسبة اكتمال الحوكمة</p>
              <strong>{completion}%</strong>
            </article>
            <article>
              <p>بوابة الاعتماد</p>
              <strong>{selectedIdea.governance.gateApproved ? 'جاهزة' : 'غير جاهزة'}</strong>
            </article>
            <article>
              <p>آخر تحديث</p>
              <strong>{formatDate(selectedIdea.updatedAt)}</strong>
            </article>
            <article>
              <p>جاهزية الملكية الفكرية</p>
              <strong>{selectedIdea.governance.ipReadiness}%</strong>
            </article>
          </div>

          <label className="field">
            <span>تقييم الملكية الفكرية الموحد ({selectedIdea.governance.ipReadiness}%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedIdea.governance.ipReadiness}
              onChange={(event) => handleIpReadinessChange(event.target.value)}
            />
          </label>

          <div className="inline-actions wrap">
            <button className="btn primary" onClick={handleRequestIpProtection} disabled={!permissions.canGovernance}>
              رفع طلب حماية ملكية فكرية
            </button>
            <button className="btn" onClick={handleExportIdeaExecutiveReport}>
              تصدير تقرير المرحلة
            </button>
          </div>

          {selectedIdea.governance.protectionNeeded ? (
            <p className="alert-item bad">
              تنبيه: الفكرة تحتاج مسار حماية ملكية فكرية قبل الاعتماد الكامل.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>سياسات مؤسسية مرجعية</h3>
            <span>Policy Framework</span>
          </div>
          <ul className="policy-list">
            <li>سياسة حماية الملكية الفكرية للأفكار والنماذج داخل التجمع.</li>
            <li>سياسة تصنيف البيانات وسرية المعلومات في دورات الاختبار.</li>
            <li>سياسة الحوكمة المرحلية: فكرة → نموذج → اختبار → اعتماد → تطبيق.</li>
            <li>سياسة إدارة المخاطر والامتثال قبل التوسع والتشغيل المؤسسي.</li>
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Timeline الفكرة</h3>
            <span>{(selectedIdea.timeline || []).length} حدث</span>
          </div>
          <ul className="list">
            {(selectedIdea.timeline || []).map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong>
                <p>{event.detail || '—'}</p>
                <small>{formatDate(event.at)}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        تخطَّ إلى المحتوى الرئيسي
      </a>

      <header className="hero">
        <div>
          <p className="eyebrow">Innovation Shield Platform</p>
          <h1>درع الابتكار - منصة قوية لإدارة الابتكار المؤسسي</h1>
          <p className="hero-text">
            منصة تمكّن موظفي التجمع الصحي بالطائف من تحويل فكرة إلى نموذج أولي قابل للاختبار
            خلال 6 أسابيع مع اعتماد مؤسسي واضح.
          </p>
          <div className="hero-cta-row">
            <button className="btn primary cta-main" onClick={startNewInnovation}>
              ابدأ ابتكار جديد
            </button>
            <button className="btn ghost" onClick={() => setActiveView('overview')}>
              كيف تعمل المنصة؟
            </button>
          </div>
        </div>
        <div className="hero-side">
          <article>
            <p>الإصدار</p>
            <strong>{state.meta.version}</strong>
          </article>
          <article>
            <p>فرق ابتكار فعالة</p>
            <strong>{state.engagement.activeSquads}</strong>
          </article>
          <article>
            <p>مساهمون</p>
            <strong>{state.engagement.contributors}</strong>
          </article>
        </div>
      </header>

      {flashMessage ? (
        <section className="flash-box" aria-live="polite">
          {flashMessage}
        </section>
      ) : null}

      {!session.isAuthenticated ? (
        <section className="panel auth-panel">
          <div className="panel-head">
            <h3>تسجيل الدخول للمنصة</h3>
            <span>Role-Based Access</span>
          </div>
          <p className="lead-text">
            ادخل بدورك المؤسسي لبدء المسار: قدم الفكرة، اختبرها، ثم ارفعها للاعتماد.
          </p>
          <div className="inline-input wrap">
            <input
              value={loginForm.name}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="اسم المستخدم"
            />
            <select
              value={loginForm.role}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <button className="btn primary" onClick={handleLogin}>
              دخول
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="session-strip">
            <span className="badge good">المستخدم: {session.name}</span>
            <span className="badge">{session.role}</span>
            <span className="badge">آخر دخول: {formatDate(session.lastLoginAt)}</span>
            <div className="session-search">
              <input
                value={ideaSearch}
                onChange={(event) => setIdeaSearch(event.target.value)}
                placeholder="بحث ذكي: فكرة، مالك، مرحلة..."
                aria-label="بحث داخل الأفكار"
              />
              <span className="badge">نتائج: {visibleIdeas.length}</span>
            </div>
            <button className="btn" onClick={() => setActiveView('lifecycle')}>
              فتح النتائج
            </button>
            <button className="btn" onClick={handleExportWeeklyExecutiveReport}>
              تقرير أسبوعي
            </button>
            <button className="btn ghost" onClick={handleLogout}>
              تسجيل خروج
            </button>
          </section>

          <nav className="top-nav" aria-label="التنقل الرئيسي">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                className={activeView === view.id ? 'active' : ''}
                onClick={() => setActiveView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </nav>

          <main id="main-content">
            {activeView === 'overview' ? renderOverview() : null}
            {activeView === 'lifecycle' ? renderLifecycle() : null}
            {activeView === 'workflow' ? renderWorkflow() : null}
            {activeView === 'workspace' ? renderWorkspace() : null}
            {activeView === 'prototype' ? renderPrototype() : null}
            {activeView === 'impact' ? renderImpact() : null}
            {activeView === 'knowledge' ? renderKnowledge() : null}
            {activeView === 'governance' ? renderGovernance() : null}
            {activeView === 'audit' ? renderAudit() : null}
          </main>

          <button className="floating-cta" onClick={startNewInnovation} aria-label="ابدأ ابتكار جديد">
            ابدأ ابتكار جديد
          </button>

          {renderOnboardingModal()}
        </>
      )}

      <footer className="platform-footer">
        <div className="footer-links">
          <button className="btn ghost" onClick={() => navigateFromFooter('about')}>
            من نحن
          </button>
          <button className="btn ghost" onClick={() => navigateFromFooter('policies')}>
            السياسات
          </button>
          <button className="btn ghost" onClick={() => navigateFromFooter('support')}>
            الدعم
          </button>
          <button className="btn ghost" onClick={() => navigateFromFooter('contact')}>
            تواصل معنا
          </button>
        </div>
        <p className="footer-note">
          {state.meta.orgName} | الهدف الاستراتيجي: {state.meta.strategicGoal} | آخر تحديث:{' '}
          {formatDate(state.meta.lastUpdated)}
        </p>
      </footer>
    </div>
  )
}

export default App
