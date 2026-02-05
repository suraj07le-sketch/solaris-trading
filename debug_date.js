
const testDateLogic = () => {
    // Current approach in page.tsx
    const currentDate = new Date();
    const istDate = new Date(currentDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayDateLocal = istDate.toISOString().split('T')[0];

    // Recommended approach
    const todayDateCorrect = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    console.log("Current todayDate (via toLocaleString):", todayDateLocal);
    console.log("Recommended todayDate (via en-CA):", todayDateCorrect);

    // Filter logic test
    const targetDateStr = "2026-02-05T18:13:30.000Z"; // Suppose this is in DB
    const predDate = new Date(targetDateStr);
    const istPart = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(predDate);

    console.log("\nDB Date (UTC):", targetDateStr);
    console.log("DB Date (IST Part):", istPart);
    console.log("Match with current todayDate:", istPart === todayDateLocal);
    console.log("Match with recommended todayDate:", istPart === todayDateCorrect);
};

testDateLogic();
