import {
  IMPACT_MODELS,
  LIFECYCLE_STAGES,
  STAGE_GATE_REQUIREMENTS,
  STAGE_KPI_DEFINITION,
  WORKFLOW_FLOWS,
  YEAR_MONTHS,
} from './innovationData'

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

export function formatDate(input) {
  if (!input) return '—'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ar-SA')
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ar-SA').format(Number(value) || 0)
}

export function uid(prefix = 'ID') {
  const seed = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${seed}`
}

export function deepClone(input) {
  return JSON.parse(JSON.stringify(input))
}

export function resolveWorkflowType(domain) {
  const text = String(domain || '').toLowerCase()
  if (text.includes('تقني')) return 'technical'
  if (text.includes('سريري') || text.includes('تجربة')) return 'clinical'
  return 'operational'
}

export function getApprovalFlow(domain) {
  const type = resolveWorkflowType(domain)
  return WORKFLOW_FLOWS[type] || WORKFLOW_FLOWS.operational
}

export function getStageRequirement(domain, stage) {
  const type = resolveWorkflowType(domain)
  const map = STAGE_GATE_REQUIREMENTS[type] || STAGE_GATE_REQUIREMENTS.operational
  return map[stage] || null
}

export function stageProgressPercent(stage) {
  const index = LIFECYCLE_STAGES.indexOf(stage)
  if (index < 0) return 0
  return Math.round(((index + 1) / LIFECYCLE_STAGES.length) * 100)
}

export function calcMaturity(idea) {
  const maturity = idea?.maturity || {}
  const clarity = clamp(maturity.clarity, 0, 100)
  const feasibility = clamp(maturity.feasibility, 0, 100)
  const value = clamp(maturity.value, 0, 100)
  const readiness = clamp(maturity.readiness, 0, 100)
  const riskHandling = clamp(maturity.riskHandling, 0, 100)

  return Math.round(
    clarity * 0.24 +
      feasibility * 0.2 +
      value * 0.24 +
      readiness * 0.2 +
      riskHandling * 0.12,
  )
}

export function calcRisk(idea) {
  const risk = idea?.risk || {}
  const weighted =
    clamp(risk.operational, 1, 5) * 0.34 +
    clamp(risk.financial, 1, 5) * 0.2 +
    clamp(risk.technical, 1, 5) * 0.26 +
    clamp(risk.compliance, 1, 5) * 0.2
  return Math.round((weighted / 5) * 100)
}

export function calcPrototypeScore(idea) {
  const prototype = idea?.prototype || {}
  const progress = clamp(prototype.progress, 0, 100)
  const hasHypothesis = prototype.hypothesis?.trim() ? 1 : 0
  const hasPlan = prototype.testPlan?.trim() ? 1 : 0
  const hasMetric = prototype.validationMetric?.trim() ? 1 : 0
  const assetsCount = Array.isArray(prototype.assets) ? prototype.assets.length : 0
  const assetsScore = Math.min(20, assetsCount * 5)

  return clamp(
    Math.round(progress * 0.45 + hasHypothesis * 15 + hasPlan * 12 + hasMetric * 8 + assetsScore),
    0,
    100,
  )
}

export function calcReadiness(idea) {
  const maturity = calcMaturity(idea)
  const risk = calcRisk(idea)
  const prototypeScore = calcPrototypeScore(idea)
  return Math.round(maturity * 0.52 + prototypeScore * 0.28 + (100 - risk) * 0.2)
}

export function calcStageKpis(idea) {
  const maturity = calcMaturity(idea)
  const readiness = calcReadiness(idea)
  const risk = calcRisk(idea)
  const prototype = calcPrototypeScore(idea)

  const scores = {
    intake: clamp(Math.round((idea?.maturity?.clarity || 0) * 0.55 + (idea?.maturity?.value || 0) * 0.45), 0, 100),
    prototype: clamp(Math.round((idea?.maturity?.feasibility || 0) * 0.35 + prototype * 0.65), 0, 100),
    testing: clamp(Math.round(readiness * 0.58 + (100 - risk) * 0.42), 0, 100),
    adoption: clamp(
      Math.round(
        maturity * 0.3 +
          readiness * 0.34 +
          (idea?.governance?.gateApproved ? 100 : 45) * 0.2 +
          (idea?.status === 'معتمد' || idea?.status === 'مطبق' ? 100 : 50) * 0.16,
      ),
      0,
      100,
    ),
  }

  return STAGE_KPI_DEFINITION.map((item) => ({
    ...item,
    score: scores[item.id] || 0,
  }))
}

export function collectAlerts(idea, referenceTime = Date.now()) {
  if (!idea) return []
  const alerts = []

  const maturity = calcMaturity(idea)
  const readiness = calcReadiness(idea)
  const risk = calcRisk(idea)

  if (maturity < 60) {
    alerts.push({
      id: 'alert-maturity',
      tone: 'bad',
      text: `النضج منخفض (${maturity}%).`,
    })
  }

  if (risk >= 65) {
    alerts.push({
      id: 'alert-risk',
      tone: 'bad',
      text: `المخاطر مرتفعة (${risk}%).`,
    })
  }

  if (readiness < 55) {
    alerts.push({
      id: 'alert-readiness',
      tone: 'mid',
      text: `الجاهزية منخفضة (${readiness}%).`,
    })
  }

  const overdue = (idea.workspace?.tasks || []).filter((task) => {
    if (task.done || !task.dueAt) return false
    const due = new Date(task.dueAt).getTime()
    return !Number.isNaN(due) && due < referenceTime
  })

  if (overdue.length > 0) {
    alerts.push({
      id: 'alert-overdue',
      tone: 'mid',
      text: `يوجد ${overdue.length} مهام متأخرة تتطلب تذكيرًا فوريًا.`,
    })
  }

  if (!idea.governance?.gateApproved) {
    alerts.push({
      id: 'alert-governance',
      tone: 'mid',
      text: 'الحوكمة غير مكتملة قبل الاعتماد النهائي.',
    })
  }

  if (idea.governance?.protectionNeeded) {
    alerts.push({
      id: 'alert-ip',
      tone: 'mid',
      text: 'يوصى برفع طلب حماية ملكية فكرية لهذه الفكرة.',
    })
  }

  return alerts
}

export function buildActionPlan(idea) {
  if (!idea) return []
  const maturity = calcMaturity(idea)
  const risk = calcRisk(idea)
  const prototypeScore = calcPrototypeScore(idea)
  const workflow = resolveWorkflowType(idea.domain)

  const lines = []

  if (maturity < 60) {
    lines.push('تنفيذ ورشة صياغة مشكلة وقيمة مع أصحاب المصلحة خلال 48 ساعة.')
  }

  if (prototypeScore < 65) {
    lines.push('إكمال عناصر النموذج الأولي: فرضية + خطة اختبار + مؤشر تحقق + ملف تصميم.')
  }

  if (risk >= 65) {
    lines.push('إعداد مصفوفة مخاطر مصغرة وتعيين مالك لكل خطر ومهلة إغلاق واضحة.')
  }

  if (!idea.governance?.gateApproved) {
    lines.push('استكمال متطلبات الحوكمة والملكية الفكرية قبل طلب الاعتماد.')
  }

  if (workflow === 'technical') {
    lines.push('جدولة مراجعة Architecture + Security قبل الانتقال إلى Testing.')
  }

  if (workflow === 'clinical') {
    lines.push('تأكيد موافقات Ethics وClinical Safety قبل التوسع التجريبي.')
  }

  if (!lines.length) {
    lines.push('الوضع مستقر: ابدأ تجهيز حزمة الاعتماد والتوسع المؤسسي.')
  }

  return lines
}

export function buildAssistantTips(idea) {
  if (!idea) return []

  const stage = idea.stage
  const requirement = getStageRequirement(idea.domain, stage)

  const tips = [
    `المرحلة الحالية: ${stage}`,
    `Gate المطلوب: ${requirement || 'لا يوجد'}`,
  ]

  if (stage === 'Idea Intake') {
    tips.push('صغ المشكلة في جملة واحدة قابلة للقياس التنفيذي.')
  } else if (stage === 'Prototype') {
    tips.push('اختر قالبًا مناسبًا وارفع أصول التصميم لتفعيل التقييم التلقائي.')
  } else if (stage === 'Testing') {
    tips.push('فعّل اختبارًا محدودًا مع تقرير أسبوعي للنتائج والانحرافات.')
  } else if (stage === 'Adoption') {
    tips.push('جهز تقريرًا تنفيذيًا نهائيًا يتضمن القرار المطلوب من القيادة.')
  }

  return tips
}

export function runImpactSimulation(simulation) {
  const baselineCost = Math.max(0, Number(simulation?.baselineCost) || 0)
  const baselineMinutes = Math.max(0, Number(simulation?.baselineMinutes) || 0)
  const transactions = Math.max(1, Number(simulation?.transactionsPerYear) || 1)
  const expectedCostReduction = clamp(simulation?.expectedCostReduction, 0, 100)
  const expectedTimeReduction = clamp(simulation?.expectedTimeReduction, 0, 100)

  const annualSaving = Math.round((baselineCost * expectedCostReduction * transactions) / 100)
  const annualMinutesSaved = Math.round((baselineMinutes * expectedTimeReduction * transactions) / 100)
  const annualHoursSaved = Math.round(annualMinutesSaved / 60)

  return {
    annualSaving,
    annualMinutesSaved,
    annualHoursSaved,
    expectedCostReduction,
    expectedTimeReduction,
  }
}

export function applyImpactModel(idea, simulationResult) {
  const model = idea?.simulation?.model || IMPACT_MODELS[0].id

  if (model === 'patient') {
    return {
      costSaving: Math.round(simulationResult.annualSaving * 0.35),
      timeSaving: clamp(Math.round(simulationResult.expectedTimeReduction * 0.7), 0, 100),
      qualityImprovement: clamp(Math.round(48 + simulationResult.expectedTimeReduction * 0.5), 0, 100),
      satisfaction: clamp(Math.round(52 + simulationResult.expectedTimeReduction * 0.65), 0, 100),
    }
  }

  if (model === 'service') {
    return {
      costSaving: Math.round(simulationResult.annualSaving * 0.55),
      timeSaving: clamp(Math.round(simulationResult.expectedTimeReduction + 10), 0, 100),
      qualityImprovement: clamp(Math.round(38 + simulationResult.expectedTimeReduction * 0.5), 0, 100),
      satisfaction: clamp(Math.round(35 + simulationResult.expectedTimeReduction * 0.45), 0, 100),
    }
  }

  return {
    costSaving: simulationResult.annualSaving,
    timeSaving: simulationResult.expectedTimeReduction,
    qualityImprovement: clamp(Math.round(32 + simulationResult.expectedTimeReduction * 0.45), 0, 100),
    satisfaction: clamp(Math.round(30 + simulationResult.expectedTimeReduction * 0.4), 0, 100),
  }
}

export function buildPrototypeDeck(idea, templateName) {
  return [
    `# Prototype Deck - ${idea.title}`,
    `Template: ${templateName}`,
    `Date: ${new Date().toLocaleDateString('ar-SA')}`,
    '',
    '## Problem',
    idea.problem || 'غير محدد',
    '',
    '## Solution',
    idea.solution || 'غير محدد',
    '',
    '## Hypothesis',
    idea.prototype?.hypothesis || 'غير محدد',
    '',
    '## Test Plan',
    idea.prototype?.testPlan || 'غير محدد',
    '',
    '## Validation Metric',
    idea.prototype?.validationMetric || 'غير محدد',
    '',
    `Maturity: ${calcMaturity(idea)}%`,
    `Risk: ${calcRisk(idea)}%`,
    `Readiness: ${calcReadiness(idea)}%`,
  ].join('\n')
}

