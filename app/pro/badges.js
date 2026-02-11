(() => {
  "use strict";

  function levelFrom(points){
    if(points >= 450) return { name:"نخبة الابتكار", next: 600 };
    if(points >= 300) return { name:"قائد ابتكار", next: 450 };
    if(points >= 180) return { name:"مبادر متقدم", next: 300 };
    if(points >= 90)  return { name:"مبادر", next: 180 };
    return { name:"مشارك جديد", next: 90 };
  }

  function computeBadges(stats){
    const b = [];
    if(stats.total >= 1) b.push({ t:"أول مبادرة", d:"تسجيل أول مبادرة داخل المنصة" });
    if(stats.total >= 5) b.push({ t:"نشط", d:"تسجيل 5 مبادرات" });
    if(stats.wins >= 1)  b.push({ t:"معتمد", d:"اعتماد مبادرة واحدة على الأقل" });
    if(stats.wins >= 3)  b.push({ t:"حاصد الاعتماد", d:"اعتماد 3 مبادرات" });
    if(stats.review >= 2) b.push({ t:"قيد الحسم", d:"مبادرات متعددة تحت التحكيم" });
    if(stats.impact >= 1) b.push({ t:"صانع أثر", d:"وصول مبادرة إلى مرحلة الأثر" });
    if(stats.points >= 200) b.push({ t:"نقاط ثقيلة", d:"تجاوز 200 نقطة" });
    return b;
  }

  window.Badges = { levelFrom, computeBadges };
})();