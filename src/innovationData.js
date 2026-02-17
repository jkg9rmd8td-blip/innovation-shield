export const STAGES = [
  'الفكرة',
  'التقييم',
  'النموذج الأولي',
  'التجربة',
  'الاعتماد',
  'التطبيق',
]

export const STATUSES = [
  'مسودة',
  'قيد الدراسة',
  'قيد التطوير',
  'قيد التحكيم',
  'معتمد',
  'مطبق',
  'مؤجل',
]

export const PROTOTYPE_TEMPLATES = [
  {
    id: 'service-blueprint',
    name: 'Service Blueprint',
    focus: 'رحلة الخدمة ونقاط التحسين التشغيلية',
  },
  {
    id: 'digital-mvp',
    name: 'Digital MVP',
    focus: 'إطلاق نسخة رقمية أولية سريعة',
  },
  {
    id: 'policy-redesign',
    name: 'Policy Redesign',
    focus: 'تحسين الإجراء والامتثال والجودة',
  },
  {
    id: 'patient-experience',
    name: 'Patient Experience Sprint',
    focus: 'رفع تجربة ورضا المستفيدين',
  },
]

export const BENCHMARK_CATALOG = [
  {
    id: 'BM-001',
    solution: 'Mayo Clinic - Digital Triage Pathway',
    country: 'USA',
    tags: ['فرز', 'طوارئ', 'رحلة المريض', 'رقمنة'],
  },
  {
    id: 'BM-002',
    solution: 'NHS - Outpatient Flow Optimization',
    country: 'UK',
    tags: ['عيادات', 'تشغيل', 'انتظار', 'جودة'],
  },
  {
    id: 'BM-003',
    solution: 'Singapore Health - Smart Staff Scheduling',
    country: 'Singapore',
    tags: ['موارد بشرية', 'جداول', 'تشغيل', 'ذكاء اصطناعي'],
  },
  {
    id: 'BM-004',
    solution: 'Cleveland Clinic - Predictive Quality Alerts',
    country: 'USA',
    tags: ['جودة', 'تنبيهات', 'تحليلات', 'سلامة'],
  },
  {
    id: 'BM-005',
    solution: 'Karolinska - Lean Surgical Throughput',
    country: 'Sweden',
    tags: ['عمليات', 'تدفق', 'هدر', 'تشغيلي'],
  },
]

export const EXECUTIVE_SCOPE = [
  {
    id: 'journey',
    title: 'رحلة ابتكار معيارية',
    note: 'من الفكرة حتى التطبيق',
  },
  {
    id: 'prototype_builder',
    title: 'Prototype Builder',
    note: 'قوالب جاهزة للعرض',
  },
  {
    id: 'workspace',
    title: 'Innovation Workspace',
    note: 'تعاون المهام والتعليقات',
  },
  {
    id: 'maturity',
    title: 'Idea Maturity Score',
    note: 'تقييم موضوعي للنضج',
  },
  {
    id: 'impact',
    title: 'Impact Simulator',
    note: 'محاكاة الوقت والتكلفة',
  },
  {
    id: 'benchmarking',
    title: 'Global Benchmarking',
    note: 'مقارنة مع حلول عالمية',
  },
  {
    id: 'analytics',
    title: 'Dashboard & Analytics',
    note: 'مؤشرات أداء قيادية',
  },
  {
    id: 'rewards',
    title: 'Rewards & Gamification',
    note: 'تحفيز المشاركة والجودة',
  },
  {
    id: 'marketplace',
    title: 'Internal Marketplace',
    note: 'عرض الحلول القابلة للتطبيق',
  },
]

