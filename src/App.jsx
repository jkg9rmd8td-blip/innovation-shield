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

const VIEWS = [
  { id: 'summary', label: 'الملخص التنفيذي' },
  { id: 'map', label: 'خريطة الابتكار' },
  { id: 'workspace', label: 'Innovation Workspace' },
  { id: 'prototype', label: 'Prototype Builder' },
  { id: 'analytics', label: 'Impact & Benchmarking' },
  { id: 'marketplace', label: 'Marketplace' },
]

const DEFAULT_IDEA_FORM = {
  title: '',
  challengeType: 'تشغيلي',
  owner: '',
  organization: 'التجمع الصحي بالطائف',
  description: '',
}

function safeParse(input, fallback) {
  try {
    return JSON.parse(input)
  } catch {
    return fallback
  }
}

function loadState() {
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  if (!fromStorage) return cloneInitiative(DEFAULT_STATE)
  const parsed = safeParse(fromStorage, cloneInitiative(DEFAULT_STATE))
  if (!Array.isArray(parsed?.initiatives) || !parsed.initiatives.length) {
    return cloneInitiative(DEFAULT_STATE)
  }
  return parsed
}

function readinessTag(value) {
  if (value >= 80) return { label: 'جاهز', tone: 'good' }
  if (value >= 40) return { label: 'قيد التطوير', tone: 'mid' }
  return { label: 'يحتاج تركيز', tone: 'bad' }
}

function formatMillions(value) {
  const number = Number(value) || 0
  if (number >= 1000000) return `${(number / 1000000).toFixed(2)}M`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return formatNumber(number)
}

