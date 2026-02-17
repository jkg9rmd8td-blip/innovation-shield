import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  BENCHMARK_CATALOG,
  DEFAULT_STATE,
  EXECUTIVE_SCOPE,
  PROTOTYPE_TEMPLATES,
  STAGES,
  STATUSES,
} from './innovationData'
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
  summarizeKPIs,
} from './engine'

const STORAGE_KEY = 'innovation_shield_v3_state'
const PROTOTYPE_UNLOCK_MATURITY = 70
const DECISION_PASS_THRESHOLD = 65

const VIEWS = [
  { id: 'summary', label: 'الملخص التنفيذي' },
  { id: 'map', label: 'خريطة الابتكار' },
  { id: 'workspace', label: 'Innovation Workspace' },
  { id: 'prototype', label: 'Prototype Builder' },
  { id: 'analytics', label: 'Impact & Benchmarking' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'knowledge', label: 'Knowledge Hub' },
]

const DECISION_CRITERIA = [
  { id: 'cost', label: 'التكلفة' },
  { id: 'time', label: 'الوقت' },
  { id: 'resources', label: 'الموارد' },
  { id: 'fit', label: 'الملاءمة' },
]

const DECISION_SCORE_OPTIONS = [1, 3, 9]

const SCAMPER_PROMPTS = [
  {
    id: 'S',
    title: 'Substitute / استبدال',
    prompt: 'ما العنصر الذي يمكن استبداله في {subject} لتقليل {issue}؟',
  },
  {
    id: 'C',
    title: 'Combine / دمج',
    prompt: 'ما الخدمة التي يمكن دمجها مع {subject} لرفع قيمة {audience}؟',
  },
  {
    id: 'A',
    title: 'Adapt / تكييف',
    prompt: 'كيف نكيف {subject} مع بيئة التجمع الصحي بالطائف بشكل أسرع؟',
  },
  {
    id: 'M',
    title: 'Modify / تعديل',
    prompt: 'ما التعديل الذي يجعل {subject} أبسط تنفيذًا وأعلى أثرًا؟',
  },
  {
    id: 'P',
    title: 'Put to another use / استخدام آخر',
    prompt: 'كيف نستخدم {subject} في سياق آخر يخدم {audience}؟',
  },
  {
    id: 'E',
    title: 'Eliminate / حذف',
    prompt: 'ما الخطوة التي يمكن حذفها من الرحلة الحالية لتقليل {issue}؟',
  },
  {
    id: 'R',
    title: 'Rearrange / عكس وإعادة ترتيب',
    prompt: 'كيف نعيد ترتيب التسلسل الحالي للخدمة لتحقيق نتيجة أسرع؟',
  },
]

const STORYBOARD_TEMPLATE = [
  { id: 'scene-1', title: 'المشهد 1: قبل التدخل', text: '' },
  { id: 'scene-2', title: 'المشهد 2: نقطة الألم', text: '' },
  { id: 'scene-3', title: 'المشهد 3: الحل المقترح', text: '' },
  { id: 'scene-4', title: 'المشهد 4: تجربة المستخدم', text: '' },
  { id: 'scene-5', title: 'المشهد 5: القياس', text: '' },
  { id: 'scene-6', title: 'المشهد 6: النتيجة المتوقعة', text: '' },
]

const MVP_CHECKLIST_TEMPLATE = [
  { id: 'mvp-1', text: 'تحديد الشريحة المستهدفة بوضوح', done: false },
  { id: 'mvp-2', text: 'صياغة القيمة المقترحة في جملة واحدة', done: false },
  { id: 'mvp-3', text: 'اختيار قناة اختبار (استبيان / Landing Page)', done: false },
  { id: 'mvp-4', text: 'تعريف KPI نجاح أولي قابل للقياس', done: false },
  { id: 'mvp-5', text: 'تحديد مدة الاختبار (7-14 يوم)', done: false },
  { id: 'mvp-6', text: 'توثيق قرار الاستمرار أو التعديل', done: false },
]

const KNOWLEDGE_TEMPLATES = [
  {
    id: 'knowledge-matrix',
    title: 'Decision Matrix Sheet',
    detail: 'قالب موزون لاختيار الفكرة الأعلى جدوى.',
    source: '5.pdf',
  },
  {
    id: 'knowledge-experiment',
    title: 'Experiment Card Form',
    detail: 'بطاقة اختبار الفرضيات ونتائج التعلم.',
    source: '12.pdf',
  },
  {
    id: 'knowledge-storyboard',
    title: 'Storyboard Canvas',
    detail: 'تصميم سيناريو الخدمة من البداية للنهاية.',
    source: '10.pdf',
  },
  {
    id: 'knowledge-mvp',
    title: 'MVP Checklist',
    detail: 'قائمة تحقق لبناء نموذج أولي قابل للاختبار.',
    source: '11.pdf',
  },
  {
    id: 'knowledge-pitch',
    title: 'Pitch Deck Auto-Template',
    detail: 'هيكل عرض تلقائي يدعم بوابة القرار.',
    source: '23.pdf',
  },
  {
    id: 'knowledge-bmc',
    title: 'Business Model Canvas',
    detail: 'مراجع السوق والقيمة والإيرادات من ملفات الخطة.',
    source: '21.pdf / 22.pdf',
  },
]

const DEFAULT_IDEA_FORM = {
  title: '',
  challengeType: 'تشغيلي',
  owner: '',
  organization: 'التجمع الصحي بالطائف',
  problem: '',
  solution: '',
  beneficiary: '',
  hypothesis: '',
}

const DEFAULT_IMPACT_ASSUMPTIONS = {
  baselineCost: 180,
  baselineMinutes: 22,
  transactionsPerYear: 1400,
  expectedCostReduction: 18,
  expectedTimeReduction: 24,
}

