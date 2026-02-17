import { BENCHMARK_CATALOG } from './innovationData'

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0))

export const formatNumber = (value) => new Intl.NumberFormat('ar-SA').format(Number(value) || 0)

export const formatDate = (iso) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ar-SA')
}

export const newId = (prefix = 'IS') => {
  const random = Math.floor(1000 + Math.random() * 8999)
  return `${prefix}-${random}`
}

export const calcMaturity = (initiative) => {
  const m = initiative?.maturity || {}
  const clarity = clamp(m.clarity, 0, 100)
  const feasibility = clamp(m.feasibility, 0, 100)
  const value = clamp(m.value, 0, 100)
  const readiness = clamp(m.readiness, 0, 100)
  const riskHandling = clamp(m.riskHandling, 0, 100)

  return Math.round(
    clarity * 0.24 +
      feasibility * 0.2 +
      value * 0.24 +
      readiness * 0.2 +
      riskHandling * 0.12,
  )
}

export const calcRisk = (initiative) => {
  const r = initiative?.risk || {}
  const weighted =
    clamp(r.operational, 1, 5) * 0.35 +
    clamp(r.financial, 1, 5) * 0.2 +
    clamp(r.technical, 1, 5) * 0.25 +
    clamp(r.compliance, 1, 5) * 0.2

  return Math.round((weighted / 5) * 100)
}

export const calcReadiness = (initiative) => {
  const maturity = calcMaturity(initiative)
  const risk = calcRisk(initiative)
  const prototypeProgress = clamp(initiative?.prototype?.progress, 0, 100)

  return Math.round(maturity * 0.55 + prototypeProgress * 0.25 + (100 - risk) * 0.2)
}

export const buildPitchDeck = (initiative, template) => {
  const now = new Date().toLocaleDateString('ar-SA')
  const maturity = calcMaturity(initiative)
  const risk = calcRisk(initiative)
  const impact = initiative?.impact || {}

  return [
    `# Pitch Deck - ${initiative.title}`,
    `التاريخ: ${now}`,
    `القالب: ${template?.name || 'عام'}`,
    '',
    '## 1) تعريف المشكلة',
    initiative.description || 'لا يوجد وصف بعد.',
    '',
    '## 2) الفئة المستفيدة',
    `المالك: ${initiative.owner} | الجهة: ${initiative.organization}`,
    '',
    '## 3) الفرضية الرئيسية',
    `إذا طبقنا هذا الحل فسنحسن المؤشرات التشغيلية ضمن نطاق ${initiative.challengeType}.`,
    '',
    '## 4) النموذج الأولي المقترح',
    template?.focus || 'نموذج أولي سريع يختبر الفكرة خلال 2-4 أسابيع.',
    '',
    '## 5) الأثر المتوقع',
    `الوفر السنوي: ${formatNumber(impact.costSaving || 0)} ريال`,
    `توفير الوقت: ${impact.timeSaving || 0}%`,
    `تحسين الجودة: ${impact.qualityImprovement || 0}%`,
    '',
    '## 6) مؤشرات الجودة والمخاطر',
    `Maturity: ${maturity}%`,
    `Risk Index: ${risk}%`,
    '',
    '## 7) قرار المرحلة القادمة',
    'الانتقال إلى تجربة مقيدة بقياسات أسبوعية ثم رفع تقرير اعتماد.',
  ].join('\n')
}

export const simulateImpact = (initiative, assumptions) => {
  const baselineCost = Math.max(0, Number(assumptions?.baselineCost) || 0)
  const baselineMinutes = Math.max(0, Number(assumptions?.baselineMinutes) || 0)
  const transactionsPerYear = Math.max(1, Number(assumptions?.transactionsPerYear) || 1)
  const expectedCostReduction = clamp(assumptions?.expectedCostReduction, 0, 100)
  const expectedTimeReduction = clamp(assumptions?.expectedTimeReduction, 0, 100)

  const annualSaving = Math.round((baselineCost * expectedCostReduction * transactionsPerYear) / 100)
  const annualMinutesSaved = Math.round((baselineMinutes * expectedTimeReduction * transactionsPerYear) / 100)
  const annualHoursSaved = Math.round(annualMinutesSaved / 60)

  const qualityLift = clamp((initiative?.impact?.qualityImprovement || 0) + Math.round(expectedTimeReduction * 0.2), 0, 100)
  const satisfactionLift = clamp((initiative?.impact?.satisfaction || 0) + Math.round(expectedTimeReduction * 0.25), 0, 100)

  return {
    annualSaving,
    annualMinutesSaved,
    annualHoursSaved,
    qualityLift,
    satisfactionLift,
    expectedCostReduction,
    expectedTimeReduction,
  }
}

export const benchmarkInitiative = (initiative, catalog = BENCHMARK_CATALOG) => {
  const bag = `${initiative.title} ${initiative.description} ${initiative.challengeType}`.toLowerCase()

  const scoreItem = (item) => {
    const matches = item.tags
      .map((tag) => tag.toLowerCase())
      .filter((tag) => bag.includes(tag)).length

    const maturityFactor = calcMaturity(initiative) / 100
    const riskFactor = (100 - calcRisk(initiative)) / 100

    const score = Math.round(clamp((matches * 18 + maturityFactor * 35 + riskFactor * 25), 0, 100))
    return {
      ...item,
      score,
    }
  }

  return catalog
    .map(scoreItem)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export const summarizeKPIs = (initiatives) => {
  const safe = Array.isArray(initiatives) ? initiatives : []
  const total = safe.length
  const approved = safe.filter((item) => item.status === 'معتمد' || item.status === 'مطبق').length
  const prototypes = safe.filter((item) => (item.prototype?.progress || 0) > 0).length
  const marketplace = safe.filter((item) => item.status === 'مطبق').length

  const avgMaturity =
    total > 0
      ? Math.round(safe.reduce((sum, item) => sum + calcMaturity(item), 0) / total)
      : 0

  const avgRisk =
    total > 0
      ? Math.round(safe.reduce((sum, item) => sum + calcRisk(item), 0) / total)
      : 0

  const annualSaving = safe.reduce((sum, item) => sum + Math.max(0, Number(item?.impact?.costSaving || 0)), 0)

  return {
    total,
    approved,
    prototypes,
    marketplace,
    avgMaturity,
    avgRisk,
    annualSaving,
  }
}

export const cloneInitiative = (initiative) =>
  JSON.parse(JSON.stringify(initiative))
