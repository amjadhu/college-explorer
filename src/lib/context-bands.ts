/** Threshold definitions for interpreting stats in plain language. */

export type Band = {
  label: string;
  description: string;
};

function findBand<T extends number>(value: T, bands: Array<{ max: T; band: Band }>): Band {
  for (const { max, band } of bands) {
    if (value <= max) return band;
  }
  return bands[bands.length - 1].band;
}

// ---- Admission Rate (0-1 decimal) ----
export function admissionBand(rate: number): Band {
  return findBand(rate, [
    { max: 0.1, band: { label: "Extremely selective", description: "Strong grades and test scores are table stakes — most qualified applicants are turned away" } },
    { max: 0.2, band: { label: "Highly selective", description: "Admits roughly 1 in 5 applicants — you need a compelling application beyond just numbers" } },
    { max: 0.35, band: { label: "Very selective", description: "Competitive but achievable with strong academics and meaningful extracurriculars" } },
    { max: 0.5, band: { label: "Selective", description: "A solid student with good grades has a realistic shot" } },
    { max: 0.7, band: { label: "Moderately selective", description: "Admits most students who meet academic requirements" } },
    { max: 1.0, band: { label: "Accessible", description: "Welcomes most applicants — focus on fit rather than getting in" } },
  ]);
}

// ---- SAT Average Score ----
export function satBand(score: number): Band {
  return findBand(score, [
    { max: 1000, band: { label: "Below average", description: "Scores are below the national average — test-optional policies may help" } },
    { max: 1200, band: { label: "Average", description: "Scores are around the national average for college-bound students" } },
    { max: 1350, band: { label: "Above average", description: "Students here score well above average — solid test prep recommended" } },
    { max: 1450, band: { label: "Very competitive", description: "Students typically score in the top 5-10% nationally" } },
    { max: 1600, band: { label: "Exceptional", description: "Near-perfect scores are common — testing is a strength of this student body" } },
  ]);
}

// ---- Cost (net price) ----
export function costBand(netPrice: number): Band {
  return findBand(netPrice, [
    { max: 10000, band: { label: "Very affordable", description: "Extremely low net cost — strong financial aid or public in-state pricing" } },
    { max: 20000, band: { label: "Affordable", description: "Reasonable cost that many families can manage with some planning" } },
    { max: 35000, band: { label: "Moderate", description: "A meaningful investment — worth checking financial aid packages carefully" } },
    { max: 50000, band: { label: "Expensive", description: "Significant cost — make sure to compare net price after aid, not sticker price" } },
    { max: Infinity, band: { label: "Premium-priced", description: "Among the most expensive options — financial aid and ROI are critical to evaluate" } },
  ]);
}

// ---- Median Earnings (10 year) ----
export function earningsBand(earnings: number): Band {
  return findBand(earnings, [
    { max: 35000, band: { label: "Below average", description: "Graduates earn less than the national median — career services and major choice matter a lot here" } },
    { max: 50000, band: { label: "Average", description: "Earnings are in line with typical college graduates" } },
    { max: 70000, band: { label: "Above average", description: "Graduates do well financially — reflects strong career placement" } },
    { max: 90000, band: { label: "Strong", description: "Graduates earn significantly more than average — the degree carries real economic weight" } },
    { max: Infinity, band: { label: "Exceptional", description: "Among the highest earning graduates nationally — strong return on investment" } },
  ]);
}

// ---- Retention Rate (0-1 decimal) ----
export function retentionBand(rate: number): Band {
  return findBand(rate, [
    { max: 0.7, band: { label: "Concerning", description: "More than 30% of freshmen don't return — worth asking why students leave" } },
    { max: 0.8, band: { label: "Below average", description: "Some students don't return after freshman year — look into student support services" } },
    { max: 0.9, band: { label: "Good", description: "Most freshmen return — students generally find the experience worth continuing" } },
    { max: 0.95, band: { label: "Strong", description: "Very few students leave — indicates high satisfaction and strong community" } },
    { max: 1.0, band: { label: "Excellent", description: "Nearly all students return — a sign that students are thriving" } },
  ]);
}

// ---- Graduation Rate (0-1 decimal) ----
export function graduationBand(rate: number): Band {
  return findBand(rate, [
    { max: 0.5, band: { label: "Low", description: "Fewer than half of students graduate — understand the support systems in place" } },
    { max: 0.65, band: { label: "Below average", description: "Graduation rate is below the national average for 4-year colleges" } },
    { max: 0.8, band: { label: "Good", description: "Most students graduate — solid completion rate" } },
    { max: 0.9, band: { label: "Strong", description: "High graduation rate — students who start here tend to finish" } },
    { max: 1.0, band: { label: "Excellent", description: "Nearly everyone graduates — strong academic support and student commitment" } },
  ]);
}

// ---- Student-Faculty Ratio ----
export function ratioband(ratio: number): Band {
  return findBand(ratio, [
    { max: 8, band: { label: "Very small classes", description: "Exceptionally low ratio — expect close mentorship and personalized attention" } },
    { max: 12, band: { label: "Small classes", description: "Professors know your name — ideal for students who want close faculty relationships" } },
    { max: 18, band: { label: "Moderate", description: "A mix of small seminars and larger lectures — typical for strong universities" } },
    { max: 25, band: { label: "Larger classes", description: "More students per professor — you may need to be proactive about office hours" } },
    { max: Infinity, band: { label: "Large classes", description: "High student-to-faculty ratio — expect larger lectures, especially in early years" } },
  ]);
}

// ---- Crime Rate (per 1000 students) ----
export function crimeRateBand(rate: number): Band {
  return findBand(rate, [
    { max: 1, band: { label: "Very low", description: "Extremely few reported incidents — campus feels very safe" } },
    { max: 3, band: { label: "Low", description: "Below-average crime rate — typical for well-secured campuses" } },
    { max: 6, band: { label: "Moderate", description: "Around average for college campuses — standard safety measures in place" } },
    { max: 10, band: { label: "Above average", description: "Higher than typical — worth reviewing specific incident types and campus safety resources" } },
    { max: Infinity, band: { label: "High", description: "Well above average — look closely at safety resources and the types of incidents reported" } },
  ]);
}

// ---- Debt at graduation ----
export function debtBand(debt: number): Band {
  return findBand(debt, [
    { max: 15000, band: { label: "Very manageable", description: "Low debt burden — monthly payments will be very reasonable after graduation" } },
    { max: 25000, band: { label: "Manageable", description: "Around the national average — payments should be comfortable with typical starting salary" } },
    { max: 35000, band: { label: "Moderate", description: "Above average debt — factor loan payments into post-graduation budget planning" } },
    { max: 50000, band: { label: "Heavy", description: "Significant debt load — make sure expected earnings can support the payments" } },
    { max: Infinity, band: { label: "Very heavy", description: "Well above average — carefully compare the return on investment before committing" } },
  ]);
}