export const DEFAULT_STATE = {
  meta: {
    orgName: 'التجمع الصحي بالطائف',
    visionYear: '2030',
    appVersion: 'V3',
    lastUpdated: new Date().toISOString(),
  },
  engagement: {
    points: 42,
    contributors: 18,
  },
  initiatives: [
    {
      id: 'IS-101',
      title: 'تحسين مسار التحويل بين المرافق',
      challengeType: 'تشغيلي',
      owner: 'فريق التنسيق السريري',
      organization: 'إدارة التحسين المستمر',
      stage: 'التقييم',
      status: 'قيد التحكيم',
      description:
        'تقليل زمن التحويل الداخلي عبر توحيد بروتوكول القرار وتفعيل إشعار رقمي فوري.',
      maturity: {
        clarity: 82,
        feasibility: 76,
        value: 88,
        readiness: 64,
        riskHandling: 62,
      },
      risk: {
        operational: 3,
        financial: 2,
        technical: 2,
        compliance: 2,
      },
      prototype: {
        template: 'service-blueprint',
        progress: 45,
        lastOutput: '',
      },
      impact: {
        costSaving: 220000,
        timeSaving: 24,
        qualityImprovement: 18,
        satisfaction: 14,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-101-1',
            text: 'توثيق رحلة التحويل الحالية',
            done: true,
          },
          {
            id: 'TSK-101-2',
            text: 'تصميم نموذج التحويل الموحد',
            done: false,
          },
        ],
        comments: [
          {
            id: 'COM-101-1',
            author: 'قائد المشروع',
            text: 'تم اعتماد نطاق المرحلة الأولى.',
            at: '2026-02-14T09:45:00.000Z',
          },
        ],
      },
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: '2026-02-16T11:10:00.000Z',
    },
    {
      id: 'IS-102',
      title: 'مساعد رقمي لفرز استفسارات الموظفين',
      challengeType: 'موارد بشرية',
      owner: 'فريق تجربة الموظف',
      organization: 'إدارة الموارد البشرية',
      stage: 'النموذج الأولي',
      status: 'قيد التطوير',
      description:
        'بناء مساعد ذكي يقلل وقت الرد ويزيد دقة تحويل الطلبات الداخلية للجهات الصحيحة.',
      maturity: {
        clarity: 74,
        feasibility: 70,
        value: 79,
        readiness: 58,
        riskHandling: 60,
      },
      risk: {
        operational: 2,
        financial: 2,
        technical: 3,
        compliance: 2,
      },
      prototype: {
        template: 'digital-mvp',
        progress: 62,
        lastOutput: '',
      },
      impact: {
        costSaving: 175000,
        timeSaving: 28,
        qualityImprovement: 20,
        satisfaction: 17,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-102-1',
            text: 'تجربة النموذج على 3 إدارات',
            done: false,
          },
        ],
        comments: [],
      },
      createdAt: '2026-02-11T07:00:00.000Z',
      updatedAt: '2026-02-16T14:05:00.000Z',
    },
    {
      id: 'IS-103',
      title: 'نموذج متابعة جودة المواعيد الجراحية',
      challengeType: 'جودة',
      owner: 'فريق الجودة السريرية',
      organization: 'إدارة الجودة',
      stage: 'الاعتماد',
      status: 'معتمد',
      description:
        'لوحة متابعة تتنبأ بالتعثر في جداول العمليات وتقترح تدخلات استباقية.',
      maturity: {
        clarity: 91,
        feasibility: 83,
        value: 90,
        readiness: 78,
        riskHandling: 75,
      },
      risk: {
        operational: 2,
        financial: 1,
        technical: 2,
        compliance: 2,
      },
      prototype: {
        template: 'policy-redesign',
        progress: 80,
        lastOutput: '',
      },
      impact: {
        costSaving: 290000,
        timeSaving: 31,
        qualityImprovement: 27,
        satisfaction: 21,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-103-1',
            text: 'اعتماد السياسات النهائية',
            done: true,
          },
        ],
        comments: [
          {
            id: 'COM-103-1',
            author: 'مكتب التحول',
            text: 'يرجى تجهيز خطة إطلاق لمدة 90 يوم.',
            at: '2026-02-15T10:20:00.000Z',
          },
        ],
      },
      createdAt: '2026-01-30T10:00:00.000Z',
      updatedAt: '2026-02-17T06:30:00.000Z',
    },
    {
      id: 'IS-104',
      title: 'تحسين تجربة المريض في العيادات التخصصية',
      challengeType: 'تجربة مريض',
      owner: 'فريق تجربة المستفيد',
      organization: 'إدارة تجربة المريض',
      stage: 'التجربة',
      status: 'قيد التطوير',
      description:
        'تقليل نقاط التعثر في رحلة المريض عبر جدولة مرنة ورسائل استباقية.',
      maturity: {
        clarity: 79,
        feasibility: 72,
        value: 84,
        readiness: 66,
        riskHandling: 61,
      },
      risk: {
        operational: 3,
        financial: 2,
        technical: 2,
        compliance: 3,
      },
      prototype: {
        template: 'patient-experience',
        progress: 68,
        lastOutput: '',
      },
      impact: {
        costSaving: 205000,
        timeSaving: 26,
        qualityImprovement: 24,
        satisfaction: 22,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-104-1',
            text: 'جمع ملاحظات 50 مراجع',
            done: false,
          },
        ],
        comments: [],
      },
      createdAt: '2026-02-02T12:00:00.000Z',
      updatedAt: '2026-02-17T08:12:00.000Z',
    },
    {
      id: 'IS-105',
      title: 'أتمتة طلبات الصيانة الطبية',
      challengeType: 'تقني',
      owner: 'فريق الهندسة الطبية',
      organization: 'إدارة التقنية',
      stage: 'التطبيق',
      status: 'مطبق',
      description:
        'منصة طلبات موحدة تقلل زمن الاستجابة وتتابع حالة الأجهزة الحيوية بشكل لحظي.',
      maturity: {
        clarity: 94,
        feasibility: 86,
        value: 92,
        readiness: 88,
        riskHandling: 82,
      },
      risk: {
        operational: 1,
        financial: 1,
        technical: 2,
        compliance: 1,
      },
      prototype: {
        template: 'digital-mvp',
        progress: 100,
        lastOutput: '',
      },
      impact: {
        costSaving: 340000,
        timeSaving: 36,
        qualityImprovement: 29,
        satisfaction: 25,
      },
      benchmark: {
        lastRun: null,
        topMatches: [],
      },
      workspace: {
        tasks: [
          {
            id: 'TSK-105-1',
            text: 'قياس الأثر بعد الإطلاق',
            done: true,
          },
        ],
        comments: [
          {
            id: 'COM-105-1',
            author: 'العمليات',
            text: 'أثر واضح في سرعة الاستجابة خلال الربع الحالي.',
            at: '2026-02-16T08:10:00.000Z',
          },
        ],
      },
      createdAt: '2026-01-20T09:30:00.000Z',
      updatedAt: '2026-02-17T10:00:00.000Z',
    },
  ],
}
