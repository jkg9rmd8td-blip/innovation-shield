(() => {
    "use strict";

    function build(stats) {
        const tips = [];
        if (stats.total === 0) tips.push("ابدأ بتسجيل مبادرتك الأولى.");
        if (stats.review > 0) tips.push("تابع مبادراتك تحت التحكيم.");
        if (stats.wins === 0 && stats.total >= 3) tips.push("ارفع جودة العرض للوصول للاعتماد.");
        if (stats.impact === 0 && stats.wins > 0) tips.push("ابدأ مرحلة قياس الأثر.");
        if (stats.points < 90) tips.push("أكمل مهام أكثر لرفع النقاط.");
        return tips;
    }

    window.Recommendations = { build };
})();