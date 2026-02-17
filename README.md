# Innovation Shield V3

منصة درع الابتكار - إعادة بناء كاملة من الصفر بنفس فكرة المشروع الأساسية، مع تحسين البنية وتجربة الاستخدام.

## الفكرة
منصة مؤسسية لإدارة الابتكار داخل التجمع الصحي بالطائف، تشمل:
- رحلة ابتكار معيارية من الفكرة إلى التطبيق.
- Prototype Builder لتوليد مخرجات عرض أولية.
- Innovation Workspace لإدارة المهام والتعليقات.
- Idea Maturity Score و Risk Index.
- Impact Simulator لمحاكاة الأثر المالي والزمني.
- Global Benchmarking بمقارنة الحلول العالمية.
- Marketplace داخلي لنشر المبادرات القابلة للتطبيق.

## التقنية
- Vite
- React
- LocalStorage (كطبقة بيانات أولية)

## التشغيل المحلي
```bash
npm install
npm run dev
```

## البناء للإنتاج
```bash
npm run build
npm run preview
```

## الهيكل
```text
src/
  App.jsx                # واجهة المنصة الكاملة
  App.css                # تصميم وهوية V3
  engine.js              # منطق النضج/المخاطر/الأثر/المقارنة
  innovationData.js      # بيانات البذور وتعريف الوحدات
  index.css              # إعدادات عامة وخطوط
  main.jsx               # نقطة التشغيل
```

## النشر على GitHub
بعد التأكد من البناء:
```bash
git add .
git commit -m "feat: rebuild innovation shield v3 from scratch"
git push origin main
```

## النشر على GitHub Pages
- تمت إضافة Workflow تلقائي للنشر في: `.github/workflows/deploy-pages.yml`.
- بعد كل `push` على `main` سيتم بناء المشروع ونشره على GitHub Pages.
- رابط الموقع المتوقع:
`https://jkg9rmd8td-blip.github.io/innovation-shield/`

## ملاحظة
تم حفظ النسخة السابقة في فرع:
`backup/legacy-pre-rebuild-20260217`