export function buildIdeaExecutiveReport(idea, stageKpis, alerts, impactResult) {
  const modelName = IMPACT_MODELS.find((item) => item.id === idea.simulation?.model)?.name || 'وفورات مالية'

  const lines = [
    `تقرير تنفيذي - ${idea.title}`,
    `المعرف: ${idea.id}`,
    `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`,
    `المرحلة: ${idea.stage}`,
    `الحالة: ${idea.status}`,
    '',
    `النضج: ${calcMaturity(idea)}%`,
    `الجاهزية: ${calcReadiness(idea)}%`,
    `المخاطر: ${calcRisk(idea)}%`,
    '',
    `نموذج الأثر: ${modelName}`,
    `الوفر السنوي: ${formatNumber(idea.impact?.costSaving || 0)} ريال`,
    `خفض الزمن: ${idea.impact?.timeSaving || 0}%`,
    `تحسين الجودة: ${idea.impact?.qualityImprovement || 0}%`,
    `رضا المستفيد: ${idea.impact?.satisfaction || 0}%`,
  ]

  if (impactResult) {
    lines.push(`الساعات الموفرة سنويًا: ${formatNumber(impactResult.annualHoursSaved)} ساعة`)
  }

  lines.push('', 'KPIs مرحلية:')
  stageKpis.forEach((kpi) => {
    lines.push(`- ${kpi.title}: ${kpi.score}%`)
  })

  lines.push('', 'تنبيهات:')
  if (alerts.length) {
    alerts.forEach((alert) => lines.push(`- ${alert.text}`))
  } else {
    lines.push('- لا توجد تنبيهات حرجة.')
  }

  lines.push('', 'توصية تنفيذية: تطبيق خطة العمل الأسبوعية ثم رفع القرار للقيادة.')

  return lines.join('\n')
}

