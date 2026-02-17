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

const APPROVAL_GATES = [
  { id: 'screening', title: 'Gate 1 - فرز الفكرة' },
  { id: 'prototype', title: 'Gate 2 - صلاحية النموذج' },
  { id: 'pilot', title: 'Gate 3 - جاهزية الاختبار' },
  { id: 'adoption', title: 'Gate 4 - قرار الاعتماد' },
]

const STAGE_GATE_REQUIREMENT = {
  'الفرز المؤسسي': 'screening',
  'بناء النموذج الأولي': 'prototype',
  'الاختبار الميداني': 'pilot',
  الاعتماد: 'adoption',
  'التوسع والتطبيق': 'adoption',
}

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
  return {
    screening: createDefaultApprovalGate(),
    prototype: createDefaultApprovalGate(),
    pilot: createDefaultApprovalGate(),
    adoption: createDefaultApprovalGate(),
  }
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

function normalizeIdea(input) {
  const now = new Date().toISOString()
  const idea = cloneInitiative(input || {})

  const governance = {
    ipProtection: false,
    confidentiality: false,
    ethicsReview: false,
    dataPolicy: false,
    ownershipDefined: false,
    ...(idea.governance || {}),
  }

  const gateApproved = REQUIRED_GOVERNANCE_FIELDS.every((field) => Boolean(governance[field]))

  const approvals = {
    ...createDefaultApprovals(),
    ...(idea.approvals || {}),
    screening: {
      ...createDefaultApprovalGate(),
      ...(idea.approvals?.screening || {}),
    },
    prototype: {
      ...createDefaultApprovalGate(),
      ...(idea.approvals?.prototype || {}),
    },
    pilot: {
      ...createDefaultApprovalGate(),
      ...(idea.approvals?.pilot || {}),
    },
    adoption: {
      ...createDefaultApprovalGate(),
      ...(idea.approvals?.adoption || {}),
    },
  }

  const ideaStageIndex = LIFECYCLE_STAGES.indexOf(idea.stage)
  const autoGateOrder = [
    { gateId: 'screening', stage: 'الفرز المؤسسي' },
    { gateId: 'prototype', stage: 'بناء النموذج الأولي' },
    { gateId: 'pilot', stage: 'الاختبار الميداني' },
    { gateId: 'adoption', stage: 'الاعتماد' },
  ]

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
    },
    workspace: {
      tasks: Array.isArray(idea.workspace?.tasks) ? idea.workspace.tasks : [],
      notes: Array.isArray(idea.workspace?.notes) ? idea.workspace.notes : [],
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
    evidence,
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

function canMoveToStage(idea, nextStage) {
  const currentIndex = LIFECYCLE_STAGES.indexOf(idea.stage)
  const nextIndex = LIFECYCLE_STAGES.indexOf(nextStage)
  const requiredGate = STAGE_GATE_REQUIREMENT[nextStage]

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
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN_FORM)
  const [intakeForm, setIntakeForm] = useState(DEFAULT_INTAKE_FORM)
  const [taskInput, setTaskInput] = useState('')
  const [noteAuthor, setNoteAuthor] = useState('صاحب الفكرة')
  const [noteInput, setNoteInput] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [evidenceType, setEvidenceType] = useState('ملف اختبار')
  const [evidenceNote, setEvidenceNote] = useState('')
  const [flashMessage, setFlashMessage] = useState('')
  const [impactResult, setImpactResult] = useState(null)

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

  const selectedIdea = useMemo(
    () => state.ideas.find((item) => item.id === selectedId) || state.ideas[0] || null,
    [state.ideas, selectedId],
  )

  const session = state.session || DEFAULT_SESSION
  const permissions = ROLE_PERMISSIONS[session.role] || ROLE_PERMISSIONS[ROLE_OPTIONS[0]]

  const lifecycleGroups = useMemo(() => {
    return LIFECYCLE_STAGES.reduce((acc, stage) => {
      acc[stage] = state.ideas.filter((item) => item.stage === stage)
      return acc
    }, {})
  }, [state.ideas])

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
      APPROVAL_GATES.map((gate) => idea.approvals?.[gate.id]?.status || 'not_requested'),
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
    const newIdea = normalizeIdea({
      id: newId('INN'),
      title: intakeForm.title.trim(),
      owner: intakeForm.owner.trim() || session.name || 'فريق الابتكار',
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
      },
      workspace: {
        tasks: [
          { id: newId('TSK'), text: 'تأكيد تعريف المشكلة مع أصحاب المصلحة', done: false },
          { id: newId('TSK'), text: 'إعداد خطة فرز مؤسسي أولية', done: false },
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
    setFlashMessage('تم إنشاء الفكرة وربطها بدورة حياة الابتكار المؤسسية.')
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
      })
      return draft
    }, {
      action: 'add_task',
      target: selectedIdea.id,
      detail: 'إضافة مهمة جديدة إلى مساحة العمل',
    })
    setTaskInput('')
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
      draft.simulationInputs[field] = Number(value)
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
    setImpactResult(result)

    updateIdea(selectedIdea.id, (draft) => {
      draft.impact.costSaving = result.annualSaving
      draft.impact.timeSaving = result.expectedTimeReduction
      draft.impact.qualityImprovement = result.qualityLift
      draft.impact.satisfaction = result.satisfactionLift
      return draft
    }, {
      action: 'run_impact_simulation',
      target: selectedIdea.id,
      detail: 'تشغيل محاكاة الأثر',
    })

    setFlashMessage('تم تنفيذ محاكاة الأثر وتحديث مؤشرات الفكرة.')
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

  const renderOverview = () => {
    const pillars = [
      {
        title: 'إدارة دورة حياة الابتكار',
        detail: 'تدفق مؤسسي واضح من التقاط الفكرة وحتى التوسع داخل التجمع.',
      },
      {
        title: 'تمكين المبتكرين',
        detail: 'Workspace تشاركي + Prototype Builder لتحويل الفكرة إلى نموذج قابل للاختبار.',
      },
      {
        title: 'تقييم القرار',
        detail: 'قياس نضج الفكرة والمخاطر والجاهزية لدعم قرارات البوابات المرحلية.',
      },
      {
        title: 'محاكاة أثر قبل التنفيذ',
        detail: 'تحليل أثر التكلفة والوقت والجودة قبل الاعتماد النهائي.',
      },
      {
        title: 'مكتبة معرفية مؤسسية',
        detail: 'قوالب وأدوات ودراسات حالة تمكّن التعلم الذاتي السريع للفرق.',
      },
      {
        title: 'حوكمة وحماية الملكية الفكرية',
        detail: 'سياسات واضحة لحقوق الفكرة وسرية البيانات والتوافق التنظيمي.',
      },
    ]

    return (
      <div className="view-stack">
        <section className="panel executive-panel">
          <div className="panel-head">
            <h3>ملخص المشروع الكامل</h3>
            <span>{state.meta.orgName}</span>
          </div>
          <p className="lead-text">
            درع الابتكار هو منصة رقمية مؤسسية متكاملة داخل التجمع الصحي بالطائف لتمكين المبتكرين
            وتحويل الأفكار إلى نماذج أولية قابلة للاختبار والتطبيق، عبر دورة حياة ابتكار واضحة،
            أدوات تمكين تشغيلية، تقييم نضج، محاكاة أثر، ومكتبة معرفية، مع حوكمة وسياسات ملكية فكرية.
          </p>
          <div className="journey-line">
            {LIFECYCLE_STAGES.map((stage, index) => (
              <div key={stage} className="journey-node">
                <span>{stage}</span>
                {index < LIFECYCLE_STAGES.length - 1 ? <small>←</small> : null}
              </div>
            ))}
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
            <h3>ركائز المنظومة</h3>
            <span>Strategic Pillars</span>
          </div>
          <div className="pillars-grid">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="pillar-card">
                <strong>{pillar.title}</strong>
                <p>{pillar.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  const renderLifecycle = () => {
    return (
      <section className="lifecycle-layout">
        <article className="panel intake-panel">
          <div className="panel-head">
            <h3>التقاط فكرة جديدة</h3>
            <span>Idea Intake</span>
          </div>

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
              <option>تشغيلي</option>
              <option>جودة</option>
              <option>تجربة مريض</option>
              <option>تقني</option>
              <option>موارد بشرية</option>
              <option>مالي</option>
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
            <span>{state.ideas.length} فكرة</span>
          </div>

          <div className="board">
            {LIFECYCLE_STAGES.map((stage) => (
              <section key={stage} className="stage-column">
                <div className="stage-head">
                  <strong>{stage}</strong>
                  <span>{lifecycleGroups[stage]?.length || 0}</span>
                </div>

                <div className="card-list">
                  {(lifecycleGroups[stage] || []).map((idea) => (
                    <article key={idea.id} className="idea-card">
                      <div className="idea-head">
                        <strong>{idea.title}</strong>
                        <span className={`badge ${stageTone(idea.stage)}`}>{idea.status}</span>
                      </div>

                      <p>{idea.owner}</p>

                      <div className="metric-row">
                        <span>Maturity {calcMaturity(idea)}%</span>
                        <span>Risk {calcRisk(idea)}%</span>
                        <span>Readiness {calcReadiness(idea)}%</span>
                      </div>

                      <div className="metric-row">
                        <span className={`badge ${idea.governance.gateApproved ? 'good' : 'bad'}`}>
                          {idea.governance.gateApproved ? 'حوكمة مكتملة' : 'حوكمة ناقصة'}
                        </span>
                      </div>

                      <div className="card-actions two-cols">
                        <select
                          value={idea.stage}
                          onChange={(event) => handleIdeaStageChange(idea.id, event.target.value)}
                        >
                          {LIFECYCLE_STAGES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                        <select
                          value={idea.status}
                          onChange={(event) => handleIdeaStatusChange(idea.id, event.target.value)}
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
                  ))}
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
    const requiredGateForStage = STAGE_GATE_REQUIREMENT[selectedIdea.stage]

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
                {APPROVAL_GATES.map((gate) => {
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

          <div className="chip-row">
            <span className="chip">النضج: {calcMaturity(selectedIdea)}%</span>
            <span className="chip">الجاهزية: {calcReadiness(selectedIdea)}%</span>
            <span className="chip">القالب: {template?.name || '—'}</span>
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

            <button className="btn primary" onClick={handleRunImpact}>
              تشغيل المحاكاة
            </button>

            {impactResult ? (
              <div className="impact-result">
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
        title: 'Decision & Prioritization Templates',
        detail: 'نماذج المفاضلة وترتيب الأولويات للقرار المؤسسي.',
      },
      {
        id: 'res-2',
        title: 'Business Model Canvas',
        detail: 'هيكلة القيمة، الشرائح، القنوات، الإيرادات والتكلفة.',
      },
      {
        id: 'res-3',
        title: 'Operational Case Studies',
        detail: 'أمثلة تطبيقية داخل القطاع الصحي لتحسين التبني.',
      },
      {
        id: 'res-4',
        title: 'Prototype Testing Sheets',
        detail: 'نماذج اختبار الفرضيات وجمع الأدلة قبل الاعتماد.',
      },
    ]

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
          </div>
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
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Innovation Shield Platform</p>
          <h1>درع الابتكار - منصة قوية لإدارة الابتكار المؤسسي</h1>
          <p className="hero-text">
            منصة تشغيلية داخل التجمع الصحي بالطائف لتمكين المبتكرين وتحويل الأفكار إلى نماذج
            قابلة للاختبار والتطبيق، مع Workflow موافقات رسمي، إدارة أدلة، ولوحة تدقيق كاملة.
          </p>
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

      {flashMessage ? <section className="flash-box">{flashMessage}</section> : null}

      {!session.isAuthenticated ? (
        <section className="panel auth-panel">
          <div className="panel-head">
            <h3>تسجيل الدخول للمنصة</h3>
            <span>Role-Based Access</span>
          </div>
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
            <button className="btn ghost" onClick={handleLogout}>
              تسجيل خروج
            </button>
          </section>

          <nav className="top-nav">
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

          {activeView === 'overview' ? renderOverview() : null}
          {activeView === 'lifecycle' ? renderLifecycle() : null}
          {activeView === 'workflow' ? renderWorkflow() : null}
          {activeView === 'workspace' ? renderWorkspace() : null}
          {activeView === 'prototype' ? renderPrototype() : null}
          {activeView === 'impact' ? renderImpact() : null}
          {activeView === 'knowledge' ? renderKnowledge() : null}
          {activeView === 'governance' ? renderGovernance() : null}
          {activeView === 'audit' ? renderAudit() : null}
        </>
      )}

      <footer className="platform-footer">
        <div className="footer-links">
          <a href="#about">من نحن</a>
          <a href="#policies">السياسات</a>
          <a href="#support">الدعم</a>
          <a href="#contact">تواصل معنا</a>
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
