import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  APP_CONFIG,
  DEFAULT_GOVERNANCE,
  DEFAULT_IDEA,
  DEFAULT_MATURITY,
  DEFAULT_MONITORING,
  DEFAULT_PROTOTYPE,
  DEFAULT_RISK,
  DEFAULT_SESSION,
  DEFAULT_SIMULATION,
  DEFAULT_STATE,
  DOMAIN_OPTIONS,
  GOVERNANCE_CHECKLIST,
  IMPACT_MODELS,
  KNOWLEDGE_SHORTS,
  KNOWLEDGE_TEMPLATES,
  LIFECYCLE_STAGES,
  ONBOARDING_STEPS,
  PROTOTYPE_TEMPLATES,
  QUICK_GUIDE,
  ROLE_OPTIONS,
  ROLE_PERMISSIONS,
  STATUS_OPTIONS,
  V4_ROADMAP,
  VIEWS,
  WORKFLOW_FLOWS,
} from './innovationData'
import {
  applyImpactModel,
  buildActionPlan,
  buildAnnualImpactProjection,
  buildAssistantTips,
  buildIdeaExecutiveReport,
  buildPrototypeDeck,
  buildWeeklyExecutiveReport,
  calcMaturity,
  calcPrototypeScore,
  calcReadiness,
  calcRisk,
  calcStageKpis,
  clamp,
  collectAlerts,
  createDownload,
  deepClone,
  formatDate,
  formatNumber,
  getApprovalFlow,
  getStageRequirement,
  resolveWorkflowType,
  runImpactSimulation,
  stageProgressPercent,
  uid,
} from './engine'

const ALL_GATE_IDS = Array.from(
  new Set(
    Object.values(WORKFLOW_FLOWS)
      .flat()
      .map((gate) => gate.id),
  ),
)

const DEFAULT_LOGIN_FORM = {
  name: '',
  role: ROLE_OPTIONS[0],
}

const DEFAULT_INTAKE_FORM = {
  title: '',
  domain: DOMAIN_OPTIONS[0],
  owner: '',
  department: 'التجمع الصحي بالطائف',
  problem: '',
  solution: '',
  beneficiary: '',
}

const DEFAULT_NOTE_FORM = {
  author: 'صاحب الفكرة',
  text: '',
}

const DEFAULT_TASK_FORM = {
  text: '',
  dueAt: '',
}

function addDays(baseIso, days) {
  const base = new Date(baseIso)
  if (Number.isNaN(base.getTime())) return new Date().toISOString()
  base.setDate(base.getDate() + Number(days || 0))
  return base.toISOString()
}

function getDefaultGate() {
  return {
    status: 'not_requested',
    requested: false,
    requestedAt: null,
    decidedBy: '',
    decidedAt: null,
    note: '',
  }
}