export function buildWeeklyExecutiveReport(ideas, metrics) {
  const troubled = ideas.filter((idea) => {
    return calcReadiness(idea) < 55 || calcRisk(idea) >= 65 || collectAlerts(idea).length > 0
  })

  const lines = [
    'تقرير أسبوعي - منصة درع الابتكار',
    `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`,
    '',
    `عدد الأفكار: ${metrics.total}`,
    `نسبة النضج: ${metrics.avgMaturity}%`,
    `نسبة الجاهزية: ${metrics.avgReadiness}%`,
    `الأفكار المتعثرة: ${troubled.length}`,
    '',
    'توصيات جاهزة للقيادات:',
  ]

  if (!troubled.length) {
    lines.push('- لا توجد حالات حرجة هذا الأسبوع.')
  } else {
    troubled.slice(0, 6).forEach((idea) => {
      lines.push(`- ${idea.title}: ${buildActionPlan(idea)[0]}`)
    })
  }

  return lines.join('\n')
}

export function buildAnnualImpactProjection(annualSaving) {
  const base = Math.round((Number(annualSaving) || 0) / 12)
  return YEAR_MONTHS.map((month, index) => {
    const factor = 0.82 + (index % 4) * 0.06
    return {
      month,
      value: Math.max(0, Math.round(base * factor)),
    }
  })
}

export function createDownload(filename, content) {
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