const TARGETS = {
  screeningRate: 30,
  experimentRate: 50,
  cycleTimeReduction: 40,
  mvpCount: 30,
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

function ensureNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function calcDecisionMatrixTotal(matrix) {
  const weights = matrix?.weights || {}
  const scores = matrix?.scores || {}

  let weightedScore = 0
  let maxScore = 0

  DECISION_CRITERIA.forEach((criterion) => {
    const weight = clamp(weights[criterion.id] ?? 3, 1, 5)
    const scoreValue = Number(scores[criterion.id])
    const score = DECISION_SCORE_OPTIONS.includes(scoreValue) ? scoreValue : 1

    weightedScore += weight * score
    maxScore += weight * 9
  })

  if (!maxScore) return 0
  return Math.round((weightedScore / maxScore) * 100)
}

function createDecisionMatrix(seedStage = 'الفكرة') {
  const baselineScores =
    STAGES.indexOf(seedStage) >= STAGES.indexOf('النموذج الأولي')
      ? { cost: 3, time: 3, resources: 3, fit: 9 }
      : { cost: 1, time: 1, resources: 1, fit: 3 }

  const matrix = {
    weights: {
      cost: 5,
      time: 4,
      resources: 3,
      fit: 5,
    },
    scores: baselineScores,
    total: 0,
    lastUpdated: null,
  }

  matrix.total = calcDecisionMatrixTotal(matrix)
  return matrix
}

function createExperimentCard(hypothesis = '') {
  return {
    testName: 'اختبار فرضية أولي',
    hypothesis,
    experimentDesign: '',
    dataToCollect: '',
    successCriteria: '',
    observation: '',
    learning: '',
    nextAction: '',
    evidenceName: '',
    evidenceLink: '',
    completed: false,
    completedAt: null,
  }
}

function createMonitoringRecord() {
  return {
    tocInput: 0,
    tocOutput: 0,
    tocOutcome: 0,
    cashIn: 0,
    cashOut: 0,
    investment: 250000,
    paybackMonths: 18,
    lastReview: null,
  }
}

function createPrototypeArtifacts() {
  return {
    storyboard: STORYBOARD_TEMPLATE.map((item) => ({ ...item })),
    mvpChecklist: MVP_CHECKLIST_TEMPLATE.map((item) => ({ ...item })),
  }
}

function normalizeInitiative(input) {
  const item = cloneInitiative(input || {})

  const wizard = {
    problem: item?.wizard?.problem || item.description || '',
    solution: item?.wizard?.solution || '',
    beneficiary: item?.wizard?.beneficiary || item.owner || '',
    hypothesis: item?.wizard?.hypothesis || '',
    completed:
      item?.wizard?.completed ??
      Boolean(
        (item?.wizard?.problem || item.description) &&
          (item?.wizard?.solution || item.title) &&
          (item?.wizard?.beneficiary || item.owner),
      ),
  }

  const decisionSeed = createDecisionMatrix(item.stage || 'الفكرة')
  const decisionMatrix = {
    ...decisionSeed,
    ...(item.decisionMatrix || {}),
    weights: {
      ...decisionSeed.weights,
      ...(item.decisionMatrix?.weights || {}),
    },
    scores: {
      ...decisionSeed.scores,
      ...(item.decisionMatrix?.scores || {}),
    },
  }
  decisionMatrix.total = calcDecisionMatrixTotal(decisionMatrix)

  const defaultExperiment = createExperimentCard(
    wizard.hypothesis || `نعتقد أن ${item.title || 'الحل'} سيخفف المشكلة الحالية.`,
  )
  const experiment = {
    ...defaultExperiment,
    ...(item.experiment || {}),
  }

  const forcedCompletion =
    Boolean(experiment.completed) ||
    item.stage === 'التطبيق' ||
    item.status === 'مطبق' ||
    item.status === 'معتمد'

  experiment.completed = forcedCompletion
  experiment.completedAt = experiment.completedAt || (forcedCompletion ? item.updatedAt : null)

  const defaultPrototype = createPrototypeArtifacts()
  const prototype = {
    template: PROTOTYPE_TEMPLATES[0].id,
    progress: 0,
    lastOutput: '',
    ...defaultPrototype,
    ...(item.prototype || {}),
    storyboard:
      Array.isArray(item.prototype?.storyboard) && item.prototype.storyboard.length
        ? item.prototype.storyboard
        : defaultPrototype.storyboard,
    mvpChecklist:
      Array.isArray(item.prototype?.mvpChecklist) && item.prototype.mvpChecklist.length
        ? item.prototype.mvpChecklist
        : defaultPrototype.mvpChecklist,
  }

  return {
    ...item,
    stage: item.stage || 'الفكرة',
    status: item.status || 'مسودة',
    description: item.description || 'مبادرة ابتكارية قيد البناء.',
    maturity: {
      clarity: 60,
      feasibility: 55,
      value: 65,
      readiness: 40,
      riskHandling: 45,
      ...(item.maturity || {}),
    },
    risk: {
      operational: 3,
      financial: 2,
      technical: 2,
      compliance: 2,
      ...(item.risk || {}),
    },
    prototype,
    impact: {
      costSaving: 0,
      timeSaving: 0,
      qualityImprovement: 0,
      satisfaction: 0,
      ...(item.impact || {}),
    },
    benchmark: {
      lastRun: null,
      ...(item.benchmark || {}),
      topMatches: Array.isArray(item.benchmark?.topMatches) ? item.benchmark.topMatches : [],
    },
    workspace: {
      tasks: Array.isArray(item.workspace?.tasks) ? item.workspace.tasks : [],
      comments: Array.isArray(item.workspace?.comments) ? item.workspace.comments : [],
    },
    wizard,
    decisionMatrix,
    experiment,
    monitoring: {
      ...createMonitoringRecord(),
      ...(item.monitoring || {}),
    },
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  }
}

function normalizeState(input) {
  const seed = cloneInitiative(DEFAULT_STATE)
  const state = cloneInitiative(input || {})

  const initiativesRaw =
    Array.isArray(state.initiatives) && state.initiatives.length
      ? state.initiatives
      : seed.initiatives

  return {
    ...seed,
    ...state,
    meta: {
      ...seed.meta,
      ...(state.meta || {}),
      lastUpdated: state?.meta?.lastUpdated || new Date().toISOString(),
    },
    engagement: {
      ...seed.engagement,
      ...(state.engagement || {}),
    },
    initiatives: initiativesRaw.map(normalizeInitiative),
  }
}

function loadState() {
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  if (!fromStorage) return normalizeState(DEFAULT_STATE)

  const parsed = safeParse(fromStorage, normalizeState(DEFAULT_STATE))
  if (!Array.isArray(parsed?.initiatives) || !parsed.initiatives.length) {
    return normalizeState(DEFAULT_STATE)
  }

  return normalizeState(parsed)
}

function readinessTag(value) {
  if (value >= 80) return { label: 'جاهز', tone: 'good' }
  if (value >= 40) return { label: 'قيد التطوير', tone: 'mid' }
  return { label: 'يحتاج تركيز', tone: 'bad' }
}

function scoreTag(value) {
  if (value >= DECISION_PASS_THRESHOLD) return { label: 'اجتاز الفرز', tone: 'good' }
  if (value >= 45) return { label: 'يحتاج تحسين', tone: 'mid' }
  return { label: 'منخفض', tone: 'bad' }
}

function formatMillions(value) {
  const number = Number(value) || 0
  if (number >= 1000000) return `${(number / 1000000).toFixed(2)}M`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return formatNumber(number)
}

function buildScamperSuggestions(form) {
  const subject = form.solution.trim() || 'الحل المقترح'
  const issue = form.problem.trim() || 'التحدي الحالي'
  const audience = form.beneficiary.trim() || 'المستفيد'

  return SCAMPER_PROMPTS.map((item) => ({
    id: item.id,
    title: item.title,
    text: item.prompt
      .replace('{subject}', subject)
      .replace('{issue}', issue)
      .replace('{audience}', audience),
  }))
}

function isPrototypeUnlocked(initiative) {
  const maturity = calcMaturity(initiative)
  const score = calcDecisionMatrixTotal(initiative?.decisionMatrix)
  return Boolean(initiative?.wizard?.completed) && maturity >= PROTOTYPE_UNLOCK_MATURITY && score >= DECISION_PASS_THRESHOLD
}

function isFinalGateStatus(status) {
  return ['قيد التحكيم', 'معتمد', 'مطبق'].includes(status)
}

function App() {
  const [state, setState] = useState(loadState)
  const [activeView, setActiveView] = useState('summary')
  const [selectedId, setSelectedId] = useState(state.initiatives[0]?.id || null)
  const [newIdea, setNewIdea] = useState(DEFAULT_IDEA_FORM)
  const [wizardExperiment, setWizardExperiment] = useState(createExperimentCard(''))
  const [wizardExperimentOpen, setWizardExperimentOpen] = useState(false)
  const [wizardScamper, setWizardScamper] = useState([])
  const [searchText, setSearchText] = useState('')
  const [taskInput, setTaskInput] = useState('')
  const [commentInput, setCommentInput] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('صاحب المبادرة')
  const [prototypeTemplate, setPrototypeTemplate] = useState(PROTOTYPE_TEMPLATES[0].id)
  const [impactAssumptions, setImpactAssumptions] = useState(DEFAULT_IMPACT_ASSUMPTIONS)
  const [latestImpact, setLatestImpact] = useState(null)
  const [benchmarkInfo, setBenchmarkInfo] = useState('')
  const [flowMessage, setFlowMessage] = useState('')

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!flowMessage) return undefined
    const timeout = window.setTimeout(() => setFlowMessage(''), 6000)
    return () => window.clearTimeout(timeout)
  }, [flowMessage])

  const selected = useMemo(
    () =>
      state.initiatives.find((item) => item.id === selectedId) ||
      state.initiatives[0] ||
      null,
    [selectedId, state.initiatives],
  )

  const kpis = useMemo(() => summarizeKPIs(state.initiatives), [state.initiatives])

  const wizardProgress = useMemo(() => {
    const done = ['problem', 'solution', 'beneficiary'].filter(
      (field) => newIdea[field].trim().length > 0,
    ).length

    return {
      done,
      total: 3,
      percent: Math.round((done / 3) * 100),
    }
  }, [newIdea])

  const decisionRanking = useMemo(() => {
    return [...state.initiatives]
      .map((item) => ({
        ...item,
        decisionTotal: calcDecisionMatrixTotal(item.decisionMatrix),
      }))
      .sort((a, b) => b.decisionTotal - a.decisionTotal)
  }, [state.initiatives])

  const scopeReadiness = useMemo(() => {
    const initiatives = state.initiatives
    const total = Math.max(1, initiatives.length)

    const withPrototype = initiatives.filter((item) => (item.prototype?.progress || 0) > 0).length
    const workspaceActive = initiatives.filter((item) => {
      const tasks = item.workspace?.tasks?.length || 0
      const comments = item.workspace?.comments?.length || 0
      return tasks + comments > 0
    }).length
    const impactActive = initiatives.filter(
      (item) => Number(item.impact?.costSaving || 0) > 0 || Number(item.impact?.timeSaving || 0) > 0,
    ).length
    const benchmarked = initiatives.filter((item) => (item.benchmark?.topMatches?.length || 0) > 0).length
    const analyticsReady = initiatives.filter(
      (item) => item.title && item.owner && item.organization && item.stage && item.status,
    ).length

    const rewardsSignal = Math.round(
      Math.min(100, (state.engagement.points / (total * 12)) * 100),
    )

    const marketplaceReady = initiatives.filter(
      (item) => item.status === 'معتمد' || item.status === 'مطبق',
    ).length

    const experimentCoverage = initiatives.filter((item) => item.experiment?.completed).length

    const governanceAvg =
      initiatives.length > 0
        ? Math.round(
            initiatives.reduce((sum, item) => sum + Number(item.risk?.compliance || 0), 0) /
              initiatives.length,
          )
        : 0
    const governanceCoverage = Math.round(
      Math.max(
        0,
        Math.min(100, (marketplaceReady / total) * 55 + (100 - governanceAvg * 20) * 0.45),
      ),
    )

    return {
      workspace: Math.round((workspaceActive / total) * 100),
      maturity: kpis.avgMaturity,
      prototype_builder: Math.round((withPrototype / total) * 100),
      impact: Math.round(((impactActive / total) * 60 + (experimentCoverage / total) * 40)),
      analytics: Math.round((analyticsReady / total) * 100),
      marketplace: Math.round((marketplaceReady / total) * 100),
      benchmarking: Math.round((benchmarked / total) * 100),
      rewards: rewardsSignal,
      governance: governanceCoverage,
    }
  }, [kpis.avgMaturity, state.engagement.points, state.initiatives])

  const filteredInitiatives = useMemo(() => {
    const text = searchText.trim().toLowerCase()
    if (!text) return state.initiatives

    return state.initiatives.filter((item) => {
      const bag = `${item.id} ${item.title} ${item.owner} ${item.organization} ${item.challengeType} ${item.stage} ${item.status} ${item.description}`.toLowerCase()
      return bag.includes(text)
    })
  }, [searchText, state.initiatives])

  const initiativesByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = filteredInitiatives.filter((item) => item.stage === stage)
      return acc
    }, {})
  }, [filteredInitiatives])

  const successMetrics = useMemo(() => {
    const total = Math.max(1, state.initiatives.length)

    const screeningRate = Math.round(
      (state.initiatives.filter((item) => calcDecisionMatrixTotal(item.decisionMatrix) >= DECISION_PASS_THRESHOLD).length /
        total) *
        100,
    )

    const experimentRate = Math.round(
      (state.initiatives.filter((item) => item.experiment?.completed).length / total) * 100,
    )

    const finalized = state.initiatives.filter(
      (item) => item.status === 'معتمد' || item.status === 'مطبق',
    )

    const averageCycleDays =
      finalized.length > 0
        ? Math.round(
            finalized.reduce((sum, item) => {
              const created = new Date(item.createdAt).getTime()
              const updated = new Date(item.updatedAt).getTime()
              if (Number.isNaN(created) || Number.isNaN(updated) || updated < created) return sum
              return sum + Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)))
            }, 0) / finalized.length,
          )
        : 0

    const mvpCount = state.initiatives.filter((item) => (item.prototype?.progress || 0) >= 60).length

    return {
      screeningRate,
      experimentRate,
      averageCycleDays,
      mvpCount,
    }
  }, [state.initiatives])

  const updateInitiative = (id, updater) => {
    setState((prev) => {
      const nextInitiatives = prev.initiatives.map((item) => {
        if (item.id !== id) return item
        const draft = normalizeInitiative(item)
        const updated = updater(draft) || draft

        return normalizeInitiative({
          ...updated,
          updatedAt: new Date().toISOString(),
        })
      })

      return {
        ...prev,
        initiatives: nextInitiatives,
        meta: {
          ...prev.meta,
          lastUpdated: new Date().toISOString(),
        },
      }
    })
  }

  const promoteEngagement = (extraPoints = 1, extraContributors = 0) => {
    setState((prev) => ({
      ...prev,
      engagement: {
        points: Math.max(0, Number(prev.engagement.points || 0) + extraPoints),
        contributors: Math.max(0, Number(prev.engagement.contributors || 0) + extraContributors),
      },
      meta: {
        ...prev.meta,
        lastUpdated: new Date().toISOString(),
      },
    }))
  }

  const handleCreateInitiative = () => {
    if (!newIdea.title.trim()) {
      setFlowMessage('أدخل عنوان الابتكار أولاً.')
      return
    }

    if (wizardProgress.done < 3) {
      setFlowMessage('أكمل خطوات الـ Wizard الأساسية: المشكلة، الحل، المستفيد.')
      return
    }

    const now = new Date().toISOString()
    const decisionMatrix = createDecisionMatrix('التقييم')
    const mergedExperiment = {
      ...createExperimentCard(
        newIdea.hypothesis.trim() || `نعتقد أن ${newIdea.solution.trim()} سيحل ${newIdea.problem.trim()}`,
      ),
      ...wizardExperiment,
      hypothesis:
        wizardExperiment.hypothesis.trim() ||
        newIdea.hypothesis.trim() ||
        `نعتقد أن ${newIdea.solution.trim()} سيحل ${newIdea.problem.trim()}`,
    }

    const prototypeArtifacts = createPrototypeArtifacts()

    const item = normalizeInitiative({
      id: newId('IS'),
      title: newIdea.title.trim(),
      challengeType: newIdea.challengeType,
      owner: newIdea.owner.trim() || 'فريق الابتكار',
      organization: newIdea.organization.trim() || 'التجمع الصحي بالطائف',
      stage: 'التقييم',
      status: 'قيد الدراسة',
      description: `المشكلة: ${newIdea.problem.trim()} | الحل: ${newIdea.solution.trim()}`,
      wizard: {
        problem: newIdea.problem.trim(),
        solution: newIdea.solution.trim(),
        beneficiary: newIdea.beneficiary.trim(),
        hypothesis: mergedExperiment.hypothesis,
        completed: true,
      },
      decisionMatrix,
      maturity: {
        clarity: 72,
        feasibility: 64,
        value: 74,
        readiness: 48,
        riskHandling: 52,
      },
      risk: {
        operational: 3,
        financial: 2,
        technical: 2,
        compliance: 2,
      },
      prototype: {
        template: PROTOTYPE_TEMPLATES[0].id,
        progress: 12,
        lastOutput: '',
        storyboard: prototypeArtifacts.storyboard,
        mvpChecklist: prototypeArtifacts.mvpChecklist,
      },
      experiment: mergedExperiment,
      monitoring: createMonitoringRecord(),
      impact: {
        costSaving: 0,
        timeSaving: 0,
        qualityImprovement: 0,
        satisfaction: 0,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      workspace: {
        tasks: [
          {
            id: newId('TSK'),
            text: 'تشغيل Decision Matrix وتحديث الدرجات',
            done: false,
          },
          {
            id: newId('TSK'),
            text: 'تنفيذ Experiment Card ورفع الدليل',
            done: false,
          },
        ],
        comments: [],
      },
      createdAt: now,
      updatedAt: now,
    })

    setState((prev) => ({
      ...prev,
      initiatives: [item, ...prev.initiatives],
      engagement: {
        points: Number(prev.engagement.points || 0) + 4,
        contributors: Number(prev.engagement.contributors || 0) + 1,
      },
      meta: {
        ...prev.meta,
        lastUpdated: now,
      },
    }))

    setNewIdea(DEFAULT_IDEA_FORM)
    setWizardExperiment(createExperimentCard(''))
    setWizardExperimentOpen(false)
    setWizardScamper([])
    setSelectedId(item.id)
    setActiveView('map')
    setFlowMessage('تم إنشاء الابتكار وتحويله تلقائيًا إلى Decision Matrix.')
  }

  const handleGenerateWizardScamper = () => {
    if (wizardProgress.done < 2) {
      setFlowMessage('أكمل المشكلة والحل على الأقل لتفعيل مساعد SCAMPER.')
      return
    }

    const suggestions = buildScamperSuggestions(newIdea)
    setWizardScamper(suggestions)
    promoteEngagement(1)
    setFlowMessage('تم توليد اقتراحات SCAMPER بناءً على مدخلاتك.')
  }

  const handleOpenWizardExperiment = () => {
    setWizardExperimentOpen((prev) => {
      const next = !prev
      if (next) {
        setWizardExperiment((previous) => ({
          ...previous,
          hypothesis:
            previous.hypothesis ||
            newIdea.hypothesis.trim() ||
            `نعتقد أن ${newIdea.solution.trim() || 'الحل المقترح'} سيحل ${newIdea.problem.trim() || 'المشكلة'}`,
        }))
      }
      return next
    })
  }

  const handleDecisionMatrixChange = (criterionId, type, value) => {
    if (!selected) return

    updateInitiative(selected.id, (draft) => {
      const matrix = {
        ...createDecisionMatrix(draft.stage),
        ...(draft.decisionMatrix || {}),
        weights: {
          ...createDecisionMatrix(draft.stage).weights,
          ...(draft.decisionMatrix?.weights || {}),
        },
        scores: {
          ...createDecisionMatrix(draft.stage).scores,
          ...(draft.decisionMatrix?.scores || {}),
        },
      }

      if (type === 'weights') {
        matrix.weights[criterionId] = clamp(value, 1, 5)
      }

      if (type === 'scores') {
        const safeScore = DECISION_SCORE_OPTIONS.includes(Number(value)) ? Number(value) : 1
        matrix.scores[criterionId] = safeScore
      }

      matrix.total = calcDecisionMatrixTotal(matrix)
      matrix.lastUpdated = new Date().toISOString()
      draft.decisionMatrix = matrix
      return draft
    })
  }

  const handleApplyDecisionMatrix = () => {
    if (!selected) return

    const score = calcDecisionMatrixTotal(selected.decisionMatrix)

    updateInitiative(selected.id, (draft) => {
      const stageIndex = STAGES.indexOf(draft.stage)
      const prototypeIndex = STAGES.indexOf('النموذج الأولي')

      if (score >= DECISION_PASS_THRESHOLD && stageIndex < prototypeIndex) {
        draft.stage = 'النموذج الأولي'
        draft.status = 'قيد التطوير'
        draft.maturity.readiness = Math.min(100, Number(draft.maturity.readiness || 0) + 12)
      }

      if (score < DECISION_PASS_THRESHOLD && stageIndex < STAGES.indexOf('النموذج الأولي')) {
        draft.stage = 'التقييم'
        if (draft.status === 'مسودة') {
          draft.status = 'قيد الدراسة'
        }
      }

      return draft
    })

    promoteEngagement(2)

    if (score >= DECISION_PASS_THRESHOLD) {
      setFlowMessage('النتيجة اجتازت الفرز. تم فتح مسار النموذج الأولي.')
      return
    }

    setFlowMessage('النتيجة تحتاج تحسين قبل الانتقال إلى النموذج الأولي.')
  }

  const handleAddTask = () => {
    if (!selected || !taskInput.trim()) return
    updateInitiative(selected.id, (draft) => {
      draft.workspace.tasks.unshift({
        id: newId('TSK'),
        text: taskInput.trim(),
        done: false,
      })
      return draft
    })
    setTaskInput('')
    promoteEngagement(1)
  }

  const handleToggleTask = (taskId) => {
    if (!selected) return
    updateInitiative(selected.id, (draft) => {
      draft.workspace.tasks = draft.workspace.tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      )
      return draft
    })
    promoteEngagement(1)
  }

  const handleAddComment = () => {
    if (!selected || !commentInput.trim()) return
    updateInitiative(selected.id, (draft) => {
      draft.workspace.comments.unshift({
        id: newId('COM'),
        author: commentAuthor.trim() || 'صاحب المبادرة',
        text: commentInput.trim(),
        at: new Date().toISOString(),
      })
      return draft
    })
    setCommentInput('')
    promoteEngagement(1)
  }

  const handleExperimentChange = (field, value) => {
    if (!selected) return

    updateInitiative(selected.id, (draft) => {
      draft.experiment = {
        ...createExperimentCard(draft.wizard?.hypothesis || ''),
        ...(draft.experiment || {}),
        [field]: value,
      }
      return draft
    })
  }

  const handleSaveExperimentProgress = () => {
    if (!selected) return
    setFlowMessage('تم حفظ بطاقة الاختبار والتعلم.')
    promoteEngagement(1)
  }

  const handleCompleteExperiment = () => {
    if (!selected) return

    const card = selected.experiment || createExperimentCard(selected.wizard?.hypothesis || '')
    const required = [
      card.hypothesis,
      card.experimentDesign,
      card.dataToCollect,
      card.successCriteria,
      card.evidenceName,
    ]

    if (required.some((value) => !String(value || '').trim())) {
      setFlowMessage('بطاقة الاختبار ناقصة. أكمل الفرضية، التجربة، البيانات، معيار النجاح، والدليل.')
      return
    }

    updateInitiative(selected.id, (draft) => {
      draft.experiment.completed = true
      draft.experiment.completedAt = new Date().toISOString()

      if (STAGES.indexOf(draft.stage) < STAGES.indexOf('التجربة')) {
        draft.stage = 'التجربة'
      }

      if (draft.status === 'قيد الدراسة') {
        draft.status = 'قيد التطوير'
      }

      return draft
    })

    promoteEngagement(3)
    setFlowMessage('تم اعتماد Experiment Card. يمكنك الآن التقدم للتقييم النهائي.')
  }

  const handleStoryboardChange = (sceneId, value) => {
    if (!selected) return

    updateInitiative(selected.id, (draft) => {
      draft.prototype.storyboard = (draft.prototype.storyboard || STORYBOARD_TEMPLATE).map((scene) =>
        scene.id === sceneId ? { ...scene, text: value } : scene,
      )
      return draft
    })
  }

  const handleToggleMvpChecklist = (itemId) => {
    if (!selected) return

    updateInitiative(selected.id, (draft) => {
      draft.prototype.mvpChecklist = (draft.prototype.mvpChecklist || MVP_CHECKLIST_TEMPLATE).map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      )
      return draft
    })
  }

  const handleGeneratePrototype = () => {
    if (!selected) return

    if (!isPrototypeUnlocked(selected)) {
      setFlowMessage('فتح Prototype Builder يتطلب: Wizard مكتمل + Decision Matrix ناجح + نضج >= 70%.')
      return
    }

    const template = PROTOTYPE_TEMPLATES.find((item) => item.id === prototypeTemplate)
    const output = buildPitchDeck(selected, template)

    updateInitiative(selected.id, (draft) => {
      draft.prototype.template = prototypeTemplate
      draft.prototype.progress = Math.min(100, Number(draft.prototype.progress || 0) + 12)
      draft.prototype.lastOutput = output

      if (STAGES.indexOf(draft.stage) < STAGES.indexOf('النموذج الأولي')) {
        draft.stage = 'النموذج الأولي'
      }
      if (draft.status === 'مسودة' || draft.status === 'قيد الدراسة') {
        draft.status = 'قيد التطوير'
      }

      return draft
    })

    promoteEngagement(4)
    setFlowMessage('تم توليد Pitch Deck وتحديث تقدم النموذج الأولي.')
  }

  const handleRunImpact = () => {
    if (!selected) return
    const result = simulateImpact(selected, impactAssumptions)
    setLatestImpact(result)

    updateInitiative(selected.id, (draft) => {
      draft.impact.costSaving = result.annualSaving
      draft.impact.timeSaving = result.expectedTimeReduction
      draft.impact.qualityImprovement = result.qualityLift
      draft.impact.satisfaction = result.satisfactionLift
      return draft
    })

    promoteEngagement(3)
  }

  const handleRunBenchmark = () => {
    if (!selected) return
    const matches = benchmarkInitiative(selected, BENCHMARK_CATALOG)

    updateInitiative(selected.id, (draft) => {
      draft.benchmark.topMatches = matches
      draft.benchmark.lastRun = new Date().toISOString()
      return draft
    })

    setBenchmarkInfo(`تمت المقارنة على ${matches.length} حلول عالمية.`)
    promoteEngagement(2)
  }

  const handleMonitoringChange = (field, value) => {
    if (!selected) return

    updateInitiative(selected.id, (draft) => {
      draft.monitoring = {
        ...createMonitoringRecord(),
        ...(draft.monitoring || {}),
        [field]: ensureNumber(value, 0),
      }
      return draft
    })
  }

  const handleSaveMonitoring = () => {
    if (!selected) return

    updateInitiative(selected.id, (draft) => {
      draft.monitoring.lastReview = new Date().toISOString()
      return draft
    })

    setFlowMessage('تم حفظ مراجعة Post-Implementation Monitoring.')
    promoteEngagement(2)
  }

  const handleStageChange = (initiativeId, nextStage) => {
    const item = state.initiatives.find((row) => row.id === initiativeId)
    if (!item) return

    if ((nextStage === 'الاعتماد' || nextStage === 'التطبيق') && !item.experiment?.completed) {
      setFlowMessage('لا يمكن الانتقال للتقييم النهائي أو التطبيق قبل اعتماد Experiment Card.')
      return
    }

    if (nextStage === 'النموذج الأولي' && !isPrototypeUnlocked(item)) {
      setFlowMessage('لا يمكن فتح مرحلة النموذج الأولي قبل تحقيق شروط الجاهزية.')
      return
    }

    updateInitiative(initiativeId, (draft) => {
      draft.stage = nextStage
      if (nextStage === 'الاعتماد' && draft.status === 'قيد التطوير') {
        draft.status = 'قيد التحكيم'
      }
      if (nextStage === 'التطبيق') {
        draft.status = 'مطبق'
      }
      return draft
    })
  }

  const handleStatusChange = (initiativeId, nextStatus) => {
    const item = state.initiatives.find((row) => row.id === initiativeId)
    if (!item) return

    if (isFinalGateStatus(nextStatus) && !item.experiment?.completed) {
      setFlowMessage('هذه الحالة تتطلب إكمال Experiment Card أولاً.')
      return
    }

    updateInitiative(initiativeId, (draft) => {
      draft.status = nextStatus
      return draft
    })
  }

  const handlePublishToMarketplace = (initiativeId) => {
    const item = state.initiatives.find((row) => row.id === initiativeId)
    if (!item) return

    if (!item.experiment?.completed) {
      setFlowMessage('النشر في السوق يتطلب بطاقة اختبار مكتملة.')
      return
    }

    updateInitiative(initiativeId, (draft) => {
      draft.stage = 'التطبيق'
      draft.status = 'مطبق'
      return draft
    })

    setFlowMessage('تم نشر الابتكار في Marketplace.')
    promoteEngagement(2)
  }

  const renderSummary = () => {
    const scopeCards = EXECUTIVE_SCOPE.map((module) => {
      const value = scopeReadiness[module.id] || 0
      const readiness = readinessTag(value)
      return {
        ...module,
        value,
        readiness,
      }
    })

    const overallReadiness = Math.round(
      scopeCards.reduce((sum, card) => sum + card.value, 0) / scopeCards.length,
    )

    const readyUnits = scopeCards.filter((card) => card.value >= 80).length
    const inProgressUnits = scopeCards.filter(
      (card) => card.value >= 40 && card.value < 80,
    ).length
    const inactiveUnits = scopeCards.filter((card) => card.value < 40).length

    const latestInnovationsRaw = [...state.initiatives]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)

    const placeholders = [
      {
        id: 'PL-1',
        title: 'ابتكار قيد الإضافة',
        organization: 'التجمع الصحي بالطائف',
        status: 'قيد التحديث',
      },
      {
        id: 'PL-2',
        title: 'ابتكار جديد',
        organization: 'إدارة التحول',
        status: 'قيد المراجعة',
      },
      {
        id: 'PL-3',
        title: 'نموذج أولي جديد',
        organization: 'إدارة الجودة',
        status: 'قيد البناء',
      },
    ]

    const latestInnovations = [...latestInnovationsRaw, ...placeholders].slice(0, 3)

    const journeySteps = [
      'Idea',
      'Evaluation',
      'Prototype',
      'Simulation',
      'Marketplace',
      'Adoption',
    ]

    return (
      <div className="summary-stack">
        <section className="view-grid summary-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>Executive Summary</h3>
              <span>{state.meta.orgName}</span>
            </div>

            <p className="executive-brief">
              منصة درع الابتكار V3 هي منظومة ابتكار مؤسسية متكاملة تهدف إلى رفع جودة الأفكار،
              تسريع التقييم، وتمكين النماذج الأولية داخل التجمع الصحي بالطائف.
            </p>

            <div className="readiness-overview">
              <article>
                <p>جاهزية المنصة</p>
                <strong>{overallReadiness}%</strong>
              </article>
              <article>
                <p>الوحدات الجاهزة</p>
                <strong>{readyUnits}</strong>
              </article>
              <article>
                <p>قيد التطوير</p>
                <strong>{inProgressUnits}</strong>
              </article>
              <article>
                <p>غير مفعلة</p>
                <strong>{inactiveUnits}</strong>
              </article>
            </div>

            <div className="chip-row">
              <span className="chip good">الجاهزية الكلية: {overallReadiness}%</span>
              <span className="chip mid">رؤية {state.meta.visionYear}</span>
              <span className="chip">الإصدار: {state.meta.appVersion}</span>
            </div>

            <button
              className="btn primary cta-button"
              onClick={() => {
                if (!selectedId && state.initiatives[0]?.id) {
                  setSelectedId(state.initiatives[0].id)
                }
                setActiveView('workspace')
              }}
            >
              ابدأ رحلتك الابتكارية الآن
            </button>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>الوحدات حسب الأولوية</h3>
              <span>من الفكرة إلى التطبيق</span>
            </div>
            <div className="scope-grid">
              {scopeCards.map((card) => (
                <article key={card.id} className={`scope-card ${card.readiness.tone}`}>
                  <div className="scope-top">
                    <strong>{card.title}</strong>
                    <span className={`badge ${card.readiness.tone}`}>{card.readiness.label}</span>
                  </div>
                  <p>{card.note}</p>
                  <div className="scope-foot">
                    <b>{card.value}%</b>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="view-grid summary-extra-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>أثر الابتكار</h3>
              <span>Innovation Impact</span>
            </div>
            <div className="impact-kpi-grid">
              <article>
                <p>نضج الابتكار</p>
                <strong>{kpis.avgMaturity}%</strong>
              </article>
              <article>
                <p>الوفر المالي</p>
                <strong>{formatMillions(kpis.annualSaving)}</strong>
              </article>
              <article>
                <p>المخاطر</p>
                <strong>{kpis.avgRisk}%</strong>
              </article>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Innovation Journey</h3>
              <span>خارطة مسار مبسطة</span>
            </div>
            <div className="journey-strip">
              {journeySteps.map((step, index) => (
                <div key={step} className="journey-step">
                  <span>{step}</span>
                  {index < journeySteps.length - 1 ? <small>→</small> : null}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>مقاييس نجاح التحسينات</h3>
            <span>مرتبط بالأهداف التشغيلية</span>
          </div>
          <div className="success-grid">
            <article>
              <p>اجتياز الفرز الأولي</p>
              <strong>{successMetrics.screeningRate}%</strong>
              <small>الهدف: +{TARGETS.screeningRate}%</small>
            </article>
            <article>
              <p>تنفيذ Experiment Card</p>
              <strong>{successMetrics.experimentRate}%</strong>
              <small>الهدف: ≥{TARGETS.experimentRate}%</small>
            </article>
            <article>
              <p>زمن القرار النهائي</p>
              <strong>{successMetrics.averageCycleDays || '—'} يوم</strong>
              <small>الهدف: -{TARGETS.cycleTimeReduction}%</small>
            </article>
            <article>
              <p>عدد MVPs</p>
              <strong>{successMetrics.mvpCount}</strong>
              <small>الهدف السنوي: {TARGETS.mvpCount}</small>
            </article>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>أحدث الابتكارات</h3>
            <span>Latest 3</span>
          </div>
          <div className="latest-grid">
            {latestInnovations.map((item) => (
              <article key={item.id} className="latest-card">
                <strong>{item.title}</strong>
                <p>الجهة: {item.organization}</p>
                <span className="badge">{item.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Innovation Toolkit (من الملفات المرفوعة)</h3>
            <span>{METHOD_TOOLKIT.length} أداة</span>
          </div>
          <div className="toolkit-grid">
            {METHOD_TOOLKIT.map((tool) => (
              <article key={tool.id} className="toolkit-card">
                <div className="toolkit-head">
                  <strong>{tool.title}</strong>
                  <span className="badge">{tool.stage}</span>
                </div>
                <p>{tool.purpose}</p>
                <div className="toolkit-meta">
                  <small>Source: {tool.source}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>خطوات تنفيذ فورية</h3>
            <span>Roadmap</span>
          </div>
          <ol className="action-roadmap">
            <li>اعتماد Experiment Card داخل الـ Wizard كخطوة إلزامية.</li>
            <li>تفعيل Decision Matrix كفرز أولي قبل الانتقال للنموذج الأولي.</li>
            <li>تشغيل قوالب Storyboard + MVP + Pitch Deck تلقائيًا.</li>
            <li>تنفيذ جلسات اختبار مستخدمين أسبوعية على رحلة التسجيل الجديدة.</li>
          </ol>
        </section>
      </div>
    )
  }

  const renderMap = () => {
    const selectedMatrix = selected?.decisionMatrix || createDecisionMatrix('الفكرة')
    const selectedScore = calcDecisionMatrixTotal(selectedMatrix)
    const selectedScoreMeta = scoreTag(selectedScore)

    return (
      <section className="view-grid map-grid">
        <div className="map-side-stack">
          <article className="panel create-panel">
            <div className="panel-head">
              <h3>Wizard: ابتكار جديد</h3>
              <span>{wizardProgress.percent}%</span>
            </div>

            <div className="wizard-stepper">
              <span className={`step-chip ${newIdea.problem.trim() ? 'done' : ''}`}>1) المشكلة</span>
              <span className={`step-chip ${newIdea.solution.trim() ? 'done' : ''}`}>2) الحل</span>
              <span className={`step-chip ${newIdea.beneficiary.trim() ? 'done' : ''}`}>3) المستفيد</span>
            </div>

            <label className="field">
              <span>عنوان الابتكار</span>
              <input
                value={newIdea.title}
                onChange={(event) =>
                  setNewIdea((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="مثال: منصة فرز ذكية للتحويلات"
              />
            </label>

            <label className="field">
              <span>التصنيف</span>
              <select
                value={newIdea.challengeType}
                onChange={(event) =>
                  setNewIdea((prev) => ({ ...prev, challengeType: event.target.value }))
                }
              >
                <option>تشغيلي</option>
                <option>تقني</option>
                <option>تجربة مريض</option>
                <option>جودة</option>
                <option>موارد بشرية</option>
                <option>مالي</option>
              </select>
            </label>

            <label className="field">
              <span>المالك</span>
              <input
                value={newIdea.owner}
                onChange={(event) => setNewIdea((prev) => ({ ...prev, owner: event.target.value }))}
                placeholder="اسم الفريق أو المالك"
              />
            </label>

            <label className="field">
              <span>1) ما المشكلة؟</span>
              <textarea
                rows={3}
                value={newIdea.problem}
                onChange={(event) => setNewIdea((prev) => ({ ...prev, problem: event.target.value }))}
                placeholder="اكتب المشكلة بشكل قابل للقياس"
              />
            </label>

            <label className="field">
              <span>2) ما الحل المختصر؟</span>
              <textarea
                rows={3}
                value={newIdea.solution}
                onChange={(event) => setNewIdea((prev) => ({ ...prev, solution: event.target.value }))}
                placeholder="وصف قصير للحل المقترح"
              />
            </label>

            <label className="field">
              <span>3) من المستفيد؟</span>
              <input
                value={newIdea.beneficiary}
                onChange={(event) =>
                  setNewIdea((prev) => ({ ...prev, beneficiary: event.target.value }))
                }
                placeholder="مثل: فرق الطوارئ، المرضى، الطواقم السريرية"
              />
            </label>

            <label className="field">
              <span>الفرضية الرئيسية</span>
              <input
                value={newIdea.hypothesis}
                onChange={(event) =>
                  setNewIdea((prev) => ({ ...prev, hypothesis: event.target.value }))
                }
                placeholder="نعتقد أن ..."
              />
            </label>

            <div className="inline-actions">
              <button className="btn" onClick={handleGenerateWizardScamper}>
                مساعد AI: صياغة/SCAMPER
              </button>
              <button className="btn ghost" onClick={handleOpenWizardExperiment}>
                اختبر فرضيتك
              </button>
            </div>

            {wizardScamper.length ? (
              <div className="scamper-list">
                {wizardScamper.map((item) => (
                  <article key={item.id} className="scamper-card">
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {wizardExperimentOpen ? (
              <div className="wizard-experiment-box">
                <div className="panel-head">
                  <h3>Experiment Card (Template)</h3>
                  <span>12.pdf</span>
                </div>

                <label className="field">
                  <span>اسم الاختبار</span>
                  <input
                    value={wizardExperiment.testName}
                    onChange={(event) =>
                      setWizardExperiment((prev) => ({ ...prev, testName: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>الفرضية</span>
                  <textarea
                    rows={2}
                    value={wizardExperiment.hypothesis}
                    onChange={(event) =>
                      setWizardExperiment((prev) => ({ ...prev, hypothesis: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>التجربة المقترحة</span>
                  <input
                    value={wizardExperiment.experimentDesign}
                    onChange={(event) =>
                      setWizardExperiment((prev) => ({ ...prev, experimentDesign: event.target.value }))
                    }
                    placeholder="مثال: استبيان + صفحة هبوط"
                  />
                </label>

                <label className="field">
                  <span>المعيار المثبت</span>
                  <input
                    value={wizardExperiment.successCriteria}
                    onChange={(event) =>
                      setWizardExperiment((prev) => ({ ...prev, successCriteria: event.target.value }))
                    }
                    placeholder="مثال: 70% من العينة تؤكد المشكلة"
                  />
                </label>
              </div>
            ) : null}

            <p className="wizard-note">
              بعد إنشاء الابتكار سيتم توجيهه تلقائيًا إلى Decision Matrix للفرز المرئي.
            </p>

            <button className="btn primary" onClick={handleCreateInitiative}>
              إنشاء الابتكار ونقله إلى الفرز
            </button>
          </article>

          <article className="panel decision-panel">
            <div className="panel-head">
              <h3>Decision Matrix</h3>
              <span>{selected ? selected.id : 'اختر فكرة'}</span>
            </div>

            {selected ? (
              <>
                <p className="compact-muted">{selected.title}</p>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>المعيار</th>
                        <th>الوزن (1-5)</th>
                        <th>الدرجة (1/3/9)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DECISION_CRITERIA.map((criterion) => (
                        <tr key={criterion.id}>
                          <td>{criterion.label}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={selectedMatrix.weights[criterion.id]}
                              onChange={(event) =>
                                handleDecisionMatrixChange(
                                  criterion.id,
                                  'weights',
                                  event.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            <select
                              value={selectedMatrix.scores[criterion.id]}
                              onChange={(event) =>
                                handleDecisionMatrixChange(
                                  criterion.id,
                                  'scores',
                                  event.target.value,
                                )
                              }
                            >
                              {DECISION_SCORE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="matrix-foot">
                  <span className={`badge ${selectedScoreMeta.tone}`}>{selectedScoreMeta.label}</span>
                  <strong>{selectedScore}%</strong>
                </div>

                <button className="btn primary" onClick={handleApplyDecisionMatrix}>
                  اعتماد نتيجة الفرز
                </button>
              </>
            ) : (
              <p>اختر مبادرة لبدء تقييم المعايير.</p>
            )}

            <div className="ranking-list">
              <div className="panel-head">
                <h3>ترتيب الأفكار</h3>
                <span>Top 5</span>
              </div>
              <ul className="list compact-list">
                {decisionRanking.slice(0, 5).map((item) => {
                  const score = calcDecisionMatrixTotal(item.decisionMatrix)
                  const meta = scoreTag(score)
                  return (
                    <li key={item.id}>
                      <div className="rank-row">
                        <strong>{item.title}</strong>
                        <span className={`badge ${meta.tone}`}>{score}%</span>
                      </div>
                      <small>{item.id}</small>
                    </li>
                  )
                })}
              </ul>
            </div>
          </article>
        </div>

        <article className="panel board-panel">
          <div className="panel-head">
            <h3>Innovation Map</h3>
            <span>{filteredInitiatives.length} مبادرة</span>
          </div>

          <label className="field compact">
            <span>بحث سريع</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="ابحث بالعنوان، الجهة، المرحلة..."
            />
          </label>

          <div className="board">
            {STAGES.map((stage) => (
              <section key={stage} className="column">
                <div className="column-head">
                  <strong>{stage}</strong>
                  <span>{initiativesByStage[stage]?.length || 0}</span>
                </div>

                <div className="card-list">
                  {(initiativesByStage[stage] || []).map((item) => {
                    const maturity = calcMaturity(item)
                    const risk = calcRisk(item)
                    const readiness = calcReadiness(item)
                    const matrixScore = calcDecisionMatrixTotal(item.decisionMatrix)

                    return (
                      <article key={item.id} className="idea-card">
                        <div className="idea-head">
                          <strong>{item.id}</strong>
                          <span className="badge">{item.status}</span>
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.owner}</p>
                        <div className="metric-row">
                          <span>Maturity {maturity}%</span>
                          <span>Risk {risk}%</span>
                          <span>Readiness {readiness}%</span>
                          <span>Decision {matrixScore}%</span>
                        </div>

                        <div className="chip-row">
                          <span className={`badge ${item.experiment?.completed ? 'good' : 'bad'}`}>
                            {item.experiment?.completed ? 'Experiment: مكتمل' : 'Experiment: غير مكتمل'}
                          </span>
                        </div>

                        <div className="card-actions two-cols">
                          <select
                            value={item.stage}
                            onChange={(event) =>
                              handleStageChange(item.id, event.target.value)
                            }
                          >
                            {STAGES.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>

                          <select
                            value={item.status}
                            onChange={(event) =>
                              handleStatusChange(item.id, event.target.value)
                            }
                          >
                            {STATUSES.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </div>

                        <div className="card-actions">
                          <button
                            className="btn"
                            onClick={() => {
                              setSelectedId(item.id)
                              setActiveView('workspace')
                            }}
                          >
                            فتح المساحة
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => {
                              setSelectedId(item.id)
                              setActiveView('analytics')
                            }}
                          >
                            الأثر والتحليل
                          </button>
                        </div>
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

  const renderWorkspace = () => {
    if (!selected) {
      return (
        <section className="panel">
          <p>اختر مبادرة أولاً من الخريطة.</p>
        </section>
      )
    }

    const tasks = selected.workspace?.tasks || []
    const comments = selected.workspace?.comments || []
    const doneTasks = tasks.filter((task) => task.done).length
    const decisionScore = calcDecisionMatrixTotal(selected.decisionMatrix)
    const experiment = selected.experiment || createExperimentCard(selected.wizard?.hypothesis || '')

    return (
      <div className="summary-stack">
        <section className="view-grid workspace-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>{selected.title}</h3>
              <span>{selected.id}</span>
            </div>

            <p>{selected.description}</p>

            <div className="chip-row">
              <span className="chip">المرحلة: {selected.stage}</span>
              <span className="chip">الحالة: {selected.status}</span>
              <span className="chip">النضج: {calcMaturity(selected)}%</span>
              <span className="chip">Decision: {decisionScore}%</span>
            </div>

            <div className="summary-cards">
              <article>
                <p>Prototype Progress</p>
                <strong>{selected.prototype?.progress || 0}%</strong>
              </article>
              <article>
                <p>تقدم المهام</p>
                <strong>
                  {doneTasks}/{tasks.length || 0}
                </strong>
              </article>
              <article>
                <p>Experiment Card</p>
                <strong>{experiment.completed ? 'مكتملة' : 'غير مكتملة'}</strong>
              </article>
            </div>

            <div className="inline-actions">
              <button className="btn" onClick={() => setActiveView('prototype')}>
                الانتقال إلى Prototype Builder
              </button>
              <button className="btn ghost" onClick={() => setActiveView('analytics')}>
                الانتقال إلى Impact & Benchmarking
              </button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>المهام</h3>
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
              <h3>التعليقات</h3>
              <span>{comments.length}</span>
            </div>

            <div className="inline-input wrap">
              <input
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
                placeholder="الكاتب"
              />
              <input
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                placeholder="تعليق جديد..."
              />
              <button className="btn" onClick={handleAddComment}>
                نشر
              </button>
            </div>

            <ul className="list comments">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.author}</strong>
                  <p>{comment.text}</p>
                  <small>{formatDate(comment.at)}</small>
                </li>
              ))}
              {!comments.length ? <li className="empty">لا توجد تعليقات بعد.</li> : null}
            </ul>
          </article>
        </section>

        <section className="panel experiment-panel">
          <div className="panel-head">
            <h3>Experiment Card (إلزامية قبل التقييم النهائي)</h3>
            <span>{experiment.completed ? 'مكتملة' : 'قيد الإعداد'}</span>
          </div>

          <div className="form-grid two">
            <label className="field">
              <span>اسم الاختبار</span>
              <input
                value={experiment.testName}
                onChange={(event) => handleExperimentChange('testName', event.target.value)}
              />
            </label>

            <label className="field">
              <span>الفرضية</span>
              <input
                value={experiment.hypothesis}
                onChange={(event) => handleExperimentChange('hypothesis', event.target.value)}
              />
            </label>

            <label className="field">
              <span>تصميم التجربة (استبيان/صفحة هبوط)</span>
              <textarea
                rows={3}
                value={experiment.experimentDesign}
                onChange={(event) => handleExperimentChange('experimentDesign', event.target.value)}
              />
            </label>

            <label className="field">
              <span>البيانات المطلوب جمعها</span>
              <textarea
                rows={3}
                value={experiment.dataToCollect}
                onChange={(event) => handleExperimentChange('dataToCollect', event.target.value)}
              />
            </label>

            <label className="field">
              <span>معيار الإثبات/الإبطال</span>
              <textarea
                rows={3}
                value={experiment.successCriteria}
                onChange={(event) => handleExperimentChange('successCriteria', event.target.value)}
              />
            </label>

            <label className="field">
              <span>الدليل المرفوع (اسم ملف/رابط)</span>
              <input
                value={experiment.evidenceName}
                onChange={(event) => handleExperimentChange('evidenceName', event.target.value)}
                placeholder="مثال: survey-results-q1.xlsx"
              />
            </label>

            <label className="field">
              <span>رابط الدليل (اختياري)</span>
              <input
                value={experiment.evidenceLink}
                onChange={(event) => handleExperimentChange('evidenceLink', event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="field">
              <span>الملاحظة</span>
              <textarea
                rows={3}
                value={experiment.observation}
                onChange={(event) => handleExperimentChange('observation', event.target.value)}
              />
            </label>

            <label className="field">
              <span>التعلم</span>
              <textarea
                rows={3}
                value={experiment.learning}
                onChange={(event) => handleExperimentChange('learning', event.target.value)}
              />
            </label>

            <label className="field">
              <span>الخطوة القادمة</span>
              <textarea
                rows={3}
                value={experiment.nextAction}
                onChange={(event) => handleExperimentChange('nextAction', event.target.value)}
              />
            </label>
          </div>

          <div className="inline-actions">
            <button className="btn" onClick={handleSaveExperimentProgress}>
              حفظ تقدم البطاقة
            </button>
            <button className="btn primary" onClick={handleCompleteExperiment}>
              اعتماد البطاقة
            </button>
          </div>
        </section>
      </div>
    )
  }

  const renderPrototypeBuilder = () => {
    if (!selected) {
      return (
        <section className="panel">
          <p>اختر مبادرة أولاً من الخريطة.</p>
        </section>
      )
    }

    const unlocked = isPrototypeUnlocked(selected)
    const decisionScore = calcDecisionMatrixTotal(selected.decisionMatrix)
    const maturity = calcMaturity(selected)
    const checklist = selected.prototype?.mvpChecklist || MVP_CHECKLIST_TEMPLATE
    const storyboard = selected.prototype?.storyboard || STORYBOARD_TEMPLATE

    if (!unlocked) {
      return (
        <section className="panel">
          <div className="panel-head">
            <h3>Prototype Builder</h3>
            <span>Locked</span>
          </div>

          <p>
            Progressive Disclosure مفعل: يتم فتح أدوات النمذجة فقط بعد اكتمال الخطوات الأساسية وتحقيق حد
            النضج.
          </p>

          <ul className="list gate-list">
            <li>
              <strong>Wizard مكتمل:</strong> {selected.wizard?.completed ? 'نعم' : 'لا'}
            </li>
            <li>
              <strong>Decision Matrix:</strong> {decisionScore}% (الحد الأدنى {DECISION_PASS_THRESHOLD}%)
            </li>
            <li>
              <strong>Idea Maturity:</strong> {maturity}% (الحد الأدنى {PROTOTYPE_UNLOCK_MATURITY}%)
            </li>
          </ul>

          <div className="inline-actions">
            <button className="btn" onClick={() => setActiveView('map')}>
              العودة إلى Decision Matrix
            </button>
            <button className="btn ghost" onClick={() => setActiveView('workspace')}>
              تحديث بطاقة الاختبار
            </button>
          </div>
        </section>
      )
    }

    return (
      <section className="view-grid prototype-grid">
        <article className="panel">
          <div className="panel-head">
            <h3>Prototype Builder</h3>
            <span>{selected.id}</span>
          </div>

          <p>{selected.title}</p>

          <label className="field">
            <span>قالب النموذج الأولي</span>
            <select
              value={prototypeTemplate}
              onChange={(event) => setPrototypeTemplate(event.target.value)}
            >
              {PROTOTYPE_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.focus}
                </option>
              ))}
            </select>
          </label>

          <button className="btn primary" onClick={handleGeneratePrototype}>
            توليد Pitch Deck تلقائي
          </button>

          <div className="summary-cards compact">
            <article>
              <p>Progress</p>
              <strong>{selected.prototype?.progress || 0}%</strong>
            </article>
            <article>
              <p>Maturity</p>
              <strong>{maturity}%</strong>
            </article>
            <article>
              <p>Decision</p>
              <strong>{decisionScore}%</strong>
            </article>
          </div>

          <div className="template-stack">
            <article className="template-card">
              <div className="panel-head">
                <h3>Storyboard Template</h3>
                <span>10.pdf</span>
              </div>

              <div className="storyboard-grid">
                {storyboard.map((scene) => (
                  <label key={scene.id} className="field">
                    <span>{scene.title}</span>
                    <textarea
                      rows={2}
                      value={scene.text}
                      onChange={(event) => handleStoryboardChange(scene.id, event.target.value)}
                      placeholder="اكتب وصف المشهد"
                    />
                  </label>
                ))}
              </div>
            </article>

            <article className="template-card">
              <div className="panel-head">
                <h3>MVP Checklist</h3>
                <span>11.pdf</span>
              </div>

              <ul className="list checklist-list">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={Boolean(item.done)}
                        onChange={() => handleToggleMvpChecklist(item.id)}
                      />
                      <span className={item.done ? 'done' : ''}>{item.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </article>

        <article className="panel output-panel">
          <div className="panel-head">
            <h3>Pitch Deck Output</h3>
            <span>{selected.prototype?.template || '—'}</span>
          </div>
          <textarea
            readOnly
            value={selected.prototype?.lastOutput || 'اضغط "توليد Pitch Deck تلقائي" لإنشاء المخرجات.'}
          />
        </article>
      </section>
    )
  }

  const renderAnalytics = () => {
    if (!selected) {
      return (
        <section className="panel">
          <p>اختر مبادرة أولاً من الخريطة.</p>
        </section>
      )
    }

    const benchmarkRows = selected.benchmark?.topMatches || []
    const monitoring = selected.monitoring || createMonitoringRecord()
    const monitoringEnabled = selected.stage === 'التطبيق' || selected.status === 'مطبق'
    const netCash = ensureNumber(monitoring.cashIn) - ensureNumber(monitoring.cashOut)
    const roi =
      ensureNumber(monitoring.investment) > 0
        ? Math.round((netCash / ensureNumber(monitoring.investment)) * 100)
        : 0

    const tocScore = Math.round(
      (ensureNumber(monitoring.tocInput) +
        ensureNumber(monitoring.tocOutput) +
        ensureNumber(monitoring.tocOutcome)) /
        3,
    )

    return (
      <div className="summary-stack">
        <section className="view-grid analytics-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>Idea Maturity & Risk</h3>
              <span>{selected.id}</span>
            </div>

            <div className="bar-list">
              <div>
                <label>وضوح المشكلة</label>
                <progress max="100" value={selected.maturity.clarity} />
              </div>
              <div>
                <label>قابلية التطبيق</label>
                <progress max="100" value={selected.maturity.feasibility} />
              </div>
              <div>
                <label>الأثر المتوقع</label>
                <progress max="100" value={selected.maturity.value} />
              </div>
              <div>
                <label>الجاهزية</label>
                <progress max="100" value={selected.maturity.readiness} />
              </div>
              <div>
                <label>إدارة المخاطر</label>
                <progress max="100" value={selected.maturity.riskHandling} />
              </div>
            </div>

            <div className="chip-row">
              <span className="chip good">Maturity: {calcMaturity(selected)}%</span>
              <span className="chip mid">Risk: {calcRisk(selected)}%</span>
              <span className="chip">Readiness: {calcReadiness(selected)}%</span>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Impact Simulator</h3>
              <span>Scenario</span>
            </div>

            <div className="form-grid two">
              <label className="field">
                <span>تكلفة العملية (ريال)</span>
                <input
                  type="number"
                  value={impactAssumptions.baselineCost}
                  onChange={(event) =>
                    setImpactAssumptions((prev) => ({
                      ...prev,
                      baselineCost: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>زمن العملية (دقيقة)</span>
                <input
                  type="number"
                  value={impactAssumptions.baselineMinutes}
                  onChange={(event) =>
                    setImpactAssumptions((prev) => ({
                      ...prev,
                      baselineMinutes: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>عدد المعاملات السنوي</span>
                <input
                  type="number"
                  value={impactAssumptions.transactionsPerYear}
                  onChange={(event) =>
                    setImpactAssumptions((prev) => ({
                      ...prev,
                      transactionsPerYear: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>خفض التكلفة (%)</span>
                <input
                  type="number"
                  value={impactAssumptions.expectedCostReduction}
                  onChange={(event) =>
                    setImpactAssumptions((prev) => ({
                      ...prev,
                      expectedCostReduction: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>خفض الزمن (%)</span>
                <input
                  type="number"
                  value={impactAssumptions.expectedTimeReduction}
                  onChange={(event) =>
                    setImpactAssumptions((prev) => ({
                      ...prev,
                      expectedTimeReduction: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button className="btn primary" onClick={handleRunImpact}>
              تشغيل المحاكاة
            </button>

            {latestImpact ? (
              <div className="impact-result">
                <p>الوفر السنوي المتوقع: {formatNumber(latestImpact.annualSaving)} ريال</p>
                <p>الوقت الموفر سنويًا: {formatNumber(latestImpact.annualHoursSaved)} ساعة</p>
                <p>تحسين الجودة: {latestImpact.qualityLift}%</p>
              </div>
            ) : null}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Global Benchmarking</h3>
              <span>Top 3</span>
            </div>

            <button className="btn" onClick={handleRunBenchmark}>
              مقارنة عالمية الآن
            </button>

            {benchmarkInfo ? <p className="hint">{benchmarkInfo}</p> : null}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الحل</th>
                    <th>الدولة</th>
                    <th>Similarity</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.solution}</td>
                      <td>{row.country}</td>
                      <td>{row.score}%</td>
                    </tr>
                  ))}
                  {!benchmarkRows.length ? (
                    <tr>
                      <td colSpan="3">لم يتم تنفيذ المقارنة بعد.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="panel monitoring-panel">
          <div className="panel-head">
            <h3>Post-Implementation Monitoring</h3>
            <span>{monitoringEnabled ? 'Active' : 'يتفعل بعد التطبيق'}</span>
          </div>

          <p className="compact-muted">
            قياس Theory of Change + المؤشرات المالية (Cash Flow / ROI / Payback) بالاستناد إلى ملفات 17، 18، 20.
          </p>

          <div className="monitor-grid">
            <label className="field">
              <span>Theory of Change - Input (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!monitoringEnabled}
                value={monitoring.tocInput}
                onChange={(event) => handleMonitoringChange('tocInput', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Theory of Change - Output (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!monitoringEnabled}
                value={monitoring.tocOutput}
                onChange={(event) => handleMonitoringChange('tocOutput', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Theory of Change - Outcome (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!monitoringEnabled}
                value={monitoring.tocOutcome}
                onChange={(event) => handleMonitoringChange('tocOutcome', event.target.value)}
              />
            </label>
            <label className="field">
              <span>التدفق النقدي الداخل (ريال)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={monitoring.cashIn}
                onChange={(event) => handleMonitoringChange('cashIn', event.target.value)}
              />
            </label>
            <label className="field">
              <span>التدفق النقدي الخارج (ريال)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={monitoring.cashOut}
                onChange={(event) => handleMonitoringChange('cashOut', event.target.value)}
              />
            </label>
            <label className="field">
              <span>الاستثمار الأساسي (ريال)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={monitoring.investment}
                onChange={(event) => handleMonitoringChange('investment', event.target.value)}
              />
            </label>
            <label className="field">
              <span>فترة الاسترداد (شهر)</span>
              <input
                type="number"
                disabled={!monitoringEnabled}
                value={monitoring.paybackMonths}
                onChange={(event) => handleMonitoringChange('paybackMonths', event.target.value)}
              />
            </label>
          </div>

          <div className="monitor-kpis">
            <article>
              <p>Theory of Change Score</p>
              <strong>{tocScore}%</strong>
            </article>
            <article>
              <p>Net Cash Flow</p>
              <strong>{formatNumber(netCash)} ريال</strong>
            </article>
            <article>
              <p>ROI</p>
              <strong>{roi}%</strong>
            </article>
            <article>
              <p>Payback</p>
              <strong>{monitoring.paybackMonths} شهر</strong>
            </article>
          </div>

          <button className="btn" disabled={!monitoringEnabled} onClick={handleSaveMonitoring}>
            حفظ مراجعة المتابعة
          </button>
        </section>
      </div>
    )
  }

  const renderMarketplace = () => {
    const list = [...state.initiatives].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )

    return (
      <section className="panel">
        <div className="panel-head">
          <h3>Internal Marketplace</h3>
          <span>ابتكارات قابلة للتبني داخل التجمع</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>المبادرة</th>
                <th>المالك</th>
                <th>الفرز</th>
                <th>Experiment</th>
                <th>الحالة</th>
                <th>الأثر السنوي</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.id}</small>
                  </td>
                  <td>{item.owner}</td>
                  <td>{calcDecisionMatrixTotal(item.decisionMatrix)}%</td>
                  <td>
                    <span className={`badge ${item.experiment?.completed ? 'good' : 'bad'}`}>
                      {item.experiment?.completed ? 'مكتمل' : 'غير مكتمل'}
                    </span>
                  </td>
                  <td>{item.status}</td>
                  <td>{formatNumber(item.impact.costSaving)} ريال</td>
                  <td>
                    {item.status === 'مطبق' ? (
                      <span className="badge good">منشور</span>
                    ) : (
                      <button
                        className="btn"
                        onClick={() => handlePublishToMarketplace(item.id)}
                      >
                        نشر في السوق
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const renderKnowledgeHub = () => {
    return (
      <div className="summary-stack">
        <section className="panel">
          <div className="panel-head">
            <h3>Knowledge Hub</h3>
            <span>قوالب ومراجع للتعلم الذاتي</span>
          </div>

          <div className="knowledge-grid">
            {KNOWLEDGE_TEMPLATES.map((item) => (
              <article key={item.id} className="knowledge-card">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <small>Source: {item.source}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>مكتبة الأدوات من الملفات</h3>
            <span>{METHOD_TOOLKIT.length} مرجع</span>
          </div>

          <div className="toolkit-grid">
            {METHOD_TOOLKIT.map((tool) => {
              const sourceLink = tool.source
                ? `input/pdfs/${encodeURIComponent(tool.source)}`
                : '#'

              return (
                <article key={tool.id} className="toolkit-card">
                  <div className="toolkit-head">
                    <strong>{tool.title}</strong>
                    <span className="badge">{tool.stage}</span>
                  </div>
                  <p>{tool.purpose}</p>
                  <div className="toolkit-meta">
                    <small>Source: {tool.source}</small>
                  </div>
                  {tool.source ? (
                    <a className="resource-link" href={sourceLink} target="_blank" rel="noreferrer">
                      فتح الملف
                    </a>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Global Cases + Business Model</h3>
            <span>تعلم من الحلول العالمية</span>
          </div>

          <div className="knowledge-grid">
            {BENCHMARK_CATALOG.map((item) => (
              <article key={item.id} className="knowledge-card">
                <strong>{item.solution}</strong>
                <p>الدولة: {item.country}</p>
                <small>{item.tags.join(' | ')}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Innovation Shield V3</p>
          <h1>درع الابتكار - منصة متكاملة لإدارة رحلة الابتكار</h1>
          <p className="lead">
            منصة درع الابتكار V3 هي منظومة ابتكار مؤسسية متكاملة تهدف إلى رفع جودة الأفكار،
            تسريع التقييم، وتمكين النماذج الأولية داخل التجمع الصحي بالطائف.
          </p>
        </div>
        <div className="hero-stats">
          <article>
            <p>إجمالي المبادرات</p>
            <strong>{kpis.total}</strong>
          </article>
          <article>
            <p>متوسط النضج</p>
            <strong>{kpis.avgMaturity}%</strong>
          </article>
          <article>
            <p>الوفر السنوي المتوقع</p>
            <strong>{formatNumber(kpis.annualSaving)} ريال</strong>
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

      {flowMessage ? <section className="flow-message">{flowMessage}</section> : null}

      <section className="kpi-grid">
        <article>
          <p>معتمد/مطبق</p>
          <strong>{kpis.approved}</strong>
        </article>
        <article>
          <p>نسبة المخاطر</p>
          <strong>{kpis.avgRisk}%</strong>
        </article>
        <article>
          <p>نماذج أولية فعالة</p>
          <strong>{kpis.prototypes}</strong>
        </article>
        <article>
          <p>Experiment Coverage</p>
          <strong>{successMetrics.experimentRate}%</strong>
        </article>
      </section>

      {activeView === 'summary' ? renderSummary() : null}
      {activeView === 'map' ? renderMap() : null}
      {activeView === 'workspace' ? renderWorkspace() : null}
      {activeView === 'prototype' ? renderPrototypeBuilder() : null}
      {activeView === 'analytics' ? renderAnalytics() : null}
      {activeView === 'marketplace' ? renderMarketplace() : null}
      {activeView === 'knowledge' ? renderKnowledgeHub() : null}

      <footer className="platform-footer">
        <div className="footer-links">
          <a href="#about">من نحن</a>
          <a href="#policies">السياسات</a>
          <a href="#support">الدعم</a>
          <a href="#contact">تواصل معنا</a>
        </div>
        <p className="footer-note">
          آخر تحديث: {formatDate(state.meta.lastUpdated)} | Contributors:{' '}
          {state.engagement.contributors} | Points: {state.engagement.points}
        </p>
      </footer>
    </div>
  )
}

export default App