function App() {
  const [state, setState] = useState(loadState)
  const [activeView, setActiveView] = useState('summary')
  const [selectedId, setSelectedId] = useState(state.initiatives[0]?.id || null)
  const [newIdea, setNewIdea] = useState(DEFAULT_IDEA_FORM)
  const [searchText, setSearchText] = useState('')
  const [taskInput, setTaskInput] = useState('')
  const [commentInput, setCommentInput] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('صاحب المبادرة')
  const [prototypeTemplate, setPrototypeTemplate] = useState(PROTOTYPE_TEMPLATES[0].id)
  const [impactAssumptions, setImpactAssumptions] = useState({
    baselineCost: 180,
    baselineMinutes: 22,
    transactionsPerYear: 1400,
    expectedCostReduction: 18,
    expectedTimeReduction: 24,
  })
  const [latestImpact, setLatestImpact] = useState(null)
  const [benchmarkInfo, setBenchmarkInfo] = useState('')

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const selected = useMemo(
    () =>
      state.initiatives.find((item) => item.id === selectedId) ||
      state.initiatives[0] ||
      null,
    [selectedId, state.initiatives],
  )

  const kpis = useMemo(() => summarizeKPIs(state.initiatives), [state.initiatives])

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
      impact: Math.round((impactActive / total) * 100),
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

  const updateInitiative = (id, updater) => {
    setState((prev) => {
      const nextInitiatives = prev.initiatives.map((item) => {
        if (item.id !== id) return item
        const draft = cloneInitiative(item)
        const updated = updater(draft) || draft
        return {
          ...updated,
          updatedAt: new Date().toISOString(),
        }
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
    if (!newIdea.title.trim()) return

    const now = new Date().toISOString()
    const item = {
      id: newId('IS'),
      title: newIdea.title.trim(),
      challengeType: newIdea.challengeType,
      owner: newIdea.owner.trim() || 'فريق الابتكار',
      organization: newIdea.organization.trim() || 'التجمع الصحي بالطائف',
      stage: 'الفكرة',
      status: 'مسودة',
      description: newIdea.description.trim() || 'مبادرة جديدة قيد البناء.',
      maturity: {
        clarity: 60,
        feasibility: 55,
        value: 65,
        readiness: 40,
        riskHandling: 45,
      },
      risk: {
        operational: 3,
        financial: 2,
        technical: 2,
        compliance: 2,
      },
      prototype: {
        template: PROTOTYPE_TEMPLATES[0].id,
        progress: 10,
        lastOutput: '',
      },
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
            text: 'صياغة تعريف المشكلة بشكل قابل للقياس',
            done: false,
          },
        ],
        comments: [],
      },
      createdAt: now,
      updatedAt: now,
    }

    setState((prev) => ({
      ...prev,
      initiatives: [item, ...prev.initiatives],
      engagement: {
        points: Number(prev.engagement.points || 0) + 3,
        contributors: Number(prev.engagement.contributors || 0) + 1,
      },
      meta: {
        ...prev.meta,
        lastUpdated: now,
      },
    }))

    setNewIdea(DEFAULT_IDEA_FORM)
    setSelectedId(item.id)
    setActiveView('map')
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

  const handleGeneratePrototype = () => {
    if (!selected) return
    const template = PROTOTYPE_TEMPLATES.find((item) => item.id === prototypeTemplate)
    const output = buildPitchDeck(selected, template)

    updateInitiative(selected.id, (draft) => {
      draft.prototype.template = prototypeTemplate
      draft.prototype.progress = Math.min(100, Number(draft.prototype.progress || 0) + 12)
      draft.prototype.lastOutput = output

      if (STAGES.indexOf(draft.stage) < STAGES.indexOf('النموذج الأولي')) {
        draft.stage = 'النموذج الأولي'
      }
      if (draft.status === 'مسودة') {
        draft.status = 'قيد التطوير'
      }

      return draft
    })

    promoteEngagement(4)
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

  const handleStageChange = (initiativeId, nextStage) => {
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
    updateInitiative(initiativeId, (draft) => {
      draft.status = nextStatus
      return draft
    })
  }

  const handlePublishToMarketplace = (initiativeId) => {
    updateInitiative(initiativeId, (draft) => {
      draft.stage = 'التطبيق'
      draft.status = 'مطبق'
      return draft
    })
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
      </div>
    )
  }

  const renderMap = () => {
    return (
      <section className="view-grid map-grid">
        <article className="panel create-panel">
          <div className="panel-head">
            <h3>إطلاق مبادرة جديدة</h3>
            <span>Start Fast</span>
          </div>

          <label className="field">
            <span>العنوان</span>
            <input
              value={newIdea.title}
              onChange={(event) => setNewIdea((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="مثال: تحسين مسار صرف الدواء"
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
            <span>الوصف</span>
            <textarea
              rows={4}
              value={newIdea.description}
              onChange={(event) =>
                setNewIdea((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="ما المشكلة؟ وما الأثر المتوقع؟"
            />
          </label>

          <button className="btn primary" onClick={handleCreateInitiative}>
            إنشاء المبادرة
          </button>
        </article>

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

    return (
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
            <span className="chip">المخاطر: {calcRisk(selected)}%</span>
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
              <p>آخر تحديث</p>
              <strong>{formatDate(selected.updatedAt)}</strong>
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
            توليد Pitch Deck أولي
          </button>

          <div className="summary-cards compact">
            <article>
              <p>Progress</p>
              <strong>{selected.prototype?.progress || 0}%</strong>
            </article>
            <article>
              <p>Maturity</p>
              <strong>{calcMaturity(selected)}%</strong>
            </article>
            <article>
              <p>Stage</p>
              <strong>{selected.stage}</strong>
            </article>
          </div>
        </article>

        <article className="panel output-panel">
          <div className="panel-head">
            <h3>مخرجات النموذج</h3>
            <span>{selected.prototype?.template || '—'}</span>
          </div>
          <textarea
            readOnly
            value={selected.prototype?.lastOutput || 'اضغط "توليد Pitch Deck أولي" لإنشاء مخرجات.'}
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

    return (
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

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Innovation Shield V3</p>
          <h1>درع الابتكار - منصة جديدة مبنية من الصفر</h1>
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
          <p>منشور في السوق</p>
          <strong>{kpis.marketplace}</strong>
        </article>
      </section>

      {activeView === 'summary' ? renderSummary() : null}
      {activeView === 'map' ? renderMap() : null}
      {activeView === 'workspace' ? renderWorkspace() : null}
      {activeView === 'prototype' ? renderPrototypeBuilder() : null}
      {activeView === 'analytics' ? renderAnalytics() : null}
      {activeView === 'marketplace' ? renderMarketplace() : null}

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