function createApprovalsSeed() {
  return ALL_GATE_IDS.reduce((acc, gateId) => {
    acc[gateId] = getDefaultGate()
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

function ownerSuggestion(domain) {
  const type = resolveWorkflowType(domain)
  if (type === 'technical') return 'فريق التحول الرقمي'
  if (type === 'clinical') return 'فريق الابتكار السريري'
  return 'فريق الابتكار التشغيلي'
}

function normalizeGovernance(raw) {
  const governance = {
    ...deepClone(DEFAULT_GOVERNANCE),
    ...(raw || {}),
  }

  governance.ipReadiness = clamp(governance.ipReadiness, 0, 100)
  governance.protectionNeeded = Boolean(governance.protectionNeeded || governance.ipReadiness < 70)
  governance.gateApproved = GOVERNANCE_CHECKLIST.every((item) => Boolean(governance[item.id]))

  return governance
}

function normalizeApprovals(raw, stage, domain, updatedAt) {
  const approvals = {
    ...createApprovalsSeed(),
  }

  Object.keys(approvals).forEach((gateId) => {
    approvals[gateId] = {
      ...getDefaultGate(),
      ...(raw?.[gateId] || {}),
    }
  })

  const currentStageIndex = LIFECYCLE_STAGES.indexOf(stage)
  if (currentStageIndex >= 0) {
    for (let index = 0; index <= currentStageIndex; index += 1) {
      const stageName = LIFECYCLE_STAGES[index]
      const requiredGate = getStageRequirement(domain, stageName)
      if (!requiredGate || !approvals[requiredGate]) continue
      if (approvals[requiredGate].status === 'not_requested') {
        approvals[requiredGate] = {
          ...approvals[requiredGate],
          status: 'approved',
          requested: false,
          requestedAt: approvals[requiredGate].requestedAt || updatedAt,
          decidedBy: approvals[requiredGate].decidedBy || 'system',
          decidedAt: approvals[requiredGate].decidedAt || updatedAt,
          note: approvals[requiredGate].note || 'اعتماد تلقائي بسبب التقدم في دورة الحياة.',
        }
      }
    }
  }

  return approvals
}

function normalizeIdea(input) {
  const now = new Date().toISOString()
  const raw = deepClone(input || {})

  const merged = {
    ...deepClone(DEFAULT_IDEA),
    ...raw,
  }

  merged.createdAt = raw.createdAt || now
  merged.updatedAt = raw.updatedAt || raw.createdAt || now
  merged.domain = DOMAIN_OPTIONS.includes(merged.domain) ? merged.domain : DOMAIN_OPTIONS[0]
  merged.stage = LIFECYCLE_STAGES.includes(merged.stage) ? merged.stage : LIFECYCLE_STAGES[0]
  merged.status = STATUS_OPTIONS.includes(merged.status) ? merged.status : STATUS_OPTIONS[0]

  merged.maturity = {
    ...deepClone(DEFAULT_MATURITY),
    ...(raw.maturity || {}),
  }

  merged.risk = {
    ...deepClone(DEFAULT_RISK),
    ...(raw.risk || {}),
  }

  merged.prototype = {
    ...deepClone(DEFAULT_PROTOTYPE),
    ...(raw.prototype || {}),
    assets: Array.isArray(raw.prototype?.assets)
      ? raw.prototype.assets.map((asset, index) => ({
          id: asset.id || `AST-${index + 1}`,
          name: asset.name || 'file',
          size: Number(asset.size || 0),
          source: asset.source || 'upload',
          uploadedAt: asset.uploadedAt || merged.updatedAt,
        }))
      : [],
  }

  merged.impact = {
    costSaving: Number(raw.impact?.costSaving || 0),
    timeSaving: clamp(raw.impact?.timeSaving || 0, 0, 100),
    qualityImprovement: clamp(raw.impact?.qualityImprovement || 0, 0, 100),
    satisfaction: clamp(raw.impact?.satisfaction || 0, 0, 100),
  }

  merged.simulation = {
    ...deepClone(DEFAULT_SIMULATION),
    ...(raw.simulation || {}),
    model: IMPACT_MODELS.some((item) => item.id === raw.simulation?.model)
      ? raw.simulation.model
      : DEFAULT_SIMULATION.model,
  }

  merged.monitoring = {
    ...deepClone(DEFAULT_MONITORING),
    ...(raw.monitoring || {}),
  }

  merged.governance = normalizeGovernance(raw.governance)
  merged.approvals = normalizeApprovals(raw.approvals, merged.stage, merged.domain, merged.updatedAt)

  merged.workspace = {
    tasks: Array.isArray(raw.workspace?.tasks)
      ? raw.workspace.tasks.map((task, index) => ({
          id: task.id || uid('TSK'),
          text: task.text || 'مهمة غير معنونة',
          done: Boolean(task.done),
          dueAt: task.dueAt || addDays(merged.updatedAt, 4 + index * 2),
        }))
      : [],
    notes: Array.isArray(raw.workspace?.notes)
      ? raw.workspace.notes.map((note, index) => ({
          id: note.id || `NTE-${index + 1}`,
          author: note.author || 'فريق الابتكار',
          text: note.text || '',
          at: note.at || merged.updatedAt,
        }))
      : [],
  }

  merged.timeline = Array.isArray(raw.timeline)
    ? raw.timeline.map((event, index) => ({
        id: event.id || `EVT-${index + 1}`,
        at: event.at || merged.updatedAt,
        title: event.title || 'حدث',
        detail: event.detail || '',
      }))
    : []

  if (!merged.timeline.length) {
    merged.timeline = [
      {
        id: 'EVT-INIT',
        at: merged.createdAt,
        title: 'إنشاء الفكرة',
        detail: 'تم تسجيل الفكرة في المنصة.',
      },
    ]
  }

  if (!merged.owner?.trim()) {
    merged.owner = ownerSuggestion(merged.domain)
  }

  return merged
}

function normalizeState(input) {
  const seed = deepClone(DEFAULT_STATE)
  const raw = deepClone(input || {})

  const ideas = Array.isArray(raw.ideas) && raw.ideas.length
    ? raw.ideas.map(normalizeIdea)
    : seed.ideas.map(normalizeIdea)

  const state = {
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
      ...deepClone(DEFAULT_SESSION),
      ...(raw.session || {}),
    },
    auditLog: Array.isArray(raw.auditLog) ? raw.auditLog : [],
    ideas,
  }

  return state
}

function loadState() {
  const stored = localStorage.getItem(APP_CONFIG.storageKey)
  if (!stored) return normalizeState(DEFAULT_STATE)
  const parsed = safeParse(stored, DEFAULT_STATE)
  return normalizeState(parsed)
}

function scoreTone(score) {
  if (score >= 80) return 'good'
  if (score >= 55) return 'mid'
  return 'bad'
}

function App() {
  const [state, setState] = useState(loadState)
  const [activeView, setActiveView] = useState('overview')
  const [selectedIdeaId, setSelectedIdeaId] = useState(state.ideas[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN_FORM)
  const [intakeForm, setIntakeForm] = useState(DEFAULT_INTAKE_FORM)
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK_FORM)
  const [noteForm, setNoteForm] = useState(DEFAULT_NOTE_FORM)
  const [approvalNote, setApprovalNote] = useState('')
  const [impactResult, setImpactResult] = useState(null)
  const [flashMessage, setFlashMessage] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingIndex, setOnboardingIndex] = useState(0)

  const session = state.session || DEFAULT_SESSION
  const permissions = ROLE_PERMISSIONS[session.role] || ROLE_PERMISSIONS[ROLE_OPTIONS[0]]

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  }, [])

  useEffect(() => {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!flashMessage) return undefined
    const timer = window.setTimeout(() => setFlashMessage(''), 5000)
    return () => window.clearTimeout(timer)
  }, [flashMessage])

  const filteredIdeas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
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
  }, [state.ideas, searchQuery])

  const selectedIdea = useMemo(() => {
    return (
      state.ideas.find((idea) => idea.id === selectedIdeaId) ||
      filteredIdeas[0] ||
      state.ideas[0] ||
      null
    )
  }, [state.ideas, selectedIdeaId, filteredIdeas])

  const lifecycleGroups = useMemo(() => {
    return LIFECYCLE_STAGES.reduce((acc, stage) => {
      acc[stage] = filteredIdeas.filter((idea) => idea.stage === stage)
      return acc
    }, {})
  }, [filteredIdeas])

  const metrics = useMemo(() => {
    const total = state.ideas.length
    const avgMaturity =
      total > 0 ? Math.round(state.ideas.reduce((sum, idea) => sum + calcMaturity(idea), 0) / total) : 0
    const avgReadiness =
      total > 0 ? Math.round(state.ideas.reduce((sum, idea) => sum + calcReadiness(idea), 0) / total) : 0
    const avgRisk = total > 0 ? Math.round(state.ideas.reduce((sum, idea) => sum + calcRisk(idea), 0) / total) : 0
    const annualSaving = state.ideas.reduce((sum, idea) => sum + Math.max(0, Number(idea.impact.costSaving || 0)), 0)
    const approved = state.ideas.filter((idea) => idea.status === 'معتمد' || idea.status === 'مطبق').length
    const implemented = state.ideas.filter((idea) => idea.status === 'مطبق').length
    const overdue = state.ideas.reduce((sum, idea) => {
      return (
        sum +
        idea.workspace.tasks.filter((task) => {
          if (task.done || !task.dueAt) return false
          const due = new Date(task.dueAt).getTime()
          const ref = new Date(state.meta.lastUpdated || 0).getTime()
          return !Number.isNaN(due) && !Number.isNaN(ref) && due < ref
        }).length
      )
    }, 0)

    return {
      total,
      avgMaturity,
      avgReadiness,
      avgRisk,
      annualSaving,
      approved,
      implemented,
      overdue,
    }
  }, [state.ideas, state.meta.lastUpdated])

  const referenceTime = useMemo(() => {
    const value = new Date(state.meta.lastUpdated || selectedIdea?.updatedAt || 0).getTime()
    return Number.isNaN(value) ? 0 : value
  }, [selectedIdea?.updatedAt, state.meta.lastUpdated])

  const stageKpis = useMemo(() => (selectedIdea ? calcStageKpis(selectedIdea) : []), [selectedIdea])

  const smartAlerts = useMemo(
    () => (selectedIdea ? collectAlerts(selectedIdea, referenceTime) : []),
    [selectedIdea, referenceTime],
  )

  const actionPlan = useMemo(() => (selectedIdea ? buildActionPlan(selectedIdea) : []), [selectedIdea])

  const assistantTips = useMemo(() => (selectedIdea ? buildAssistantTips(selectedIdea) : []), [selectedIdea])

  const weeklyTasks = useMemo(() => {
    if (!selectedIdea) return []
    const oneWeek = 1000 * 60 * 60 * 24 * 7

    return selectedIdea.workspace.tasks.filter((task) => {
      if (task.done || !task.dueAt) return false
      const due = new Date(task.dueAt).getTime()
      return !Number.isNaN(due) && due >= referenceTime && due <= referenceTime + oneWeek
    })
  }, [referenceTime, selectedIdea])

  const annualProjection = useMemo(
    () => buildAnnualImpactProjection(metrics.annualSaving),
    [metrics.annualSaving],
  )

  const workflowGates = useMemo(
    () => (selectedIdea ? getApprovalFlow(selectedIdea.domain) : []),
    [selectedIdea],
  )

  const requiredGate = useMemo(
    () => (selectedIdea ? getStageRequirement(selectedIdea.domain, selectedIdea.stage) : null),
    [selectedIdea],
  )

  const buildAuditEntry = (action, target, detail) => ({
    id: uid('AUD'),
    at: new Date().toISOString(),
    actor: session.name || 'system',
    role: session.role || 'مبتكر',
    action,
    target,
    detail,
  })

  const updateIdea = (ideaId, updater, audit = null) => {
    setState((prev) => {
      const now = new Date().toISOString()
      const updatedIdeas = prev.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea

        const draft = normalizeIdea(idea)
        const updated = updater(draft) || draft

        if (audit) {
          const timelineEvent = {
            id: uid('EVT'),
            at: now,
            title: audit.action,
            detail: audit.detail || '',
          }
          updated.timeline = [timelineEvent, ...(updated.timeline || [])].slice(0, 120)
        }

        return normalizeIdea({
          ...updated,
          updatedAt: now,
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
          lastUpdated: now,
        },
      }
    })
  }

  const handleLogin = () => {
    if (!loginForm.name.trim()) {
      setFlashMessage('اكتب اسم المستخدم قبل تسجيل الدخول.')
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
          id: uid('AUD'),
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

    const seen = localStorage.getItem(APP_CONFIG.onboardingKey)
    if (!seen) {
      setShowOnboarding(true)
      setOnboardingIndex(0)
    }

    setFlashMessage(`مرحبًا ${loginForm.name.trim()}، تم تفعيل حسابك بدور ${loginForm.role}.`)
  }

  const handleLogout = () => {
    const now = new Date().toISOString()

    setState((prev) => ({
      ...prev,
      session: deepClone(DEFAULT_SESSION),
      auditLog: [
        {
          id: uid('AUD'),
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

  const startNewIdea = () => {
    if (!session.isAuthenticated) {
      setFlashMessage('سجل الدخول أولاً لبدء فكرة جديدة.')
      return
    }

    if (!permissions.canCreate) {
      setFlashMessage('دورك الحالي لا يمتلك صلاحية إنشاء فكرة جديدة.')
      return
    }

    setActiveView('lifecycle')
    setFlashMessage('نموذج Idea Intake جاهز. أكمل الحقول الأساسية ثم سجّل الفكرة.')
  }

  const handleCreateIdea = () => {
    if (!permissions.canCreate) {
      setFlashMessage('لا تملك صلاحية إنشاء فكرة جديدة.')
      return
    }

    if (!intakeForm.title.trim() || !intakeForm.problem.trim() || !intakeForm.solution.trim() || !intakeForm.beneficiary.trim()) {
      setFlashMessage('أكمل الحقول الأساسية: العنوان، المشكلة، الحل، المستفيد.')
      return
    }

    const now = new Date().toISOString()
    const newIdea = normalizeIdea({
      id: uid('INN'),
      title: intakeForm.title.trim(),
      owner: intakeForm.owner.trim() || ownerSuggestion(intakeForm.domain),
      department: intakeForm.department.trim() || 'التجمع الصحي بالطائف',
      domain: intakeForm.domain,
      problem: intakeForm.problem.trim(),
      solution: intakeForm.solution.trim(),
      beneficiary: intakeForm.beneficiary.trim(),
      stage: 'Idea Intake',
      status: 'جديد',
      workspace: {
        tasks: [
          {
            id: uid('TSK'),
            text: 'تأكيد تعريف المشكلة مع أصحاب المصلحة',
            done: false,
            dueAt: addDays(now, 3),
          },
          {
            id: uid('TSK'),
            text: 'تجهيز Canvas وBusiness Case أولي',
            done: false,
            dueAt: addDays(now, 6),
          },
        ],
        notes: [],
      },
      timeline: [
        {
          id: uid('EVT'),
          at: now,
          title: 'create_idea',
          detail: 'تم تسجيل الفكرة عبر نموذج خطوة واحدة.',
        },
      ],
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
      auditLog: [
        {
          id: uid('AUD'),
          at: now,
          actor: session.name || 'system',
          role: session.role,
          action: 'create_idea',
          target: newIdea.id,
          detail: `إنشاء فكرة جديدة بعنوان ${newIdea.title}`,
        },
        ...prev.auditLog,
      ].slice(0, 300),
      meta: {
        ...prev.meta,
        lastUpdated: now,
      },
    }))

    setSelectedIdeaId(newIdea.id)
    setIntakeForm(DEFAULT_INTAKE_FORM)
    setActiveView('workspace')
    setFlashMessage('تم إنشاء الفكرة وربطها باللوحة التنفيذية مباشرة.')
  }

  const canMoveToStage = (idea, nextStage) => {
    const currentIndex = LIFECYCLE_STAGES.indexOf(idea.stage)
    const nextIndex = LIFECYCLE_STAGES.indexOf(nextStage)

    if (nextIndex === -1) return { ok: false, message: 'مرحلة غير معروفة.' }
    if (nextIndex <= currentIndex) return { ok: true }

    const required = getStageRequirement(idea.domain, nextStage)
    if (required && idea.approvals?.[required]?.status !== 'approved') {
      return { ok: false, message: `لا يمكن الانتقال قبل اعتماد ${required}.` }
    }

    if (nextStage === 'Prototype' && calcMaturity(idea) < 60) {
      return { ok: false, message: 'الانتقال إلى Prototype يتطلب نضجًا لا يقل عن 60%.' }
    }

    if (
      nextStage === 'Testing' &&
      (calcPrototypeScore(idea) < 55 || !idea.prototype.hypothesis.trim() || !idea.prototype.testPlan.trim())
    ) {
      return { ok: false, message: 'أكمل عناصر النموذج الأولي قبل Testing.' }
    }

    if (nextStage === 'Adoption' && !idea.governance.gateApproved) {
      return { ok: false, message: 'لا يمكن الوصول إلى Adoption قبل اكتمال الحوكمة.' }
    }

    return { ok: true }
  }

  const handleStageChange = (ideaId, nextStage) => {
    if (!permissions.canMoveStage) {
      setFlashMessage('ليس لديك صلاحية تغيير المرحلة.')
      return
    }

    const idea = state.ideas.find((item) => item.id === ideaId)
    if (!idea) return

    const validation = canMoveToStage(idea, nextStage)
    if (!validation.ok) {
      setFlashMessage(validation.message)
      return
    }

    updateIdea(
      ideaId,
      (draft) => {
        draft.stage = nextStage

        if (nextStage === 'Prototype' && draft.status === 'جديد') {
          draft.status = 'قيد العمل'
        }
        if (nextStage === 'Testing') {
          draft.status = 'قيد الاختبار'
        }
        if (nextStage === 'Adoption' && draft.status !== 'مطبق') {
          draft.status = 'قيد المراجعة'
        }

        return draft
      },
      {
        action: 'change_stage',
        target: ideaId,
        detail: `تحديث المرحلة إلى ${nextStage}`,
      },
    )
  }

  const handleStatusChange = (ideaId, nextStatus) => {
    if (!permissions.canMoveStage) {
      setFlashMessage('ليس لديك صلاحية تغيير الحالة.')
      return
    }

    updateIdea(
      ideaId,
      (draft) => {
        draft.status = nextStatus
        if (nextStatus === 'معتمد') {
          draft.stage = 'Adoption'
        }
        if (nextStatus === 'مطبق') {
          draft.stage = 'Adoption'
        }
        return draft
      },
      {
        action: 'change_status',
        target: ideaId,
        detail: `تحديث الحالة إلى ${nextStatus}`,
      },
    )
  }

  const handleMaturityChange = (field, value) => {
    if (!selectedIdea || !permissions.canEdit) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.maturity[field] = clamp(value, 0, 100)
        return draft
      },
      {
        action: 'update_maturity',
        target: selectedIdea.id,
        detail: `تحديث مؤشر ${field}`,
      },
    )
  }

  const handleRiskChange = (field, value) => {
    if (!selectedIdea || !permissions.canEdit) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.risk[field] = clamp(value, 1, 5)
        return draft
      },
      {
        action: 'update_risk',
        target: selectedIdea.id,
        detail: `تحديث مخاطرة ${field}`,
      },
    )
  }

  const handleAddTask = () => {
    if (!selectedIdea || !permissions.canEdit) return
    if (!taskForm.text.trim()) return

    const dueAt = taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : addDays(new Date().toISOString(), 7)

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.workspace.tasks.unshift({
          id: uid('TSK'),
          text: taskForm.text.trim(),
          done: false,
          dueAt,
        })
        return draft
      },
      {
        action: 'add_task',
        target: selectedIdea.id,
        detail: 'إضافة مهمة جديدة',
      },
    )

    setTaskForm(DEFAULT_TASK_FORM)
  }

  const handleToggleTask = (taskId) => {
    if (!selectedIdea || !permissions.canEdit) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.workspace.tasks = draft.workspace.tasks.map((task) => {
          if (task.id !== taskId) return task
          return {
            ...task,
            done: !task.done,
          }
        })
        return draft
      },
      {
        action: 'toggle_task',
        target: selectedIdea.id,
        detail: `تحديث حالة المهمة ${taskId}`,
      },
    )
  }

  const handleAddNote = () => {
    if (!selectedIdea || !permissions.canEdit) return
    if (!noteForm.text.trim()) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.workspace.notes.unshift({
          id: uid('NTE'),
          author: noteForm.author.trim() || session.name || 'صاحب الفكرة',
          text: noteForm.text.trim(),
          at: new Date().toISOString(),
        })
        return draft
      },
      {
        action: 'add_note',
        target: selectedIdea.id,
        detail: 'إضافة ملاحظة في مساحة العمل',
      },
    )

    setNoteForm((prev) => ({
      ...prev,
      text: '',
    }))
  }

  const handlePrototypeChange = (field, value) => {
    if (!selectedIdea || !permissions.canEdit) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.prototype[field] = field === 'progress' ? clamp(value, 0, 100) : value
        return draft
      },
      {
        action: 'update_prototype',
        target: selectedIdea.id,
        detail: `تحديث حقل ${field} في Prototype`,
      },
    )
  }

  const handlePrototypeAssetUpload = (files) => {
    if (!selectedIdea || !permissions.canEdit) return

    const list = Array.from(files || [])
    if (!list.length) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        const batch = list.map((file) => ({
          id: uid('AST'),
          name: file.name,
          size: Number(file.size || 0),
          source: file.type || 'upload',
          uploadedAt: new Date().toISOString(),
        }))
        draft.prototype.assets = [...batch, ...(draft.prototype.assets || [])].slice(0, 40)
        return draft
      },
      {
        action: 'upload_prototype_asset',
        target: selectedIdea.id,
        detail: `رفع ${list.length} ملف Prototype`,
      },
    )
  }

  const handleRemovePrototypeAsset = (assetId) => {
    if (!selectedIdea || !permissions.canEdit) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.prototype.assets = draft.prototype.assets.filter((asset) => asset.id !== assetId)
        return draft
      },
      {
        action: 'remove_prototype_asset',
        target: selectedIdea.id,
        detail: `حذف ملف ${assetId}`,
      },
    )
  }

  const handleGenerateDeck = () => {
    if (!selectedIdea || !permissions.canEdit) return

    const template = PROTOTYPE_TEMPLATES.find((item) => item.id === selectedIdea.prototype.template)
    const deck = buildPrototypeDeck(selectedIdea, template?.name || 'Template')

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.prototype.lastDeck = deck
        draft.prototype.progress = Math.min(100, Number(draft.prototype.progress || 0) + 12)
        if (LIFECYCLE_STAGES.indexOf(draft.stage) < LIFECYCLE_STAGES.indexOf('Prototype')) {
          draft.stage = 'Prototype'
          draft.status = 'قيد العمل'
        }
        return draft
      },
      {
        action: 'generate_prototype_deck',
        target: selectedIdea.id,
        detail: 'توليد Deck أولي للنموذج',
      },
    )

    setFlashMessage('تم توليد Deck أولي وربطه بالفكرة.')
  }

  const handleSimulationChange = (field, value) => {
    if (!selectedIdea || !permissions.canEdit) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.simulation[field] = field === 'model' ? value : Number(value)
        return draft
      },
      {
        action: 'update_simulation',
        target: selectedIdea.id,
        detail: `تحديث مدخل ${field} في المحاكاة`,
      },
    )
  }

  const handleRunSimulation = () => {
    if (!selectedIdea || !permissions.canEdit) return

    const result = runImpactSimulation(selectedIdea.simulation)
    const impact = applyImpactModel(selectedIdea, result)
    setImpactResult(result)

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.impact = impact
        return draft
      },
      {
        action: 'run_impact_simulation',
        target: selectedIdea.id,
        detail: `تشغيل نموذج ${selectedIdea.simulation.model}`,
      },
    )

    setFlashMessage('تم تشغيل محاكاة الأثر وتحديث المؤشرات التنفيذية.')
  }

  const handleToggleGovernance = (field) => {
    if (!selectedIdea || !permissions.canGovernance) {
      setFlashMessage('تعديل الحوكمة متاح لدور الحوكمة أو مدير المنصة فقط.')
      return
    }

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.governance[field] = !draft.governance[field]
        draft.governance.gateApproved = GOVERNANCE_CHECKLIST.every((item) => Boolean(draft.governance[item.id]))
        return draft
      },
      {
        action: 'toggle_governance',
        target: selectedIdea.id,
        detail: `تحديث بند ${field}`,
      },
    )
  }

  const handleIpReadiness = (value) => {
    if (!selectedIdea || !permissions.canGovernance) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        draft.governance.ipReadiness = clamp(value, 0, 100)
        draft.governance.protectionNeeded = draft.governance.ipReadiness < 70
        return draft
      },
      {
        action: 'update_ip_readiness',
        target: selectedIdea.id,
        detail: `تحديث جاهزية IP إلى ${value}%`,
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

    setFlashMessage('تم إرسال إشعار حماية الملكية الفكرية للفريق.')
  }

  const handleRequestApproval = (gateId) => {
    if (!selectedIdea) return
    if (!permissions.canEdit && !permissions.canCreate) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        const gate = draft.approvals[gateId]
        if (!gate) return draft

        gate.requested = true
        gate.requestedAt = new Date().toISOString()
        if (gate.status !== 'approved') {
          gate.status = 'pending'
        }

        return draft
      },
      {
        action: 'request_approval',
        target: selectedIdea.id,
        detail: `طلب اعتماد ${gateId}`,
      },
    )

    setFlashMessage('تم إرسال طلب الاعتماد المرحلي.')
  }

  const handleDecideApproval = (gateId, decision) => {
    if (!selectedIdea) return
    if (!permissions.canApprove) {
      setFlashMessage('الاعتماد متاح للمراجع أو مدير المنصة.')
      return
    }

    updateIdea(
      selectedIdea.id,
      (draft) => {
        const gate = draft.approvals[gateId]
        if (!gate) return draft

        gate.status = decision
        gate.requested = false
        gate.decidedBy = session.name || 'reviewer'
        gate.decidedAt = new Date().toISOString()
        gate.note = approvalNote.trim()

        return draft
      },
      {
        action: decision === 'approved' ? 'approve_gate' : 'reject_gate',
        target: selectedIdea.id,
        detail: `${decision} ${gateId}`,
      },
    )

    setApprovalNote('')
    setFlashMessage(decision === 'approved' ? 'تم اعتماد البوابة بنجاح.' : 'تم رفض البوابة.')
  }

  const handleApplyActionPlan = () => {
    if (!selectedIdea || !permissions.canEdit) return

    const lines = actionPlan.slice(0, 6)
    if (!lines.length) return

    updateIdea(
      selectedIdea.id,
      (draft) => {
        const now = new Date().toISOString()
        const existing = new Set(draft.workspace.tasks.map((task) => task.text))
        const generated = lines
          .filter((line) => !existing.has(line))
          .map((line, index) => ({
            id: uid('TSK'),
            text: line,
            done: false,
            dueAt: addDays(now, 2 + index * 2),
          }))

        draft.workspace.tasks = [...generated, ...draft.workspace.tasks]
        return draft
      },
      {
        action: 'apply_action_plan',
        target: selectedIdea.id,
        detail: `توليد ${lines.length} مهام من خطة العمل`,
      },
    )

    setFlashMessage('تم تحويل خطة العمل إلى مهام أسبوعية قابلة للتنفيذ.')
  }

  const exportIdeaReport = () => {
    if (!selectedIdea) return

    const content = buildIdeaExecutiveReport(selectedIdea, stageKpis, smartAlerts, impactResult)
    createDownload(`idea-report-${selectedIdea.id}.txt`, content)
    setFlashMessage('تم تصدير تقرير الفكرة التنفيذي.')
  }

  const exportWeeklyReport = () => {
    const content = buildWeeklyExecutiveReport(state.ideas, metrics)
    createDownload(`weekly-report-${new Date().toISOString().slice(0, 10)}.txt`, content)
    setFlashMessage('تم تصدير التقرير التنفيذي الأسبوعي.')
  }

  const exportStageReport = () => {
    if (!selectedIdea) return

    const gateName = requiredGate || 'N/A'
    const content = [
      `تقرير مرحلة - ${selectedIdea.title}`,
      `المعرف: ${selectedIdea.id}`,
      `المرحلة: ${selectedIdea.stage}`,
      `الحالة: ${selectedIdea.status}`,
      `Gate المطلوب: ${gateName}`,
      `النضج: ${calcMaturity(selectedIdea)}%`,
      `الجاهزية: ${calcReadiness(selectedIdea)}%`,
      `المخاطر: ${calcRisk(selectedIdea)}%`,
      '',
      'التنبيهات الحالية:',
      ...(smartAlerts.length ? smartAlerts.map((alert) => `- ${alert.text}`) : ['- لا توجد تنبيهات حرجة.']),
      '',
      'الخطة المقترحة:',
      ...actionPlan.map((item) => `- ${item}`),
    ].join('\n')

    createDownload(`stage-report-${selectedIdea.id}-${selectedIdea.stage}.txt`, content)
    setFlashMessage('تم تصدير تقرير المرحلة.')
  }

  const closeOnboarding = () => {
    localStorage.setItem(APP_CONFIG.onboardingKey, '1')
    setShowOnboarding(false)
    setOnboardingIndex(0)
  }

  const nextOnboarding = () => {
    if (onboardingIndex >= ONBOARDING_STEPS.length - 1) {
      closeOnboarding()
      return
    }
    setOnboardingIndex((prev) => prev + 1)
  }

  const approvalTone = (status) => {
    if (status === 'approved') return 'good'
    if (status === 'pending') return 'mid'
    if (status === 'rejected') return 'bad'
    return 'neutral'
  }

  const renderOnboarding = () => {
    if (!showOnboarding) return null

    const step = ONBOARDING_STEPS[onboardingIndex]
    const isLast = onboardingIndex === ONBOARDING_STEPS.length - 1

    return (
      <section className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="جولة تعريفية">
        <article className="onboarding-modal">
          <p className="kicker">
            جولة تعريفية {onboardingIndex + 1}/{ONBOARDING_STEPS.length}
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
                nextOnboarding()
                if (isLast) {
                  setActiveView('lifecycle')
                  setFlashMessage('ابدأ الآن بتسجيل فكرة جديدة.')
                }
              }}
            >
              {isLast ? 'ابدأ' : 'التالي'}
            </button>
          </div>
        </article>
      </section>
    )
  }

  const renderOverview = () => {
    return (
      <div className="view-stack">
        <section className="panel hero-panel">
          <p className="kicker">منصّة تنفيذية جاهزة للعمل</p>
          <h2>إدارة دورة حياة الابتكار من الالتقاط حتى التبني خلال منصة واحدة.</h2>
          <p className="lead">
            المنصّة مفعلة بالكامل: Workflow ديناميكي، تنبيهات ذكية، خطة عمل تلقائية، محاكاة أثر،
            وحوكمة ملكية فكرية مع تقارير قيادية جاهزة للتصدير.
          </p>
          <div className="inline-actions wrap">
            <button className="btn primary" onClick={startNewIdea}>
              ابدأ ابتكار جديد
            </button>
            <button className="btn" onClick={() => setActiveView('workspace')}>
              افتح لوحة الفريق
            </button>
            <button className="btn" onClick={exportWeeklyReport}>
              تقرير أسبوعي للقيادة
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>المسار السريع</h3>
            <span>Quick Guide</span>
          </div>
          <div className="guide-grid">
            {QUICK_GUIDE.map((step) => (
              <article key={step.id} className="guide-card">
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="kpi-grid">
          <article>
            <p>عدد الأفكار</p>
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
            <p>متوسط المخاطر</p>
            <strong>{metrics.avgRisk}%</strong>
          </article>
          <article>
            <p>ابتكارات معتمدة</p>
            <strong>{metrics.approved}</strong>
          </article>
          <article>
            <p>ابتكارات مطبقة</p>
            <strong>{metrics.implemented}</strong>
          </article>
          <article>
            <p>مهام متأخرة</p>
            <strong>{metrics.overdue}</strong>
          </article>
          <article>
            <p>وَفر سنوي مقدر</p>
            <strong>{formatNumber(metrics.annualSaving)} ريال</strong>
          </article>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>التحسينات الاستراتيجية V4</h3>
            <span>Roadmap</span>
          </div>
          <div className="roadmap-grid">
            {V4_ROADMAP.map((item) => (
              <article key={item.id} className="road-card">
                <strong>{item.title}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>لوحة الأثر السنوية</h3>
            <span>Impact Board</span>
          </div>
          <div className="impact-year-grid">
            {annualProjection.map((month) => (
              <article key={month.month}>
                <p>{month.month}</p>
                <strong>{formatNumber(month.value)} ريال</strong>
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
            <h3>Idea Intake - خطوة واحدة</h3>
            <span>تسجيل سريع</span>
          </div>
          <p className="lead">أدخل البيانات الأساسية من شاشة واحدة وسجل الفكرة فورًا.</p>

          <label className="field">
            <span>عنوان الابتكار</span>
            <input
              value={intakeForm.title}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="مثال: تحسين مسار التحويل الداخلي"
            />
          </label>

          <label className="field">
            <span>نوع الابتكار</span>
            <select
              value={intakeForm.domain}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, domain: event.target.value }))}
            >
              {DOMAIN_OPTIONS.map((domain) => (
                <option key={domain}>{domain}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>المالك</span>
            <input
              value={intakeForm.owner}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, owner: event.target.value }))}
              placeholder="اتركه فارغًا للتعيين التلقائي"
            />
          </label>

          <label className="field">
            <span>المشكلة</span>
            <textarea
              rows={3}
              value={intakeForm.problem}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, problem: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>الحل المقترح</span>
            <textarea
              rows={3}
              value={intakeForm.solution}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, solution: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>المستفيد</span>
            <input
              value={intakeForm.beneficiary}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, beneficiary: event.target.value }))}
            />
          </label>

          <button className="btn primary" onClick={handleCreateIdea}>
            تسجيل الفكرة
          </button>
        </article>

        <article className="panel board-panel">
          <div className="panel-head">
            <h3>لوحة دورة الحياة</h3>
            <span>{filteredIdeas.length} نتائج</span>
          </div>

          <div className="board-scroll">
            {LIFECYCLE_STAGES.map((stage) => (
              <section key={stage} className="stage-column">
                <div className="stage-head">
                  <strong>{stage}</strong>
                  <span>{lifecycleGroups[stage]?.length || 0}</span>
                </div>

                <div className="card-list">
                  {(lifecycleGroups[stage] || []).map((idea) => {
                    const maturity = calcMaturity(idea)
                    const readiness = calcReadiness(idea)
                    const risk = calcRisk(idea)
                    const progress = stageProgressPercent(idea.stage)
                    const governanceReady = idea.governance.gateApproved

                    return (
                      <article key={idea.id} className="idea-card">
                        <div className="idea-head">
                          <strong>{idea.title}</strong>
                          <span className={`badge ${scoreTone(readiness)}`}>{idea.status}</span>
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
                          <span className={`badge ${governanceReady ? 'good' : 'bad'}`}>
                            {governanceReady ? 'حوكمة مكتملة' : 'حوكمة ناقصة'}
                          </span>
                          <span className="badge">{idea.domain}</span>
                        </div>

                        <div className="card-actions two-cols">
                          <select
                            value={idea.stage}
                            onChange={(event) => handleStageChange(idea.id, event.target.value)}
                            disabled={!permissions.canMoveStage}
                          >
                            {LIFECYCLE_STAGES.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>

                          <select
                            value={idea.status}
                            onChange={(event) => handleStatusChange(idea.id, event.target.value)}
                            disabled={!permissions.canMoveStage}
                          >
                            {STATUS_OPTIONS.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          className="btn ghost"
                          onClick={() => {
                            setSelectedIdeaId(idea.id)
                            setActiveView('workspace')
                          }}
                        >
                          فتح لوحة الفريق
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
          <p>اختر فكرة أولاً.</p>
        </section>
      )
    }

    const overdueAlerts = smartAlerts.filter((alert) => alert.id === 'alert-overdue')

    return (
      <section className="workflow-layout">
        <article className="panel">
          <div className="panel-head">
            <h3>Workflow ديناميكي</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <p className="lead">
            مسار الموافقات يتغير تلقائيًا حسب نوع الابتكار: {selectedIdea.domain} ({resolveWorkflowType(selectedIdea.domain)}).
          </p>

          <div className="chip-row">
            <span className="chip">المرحلة: {selectedIdea.stage}</span>
            <span className="chip">Gate المطلوب: {requiredGate || '—'}</span>
            <span className="chip">عدد البوابات: {workflowGates.length}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>البوابة</th>
                  <th>الحالة</th>
                  <th>طلب</th>
                  <th>قرار</th>
                  <th>آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {workflowGates.map((gate) => {
                  const status = selectedIdea.approvals?.[gate.id] || getDefaultGate()
                  const isRequiredNow = requiredGate === gate.id

                  return (
                    <tr key={gate.id}>
                      <td>
                        <strong>{gate.title}</strong>
                        {isRequiredNow ? <small>مطلوبة الآن</small> : null}
                      </td>
                      <td>
                        <span className={`badge ${approvalTone(status.status)}`}>{status.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => handleRequestApproval(gate.id)}
                          disabled={status.status === 'approved' || (!permissions.canEdit && !permissions.canCreate)}
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
                          {status.decidedBy
                            ? `${status.decidedBy} - ${formatDate(status.decidedAt)}`
                            : status.requestedAt
                              ? `طلب بتاريخ ${formatDate(status.requestedAt)}`
                              : '—'}
                        </small>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <label className="field">
            <span>ملاحظة قرار الموافقة</span>
            <textarea
              rows={2}
              value={approvalNote}
              onChange={(event) => setApprovalNote(event.target.value)}
              placeholder="سبب الاعتماد أو الرفض"
            />
          </label>

          <div className="inline-actions wrap">
            <button className="btn" onClick={exportStageReport}>
              تصدير تقرير المرحلة
            </button>
            <button className="btn" onClick={exportIdeaReport}>
              تصدير تقرير الفكرة
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>تذكيرات ذكية</h3>
            <span>Smart Reminders</span>
          </div>

          <ul className="alert-list">
            {smartAlerts.map((alert) => (
              <li key={alert.id} className={`alert-item ${alert.tone}`}>
                {alert.text}
              </li>
            ))}
            {!smartAlerts.length ? <li className="alert-item good">لا توجد تنبيهات حرجة حالياً.</li> : null}
          </ul>

          {overdueAlerts.length ? (
            <div className="panel-tone warning">
              <strong>تنبيه مهام متأخرة</strong>
              <p>يوجد تعثر في التنفيذ. راجع قائمة المهام في لوحة الفريق فورًا.</p>
            </div>
          ) : (
            <div className="panel-tone success">
              <strong>مؤشر الانضباط جيد</strong>
              <p>لا توجد مهام متأخرة مؤثرة على قرار المرحلة الحالية.</p>
            </div>
          )}
        </article>
      </section>
    )
  }

  const renderWorkspace = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>اختر فكرة أولاً من دورة الحياة.</p>
        </section>
      )
    }

    const tasks = selectedIdea.workspace.tasks
    const notes = selectedIdea.workspace.notes
    const doneTasks = tasks.filter((task) => task.done).length

    return (
      <section className="workspace-layout">
        <article className="panel">
          <div className="panel-head">
            <h3>لوحة الفريق الموحدة</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <h4 className="idea-title">{selectedIdea.title}</h4>
          <p className="lead">{selectedIdea.problem}</p>

          <div className="chip-row">
            <span className="chip">الحالة: {selectedIdea.status}</span>
            <span className="chip">المرحلة: {selectedIdea.stage}</span>
            <span className="chip">المجال: {selectedIdea.domain}</span>
            <span className="chip">المالك: {selectedIdea.owner}</span>
          </div>

          <div className="summary-grid">
            <article>
              <p>Maturity</p>
              <strong>{calcMaturity(selectedIdea)}%</strong>
            </article>
            <article>
              <p>Readiness</p>
              <strong>{calcReadiness(selectedIdea)}%</strong>
            </article>
            <article>
              <p>Risk</p>
              <strong>{calcRisk(selectedIdea)}%</strong>
            </article>
            <article>
              <p>مهام الأسبوع</p>
              <strong>{weeklyTasks.length}</strong>
            </article>
            <article>
              <p>تقدم المهام</p>
              <strong>
                {doneTasks}/{tasks.length}
              </strong>
            </article>
            <article>
              <p>Auto-Score Prototype</p>
              <strong>{calcPrototypeScore(selectedIdea)}%</strong>
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
            <h3>المساعد الذكي</h3>
            <span>Next Steps</span>
          </div>

          <ul className="bullet-list">
            {assistantTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>

          <h4 className="subhead">Action Plan Auto-Generator</h4>
          <ul className="bullet-list">
            {actionPlan.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="inline-actions wrap">
            <button className="btn primary" onClick={handleApplyActionPlan} disabled={!permissions.canEdit}>
              توليد مهام من خطة العمل
            </button>
            <button className="btn" onClick={exportIdeaReport}>
              تقرير تنفيذي
            </button>
          </div>

          <h4 className="subhead">تنبيهات ذكية</h4>
          <ul className="alert-list">
            {smartAlerts.map((alert) => (
              <li key={alert.id} className={`alert-item ${alert.tone}`}>
                {alert.text}
              </li>
            ))}
            {!smartAlerts.length ? <li className="alert-item good">لا توجد تنبيهات حرجة.</li> : null}
          </ul>

          <h4 className="subhead">المهام المطلوبة خلال الأسبوع</h4>
          <ul className="list compact">
            {weeklyTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.text}</strong>
                <small>الموعد: {formatDate(task.dueAt)}</small>
              </li>
            ))}
            {!weeklyTasks.length ? <li className="empty">لا توجد مهام أسبوعية معلقة.</li> : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>Idea Maturity & Risk</h3>
            <span>تحديث مباشر</span>
          </div>

          <div className="form-grid two">
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
              <span>الجاهزية ({selectedIdea.maturity.readiness}%)</span>
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

            <label className="field">
              <span>Operational Risk ({selectedIdea.risk.operational}/5)</span>
              <input
                type="range"
                min="1"
                max="5"
                value={selectedIdea.risk.operational}
                onChange={(event) => handleRiskChange('operational', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Financial Risk ({selectedIdea.risk.financial}/5)</span>
              <input
                type="range"
                min="1"
                max="5"
                value={selectedIdea.risk.financial}
                onChange={(event) => handleRiskChange('financial', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Technical Risk ({selectedIdea.risk.technical}/5)</span>
              <input
                type="range"
                min="1"
                max="5"
                value={selectedIdea.risk.technical}
                onChange={(event) => handleRiskChange('technical', event.target.value)}
              />
            </label>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>المهام</h3>
            <span>{tasks.length}</span>
          </div>

          <div className="inline-input wrap">
            <input
              value={taskForm.text}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, text: event.target.value }))}
              placeholder="عنوان المهمة"
            />
            <input
              type="date"
              value={taskForm.dueAt}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, dueAt: event.target.value }))}
            />
            <button className="btn" onClick={handleAddTask}>
              إضافة
            </button>
          </div>

          <ul className="list">
            {tasks.map((task) => (
              <li key={task.id}>
                <label className="check-row">
                  <input type="checkbox" checked={task.done} onChange={() => handleToggleTask(task.id)} />
                  <span className={task.done ? 'done' : ''}>{task.text}</span>
                </label>
                <small>الاستحقاق: {formatDate(task.dueAt)}</small>
              </li>
            ))}
            {!tasks.length ? <li className="empty">لا توجد مهام.</li> : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>سجل التعاون</h3>
            <span>{notes.length}</span>
          </div>

          <div className="inline-input wrap">
            <input
              value={noteForm.author}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, author: event.target.value }))}
              placeholder="الكاتب"
            />
            <input
              value={noteForm.text}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, text: event.target.value }))}
              placeholder="أضف ملاحظة"
            />
            <button className="btn" onClick={handleAddNote}>
              نشر
            </button>
          </div>

          <ul className="list notes">
            {notes.map((note) => (
              <li key={note.id}>
                <strong>{note.author}</strong>
                <p>{note.text}</p>
                <small>{formatDate(note.at)}</small>
              </li>
            ))}
            {!notes.length ? <li className="empty">لا توجد ملاحظات.</li> : null}
          </ul>
        </article>
      </section>
    )
  }

  const renderPrototype = () => {
    if (!selectedIdea) {
      return (
        <section className="panel">
          <p>اختر فكرة أولاً.</p>
        </section>
      )
    }

    const template = PROTOTYPE_TEMPLATES.find((item) => item.id === selectedIdea.prototype.template)
    const prototypeScore = calcPrototypeScore(selectedIdea)

    return (
      <section className="prototype-layout">
        <article className="panel">
          <div className="panel-head">
            <h3>Prototype Builder</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <label className="field">
            <span>القالب</span>
            <select
              value={selectedIdea.prototype.template}
              onChange={(event) => handlePrototypeChange('template', event.target.value)}
            >
              {PROTOTYPE_TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.focus}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>الفرضية</span>
            <textarea
              rows={3}
              value={selectedIdea.prototype.hypothesis}
              onChange={(event) => handlePrototypeChange('hypothesis', event.target.value)}
            />
          </label>

          <label className="field">
            <span>خطة الاختبار</span>
            <textarea
              rows={3}
              value={selectedIdea.prototype.testPlan}
              onChange={(event) => handlePrototypeChange('testPlan', event.target.value)}
            />
          </label>

          <label className="field">
            <span>مؤشر التحقق</span>
            <input
              value={selectedIdea.prototype.validationMetric}
              onChange={(event) => handlePrototypeChange('validationMetric', event.target.value)}
            />
          </label>

          <label className="field">
            <span>تقدم النموذج ({selectedIdea.prototype.progress}%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedIdea.prototype.progress}
              onChange={(event) => handlePrototypeChange('progress', event.target.value)}
            />
          </label>

          <label className="field">
            <span>رفع Figma / Miro / ملفات تصميم</span>
            <input type="file" multiple onChange={(event) => handlePrototypeAssetUpload(event.target.files)} />
          </label>

          <ul className="list compact">
            {selectedIdea.prototype.assets.map((asset) => (
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
            {!selectedIdea.prototype.assets.length ? <li className="empty">لا توجد أصول مرفوعة.</li> : null}
          </ul>

          <div className="chip-row">
            <span className="chip">النضج: {calcMaturity(selectedIdea)}%</span>
            <span className="chip">الجاهزية: {calcReadiness(selectedIdea)}%</span>
            <span className="chip">القالب: {template?.name || '—'}</span>
            <span className={`chip score-${scoreTone(prototypeScore)}`}>Auto-Score: {prototypeScore}%</span>
          </div>

          <div className="inline-actions wrap">
            <button className="btn primary" onClick={handleGenerateDeck}>
              توليد Deck
            </button>
            <button className="btn" onClick={() => handleStageChange(selectedIdea.id, 'Testing')}>
              إرسال إلى Testing
            </button>
          </div>
        </article>

        <article className="panel output-panel">
          <div className="panel-head">
            <h3>مخرجات النموذج</h3>
            <span>{template?.name || 'Template'}</span>
          </div>
          <textarea
            readOnly
            value={
              selectedIdea.prototype.lastDeck ||
              'اضغط توليد Deck لإنشاء حزمة عرض أولية جاهزة للمراجعة.'
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
          <p>اختر فكرة أولاً.</p>
        </section>
      )
    }

    const modelName = IMPACT_MODELS.find((item) => item.id === selectedIdea.simulation.model)?.name || '—'
    const monitoringEnabled = selectedIdea.stage === 'Adoption' || selectedIdea.status === 'مطبق'

    const netCash = Number(selectedIdea.monitoring.cashIn || 0) - Number(selectedIdea.monitoring.cashOut || 0)
    const roi =
      Number(selectedIdea.monitoring.investment || 0) > 0
        ? Math.round((netCash / Number(selectedIdea.monitoring.investment)) * 100)
        : 0

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
                <span>نموذج الأثر</span>
                <select
                  value={selectedIdea.simulation.model}
                  onChange={(event) => handleSimulationChange('model', event.target.value)}
                >
                  {IMPACT_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Baseline Cost</span>
                <input
                  type="number"
                  value={selectedIdea.simulation.baselineCost}
                  onChange={(event) => handleSimulationChange('baselineCost', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Baseline Minutes</span>
                <input
                  type="number"
                  value={selectedIdea.simulation.baselineMinutes}
                  onChange={(event) => handleSimulationChange('baselineMinutes', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Transactions / Year</span>
                <input
                  type="number"
                  value={selectedIdea.simulation.transactionsPerYear}
                  onChange={(event) => handleSimulationChange('transactionsPerYear', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Expected Cost Reduction (%)</span>
                <input
                  type="number"
                  value={selectedIdea.simulation.expectedCostReduction}
                  onChange={(event) => handleSimulationChange('expectedCostReduction', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Expected Time Reduction (%)</span>
                <input
                  type="number"
                  value={selectedIdea.simulation.expectedTimeReduction}
                  onChange={(event) => handleSimulationChange('expectedTimeReduction', event.target.value)}
                />
              </label>
            </div>

            <div className="inline-actions wrap">
              <button className="btn primary" onClick={handleRunSimulation}>
                تشغيل المحاكاة
              </button>
              <button className="btn" onClick={exportIdeaReport}>
                تقرير تنفيذي
              </button>
            </div>

            {impactResult ? (
              <div className="impact-result">
                <p>النموذج: {modelName}</p>
                <p>الوفر السنوي: {formatNumber(impactResult.annualSaving)} ريال</p>
                <p>الساعات الموفرة: {formatNumber(impactResult.annualHoursSaved)} ساعة</p>
              </div>
            ) : null}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>مؤشرات الأثر الحالية</h3>
              <span>Live KPIs</span>
            </div>

            <div className="summary-grid">
              <article>
                <p>الوفر المالي</p>
                <strong>{formatNumber(selectedIdea.impact.costSaving)} ريال</strong>
              </article>
              <article>
                <p>خفض الوقت</p>
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

            <div className="panel-tone info">
              <strong>تقرير جاهز للرفع</strong>
              <p>
                يمكنك تصدير تقرير الفكرة مباشرة ليشمل نموذج الأثر، مؤشرات النضج، التنبيهات، وتوصية
                القيادة.
              </p>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Post-Implementation Monitoring</h3>
            <span>{monitoringEnabled ? 'مفعّل' : 'يتفعل بعد Adoption'}</span>
          </div>

          <div className="form-grid two">
            <label className="field">
              <span>TOC Input (%)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.tocInput}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  updateIdea(selectedIdea.id, (draft) => {
                    draft.monitoring.tocInput = value
                    return draft
                  })
                }}
              />
            </label>

            <label className="field">
              <span>TOC Output (%)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.tocOutput}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  updateIdea(selectedIdea.id, (draft) => {
                    draft.monitoring.tocOutput = value
                    return draft
                  })
                }}
              />
            </label>

            <label className="field">
              <span>TOC Outcome (%)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.tocOutcome}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  updateIdea(selectedIdea.id, (draft) => {
                    draft.monitoring.tocOutcome = value
                    return draft
                  })
                }}
              />
            </label>

            <label className="field">
              <span>التدفق النقدي الداخل</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.cashIn}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  updateIdea(selectedIdea.id, (draft) => {
                    draft.monitoring.cashIn = value
                    return draft
                  })
                }}
              />
            </label>

            <label className="field">
              <span>التدفق النقدي الخارج</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.cashOut}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  updateIdea(selectedIdea.id, (draft) => {
                    draft.monitoring.cashOut = value
                    return draft
                  })
                }}
              />
            </label>

            <label className="field">
              <span>الاستثمار الأساسي</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={selectedIdea.monitoring.investment}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  updateIdea(selectedIdea.id, (draft) => {
                    draft.monitoring.investment = value
                    return draft
                  })
                }}
              />
            </label>
          </div>

          <div className="summary-grid mini">
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

    const completion = Math.round(
      (GOVERNANCE_CHECKLIST.filter((item) => selectedIdea.governance[item.id]).length /
        GOVERNANCE_CHECKLIST.length) *
        100,
    )

    return (
      <div className="view-stack">
        <section className="panel">
          <div className="panel-head">
            <h3>Governance & IP</h3>
            <span>{selectedIdea.id}</span>
          </div>

          <p className="lead">الحوكمة شرط إلزامي قبل الاعتماد الكامل أو التوسع المؤسسي.</p>

          <div className="governance-grid">
            {GOVERNANCE_CHECKLIST.map((item) => (
              <label key={item.id} className="gov-card">
                <div className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIdea.governance[item.id])}
                    onChange={() => handleToggleGovernance(item.id)}
                  />
                  <strong>{item.title}</strong>
                </div>
                <p>{item.note}</p>
              </label>
            ))}
          </div>

          <div className="summary-grid mini">
            <article>
              <p>اكتمال الحوكمة</p>
              <strong>{completion}%</strong>
            </article>
            <article>
              <p>بوابة الاعتماد</p>
              <strong>{selectedIdea.governance.gateApproved ? 'جاهزة' : 'غير جاهزة'}</strong>
            </article>
            <article>
              <p>IP Readiness</p>
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
              onChange={(event) => handleIpReadiness(event.target.value)}
            />
          </label>

          <div className="inline-actions wrap">
            <button className="btn primary" onClick={handleRequestIpProtection} disabled={!permissions.canGovernance}>
              رفع طلب حماية
            </button>
            <button className="btn" onClick={exportStageReport}>
              تقرير المرحلة
            </button>
          </div>

          {selectedIdea.governance.protectionNeeded ? (
            <p className="alert-item mid">
              تنبيه: يوصى بتفعيل مسار حماية الملكية الفكرية قبل اعتماد الفكرة.
            </p>
          ) : (
            <p className="alert-item good">لا يوجد طلب حماية IP حرج في الوقت الحالي.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Timeline</h3>
            <span>{selectedIdea.timeline.length} أحداث</span>
          </div>

          <ul className="list">
            {selectedIdea.timeline.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
                <small>{formatDate(event.at)}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  const renderKnowledge = () => {
    const stage = selectedIdea?.stage
    const linked = stage ? KNOWLEDGE_SHORTS.filter((item) => item.stage === stage) : KNOWLEDGE_SHORTS

    return (
      <div className="view-stack">
        <section className="panel">
          <div className="panel-head">
            <h3>Micro-Learning</h3>
            <span>2-3 دقائق</span>
          </div>
          <div className="knowledge-grid">
            {linked.map((item) => (
              <article key={item.id} className="knowledge-card">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <small>
                  المرحلة: {item.stage} | المدة: {item.duration}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>قوالب جاهزة</h3>
            <span>Canvas / Business Case / Checklist</span>
          </div>
          <div className="knowledge-grid">
            {KNOWLEDGE_TEMPLATES.map((item) => (
              <article key={item.id} className="knowledge-card">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <small>مرتبطة تلقائيًا بمرحلة الفكرة الحالية.</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  const renderAudit = () => {
    const logs = state.auditLog.slice(0, 150)

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
                  <td colSpan="6">لا يوجد نشاط بعد.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Innovation Shield {state.meta.version}</p>
          <h1>منصّة درع الابتكار - إعادة بناء قوية وجاهزة للتشغيل</h1>
          <p className="hero-text">
            إدارة دورة حياة الابتكار بشكل تنفيذي كامل: نضج، مخاطر، Workflow ديناميكي، Prototype
            Builder، Impact Simulator، حوكمة وملكية فكرية، وتقارير جاهزة للقيادات.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={startNewIdea}>
              ابدأ ابتكار جديد
            </button>
            <button className="btn" onClick={() => setActiveView('overview')}>
              الرؤية التنفيذية
            </button>
          </div>
        </div>

        <div className="hero-side">
          <article>
            <p>الإصدار</p>
            <strong>{state.meta.version}</strong>
          </article>
          <article>
            <p>فرق فعالة</p>
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
            <h3>تسجيل الدخول</h3>
            <span>Role-Based Access</span>
          </div>
          <p className="lead">سجل دخولك لبدء إدارة الابتكار على الفور.</p>

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
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="بحث ذكي: فكرة، مالك، مرحلة، حالة..."
                aria-label="بحث داخل المنصة"
              />
              <span className="badge">نتائج: {filteredIdeas.length}</span>
            </div>

            <button className="btn" onClick={() => setActiveView('lifecycle')}>
              فتح النتائج
            </button>
            <button className="btn" onClick={exportWeeklyReport}>
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

          <main>
            {activeView === 'overview' ? renderOverview() : null}
            {activeView === 'lifecycle' ? renderLifecycle() : null}
            {activeView === 'workflow' ? renderWorkflow() : null}
            {activeView === 'workspace' ? renderWorkspace() : null}
            {activeView === 'prototype' ? renderPrototype() : null}
            {activeView === 'impact' ? renderImpact() : null}
            {activeView === 'governance' ? renderGovernance() : null}
            {activeView === 'knowledge' ? renderKnowledge() : null}
            {activeView === 'audit' ? renderAudit() : null}
          </main>

          <button className="floating-cta" onClick={startNewIdea}>
            ابدأ ابتكار جديد
          </button>

          {renderOnboarding()}
        </>
      )}

      <footer className="platform-footer">
        <p>
          {state.meta.orgName} | الهدف الاستراتيجي: {state.meta.strategicGoal} | آخر تحديث:
          {' '}
          {formatDate(state.meta.lastUpdated)}
        </p>
      </footer>
    </div>
  )
}

export default App
