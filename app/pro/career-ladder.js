(() => {
    "use strict";

    const LADDER = [
        { level: 1, name: "مشارك جديد", min: 0, req: "تسجيل مبادرة واحدة" },
        { level: 2, name: "مبادر", min: 90, req: "مبادرتان + نشاط مستمر" },
        { level: 3, name: "مبادر متقدم", min: 180, req: "مبادرة قيد تحكيم أو أعلى" },
        { level: 4, name: "قائد ابتكار", min: 300, req: "اعتماد مبادرة واحدة" },
        { level: 5, name: "نخبة الابتكار", min: 450, req: "أثر مؤسسي واضح" }
    ];

    function getLevel(points) {
        return LADDER.slice().reverse().find(l => points >= l.min) || LADDER[0];
    }

    window.CareerLadder = { LADDER, getLevel };
})();