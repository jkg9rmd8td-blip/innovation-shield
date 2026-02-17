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
  { id: 'workspace', label: 'Innovation Workspace' },
  { id: 'prototype', label: 'Prototype Builder' },
  { id: 'impact', label: 'Impact Simulator' },
  { id: 'knowledge', label: 'المكتبة المعرفية' },
  { id: 'governance', label: 'الحوكمة والملكية الفكرية' },
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

  if (nextIndex === -1) {
    return { ok: false, message: 'مرحلة غير معروفة.' }
  }

  if (nextIndex <= currentIndex) {
    return { ok: true }
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
  const [intakeForm, setIntakeForm] = useState(DEFAULT_INTAKE_FORM)
  const [taskInput, setTaskInput] = useState('')
  const [noteAuthor, setNoteAuthor] = useState('صاحب الفكرة')
  const [noteInput, setNoteInput] = useState('')
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

    return {
      total,
      avgMaturity,
      avgReadiness,
      activePrototypes,
      approved,
      implemented,
      annualSaving,
      governanceReady,
    }
  }, [state.ideas])

  const updateIdea = (ideaId, updater) => {
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
        meta: {
          ...prev.meta,
          lastUpdated: new Date().toISOString(),
        },
      }
    })
  }

  const createIdeaFromForm = () => {
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
      owner: intakeForm.owner.trim() || 'فريق الابتكار',
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
    })
  }

  const handleIdeaStatusChange = (ideaId, nextStatus) => {
    updateIdea(ideaId, (draft) => {
      draft.status = nextStatus
      if (nextStatus === 'معتمد' && LIFECYCLE_STAGES.indexOf(draft.stage) < LIFECYCLE_STAGES.indexOf('الاعتماد')) {
        draft.stage = 'الاعتماد'
      }
      if (nextStatus === 'مطبق') {
        draft.stage = 'التوسع والتطبيق'
      }
      return draft
    })
  }

  const handleMaturityChange = (field, value) => {
    if (!selectedIdea) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.maturity[field] = clamp(value, 0, 100)
      return draft
    })
  }

  const handleAddTask = () => {
    if (!selectedIdea || !taskInput.trim()) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.workspace.tasks.unshift({
        id: newId('TSK'),
        text: taskInput.trim(),
        done: false,
      })
      return draft
    })
    setTaskInput('')
  }

  const handleToggleTask = (taskId) => {
    if (!selectedIdea) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.workspace.tasks = draft.workspace.tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      )
      return draft
    })
  }

  const handleAddNote = () => {
    if (!selectedIdea || !noteInput.trim()) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.workspace.notes.unshift({
        id: newId('NTE'),
        author: noteAuthor.trim() || 'صاحب الفكرة',
        text: noteInput.trim(),
        at: new Date().toISOString(),
      })
      return draft
    })
    setNoteInput('')
  }

  const handlePrototypeFieldChange = (field, value) => {
    if (!selectedIdea) return
    updateIdea(selectedIdea.id, (draft) => {
      draft.prototype[field] = value
      return draft
    })
  }

  const handlePrototypeGenerate = () => {
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
    })

    setFlashMessage('تم توليد نموذج عرض أولي وربطه بسجل الابتكار.')
  }

  const handleSimulationInputChange = (field, value) => {
    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.simulationInputs[field] = Number(value)
      return draft
    })
  }

  const handleRunImpact = () => {
    if (!selectedIdea) return

    const result = simulateImpact(selectedIdea, selectedIdea.simulationInputs)
    setImpactResult(result)

    updateIdea(selectedIdea.id, (draft) => {
      draft.impact.costSaving = result.annualSaving
      draft.impact.timeSaving = result.expectedTimeReduction
      draft.impact.qualityImprovement = result.qualityLift
      draft.impact.satisfaction = result.satisfactionLift
      return draft
    })

    setFlashMessage('تم تنفيذ محاكاة الأثر وتحديث مؤشرات الفكرة.')
  }

  const handleRunBenchmark = () => {
    if (!selectedIdea) return
    const matches = benchmarkInitiative(selectedIdea, BENCHMARK_CATALOG)

    updateIdea(selectedIdea.id, (draft) => {
      draft.benchmark.topMatches = matches
      draft.benchmark.lastRun = new Date().toISOString()
      return draft
    })

    setFlashMessage('تمت المقارنة مع الحلول العالمية المرجعية.')
  }

  const handleGovernanceToggle = (field) => {
    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.governance[field] = !draft.governance[field]
      draft.governance.gateApproved = REQUIRED_GOVERNANCE_FIELDS.every((item) =>
        Boolean(draft.governance[item]),
      )
      return draft
    })
  }

  const handleMonitoringChange = (field, value) => {
    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.monitoring[field] = Number(value)
      return draft
    })
  }

  const handleSaveMonitoring = () => {
    if (!selectedIdea) return

    updateIdea(selectedIdea.id, (draft) => {
      draft.monitoring.lastReview = new Date().toISOString()
      return draft
    })

    setFlashMessage('تم حفظ متابعة ما بعد التطبيق.')
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
          <h1>درع الابتكار - منظومة ابتكار مؤسسية متكاملة</h1>
          <p className="hero-text">
            منصة تشغيلية داخل التجمع الصحي بالطائف لتمكين المبتكرين وتحويل الأفكار إلى نماذج
            قابلة للاختبار والتطبيق، مع تقييم نضج، محاكاة أثر، مكتبة معرفية، وحوكمة واضحة.
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

      {flashMessage ? <section className="flash-box">{flashMessage}</section> : null}

      {activeView === 'overview' ? renderOverview() : null}
      {activeView === 'lifecycle' ? renderLifecycle() : null}
      {activeView === 'workspace' ? renderWorkspace() : null}
      {activeView === 'prototype' ? renderPrototype() : null}
      {activeView === 'impact' ? renderImpact() : null}
      {activeView === 'knowledge' ? renderKnowledge() : null}
      {activeView === 'governance' ? renderGovernance() : null}

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
