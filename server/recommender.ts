import type {
  LabMarkers,
  ProgramRecommendation,
  PeptideRec,
  HormoneRec,
  DietPlan,
  MealPlan,
  ExercisePlan,
  ExerciseSplit,
  MarkerStatus,
} from "@shared/schema";

interface ProfileInfo {
  age: number;
  gender: string;
  goals: string[];
  weight?: number | null;
  height?: number | null;
}

interface OptimalRange {
  name: string;
  key: keyof LabMarkers;
  unit: string;
  optimalLow: number;
  optimalHigh: number;
  maleLow?: number;
  maleHigh?: number;
  femaleLow?: number;
  femaleHigh?: number;
}

const markerRanges: OptimalRange[] = [
  { name: "Total Testosterone", key: "totalTestosterone", unit: "ng/dL", optimalLow: 400, optimalHigh: 900, maleLow: 400, maleHigh: 900, femaleLow: 15, femaleHigh: 70 },
  { name: "Free Testosterone", key: "freeTestosterone", unit: "pg/mL", optimalLow: 9, optimalHigh: 25, maleLow: 9, maleHigh: 25, femaleLow: 0.5, femaleHigh: 5 },
  { name: "IGF-1", key: "igf1", unit: "ng/mL", optimalLow: 150, optimalHigh: 300 },
  { name: "hs-CRP", key: "hsCRP", unit: "mg/L", optimalLow: 0, optimalHigh: 1.0 },
  { name: "HbA1c", key: "hba1c", unit: "%", optimalLow: 4.0, optimalHigh: 5.4 },
  { name: "TSH", key: "tsh", unit: "mIU/L", optimalLow: 1.0, optimalHigh: 2.5 },
  { name: "Free T3", key: "freeT3", unit: "pg/mL", optimalLow: 3.0, optimalHigh: 4.2 },
  { name: "Free T4", key: "freeT4", unit: "ng/dL", optimalLow: 1.0, optimalHigh: 1.7 },
  { name: "Cortisol", key: "cortisol", unit: "mcg/dL", optimalLow: 6, optimalHigh: 18 },
  { name: "DHEA-S", key: "dheas", unit: "mcg/dL", optimalLow: 150, optimalHigh: 400 },
  { name: "Estradiol", key: "estradiol", unit: "pg/mL", optimalLow: 15, optimalHigh: 35, maleLow: 15, maleHigh: 35, femaleLow: 30, femaleHigh: 400 },
  { name: "Vitamin D", key: "vitaminD", unit: "ng/mL", optimalLow: 40, optimalHigh: 80 },
  { name: "Vitamin B12", key: "vitaminB12", unit: "pg/mL", optimalLow: 400, optimalHigh: 900 },
  { name: "Ferritin", key: "ferritin", unit: "ng/mL", optimalLow: 50, optimalHigh: 200 },
  { name: "Magnesium", key: "magnesium", unit: "mg/dL", optimalLow: 1.8, optimalHigh: 2.3 },
  { name: "Fasting Glucose", key: "fastingGlucose", unit: "mg/dL", optimalLow: 72, optimalHigh: 90 },
  { name: "Fasting Insulin", key: "fastingInsulin", unit: "uIU/mL", optimalLow: 2, optimalHigh: 7 },
  { name: "Homocysteine", key: "homocysteine", unit: "umol/L", optimalLow: 5, optimalHigh: 9 },
  { name: "Total Cholesterol", key: "totalCholesterol", unit: "mg/dL", optimalLow: 150, optimalHigh: 200 },
  { name: "LDL", key: "ldl", unit: "mg/dL", optimalLow: 50, optimalHigh: 100 },
  { name: "HDL", key: "hdl", unit: "mg/dL", optimalLow: 50, optimalHigh: 90 },
  { name: "Triglycerides", key: "triglycerides", unit: "mg/dL", optimalLow: 40, optimalHigh: 100 },
  { name: "SHBG", key: "shbg", unit: "nmol/L", optimalLow: 20, optimalHigh: 50 },
];

function getOptimalRange(range: OptimalRange, gender: string): { low: number; high: number } {
  if (gender === "male" && range.maleLow !== undefined && range.maleHigh !== undefined) {
    return { low: range.maleLow, high: range.maleHigh };
  }
  if (gender === "female" && range.femaleLow !== undefined && range.femaleHigh !== undefined) {
    return { low: range.femaleLow, high: range.femaleHigh };
  }
  return { low: range.optimalLow, high: range.optimalHigh };
}

function calcZScore(value: number, low: number, high: number): number {
  const mid = (low + high) / 2;
  const range = (high - low) / 2;
  if (range === 0) return 0;
  return (value - mid) / range;
}

export function analyzeMarkers(markers: LabMarkers, profile: ProfileInfo): MarkerStatus[] {
  const statuses: MarkerStatus[] = [];

  for (const range of markerRanges) {
    const val = markers[range.key];
    if (val === undefined || val === null) continue;

    const { low, high } = getOptimalRange(range, profile.gender);
    const z = calcZScore(val as number, low, high);
    const absZ = Math.abs(z);

    let status: "optimal" | "suboptimal" | "critical";
    if (absZ <= 1) status = "optimal";
    else if (absZ <= 2) status = "suboptimal";
    else status = "critical";

    statuses.push({
      name: range.name,
      value: val as number,
      unit: range.unit,
      optimalLow: low,
      optimalHigh: high,
      status,
      zScore: Math.round(z * 100) / 100,
    });
  }

  return statuses;
}

export function generateProgram(
  markers: LabMarkers,
  profile: ProfileInfo,
): ProgramRecommendation {
  const statuses = analyzeMarkers(markers, profile);
  const peptides: PeptideRec[] = [];
  const hormones: HormoneRec[] = [];

  const igf1 = markers.igf1;
  if (igf1 !== undefined && igf1 < 150) {
    peptides.push({
      name: "CJC-1295 / Ipamorelin",
      dosage: "CJC-1295 100mcg + Ipamorelin 100-200mcg subcutaneous",
      timing: "Nightly before bed",
      rationale: `IGF-1 at ${igf1} ng/mL is below optimal (>150). CJC-1295 with DAC combined with Ipamorelin stimulates pulsatile GH release, increasing IGF-1 levels for improved recovery, body composition, and cellular repair.`,
      risks: [
        "Water retention initially",
        "Potential for increased hunger",
        "May affect glucose metabolism — monitor if pre-diabetic",
        "Research-use compound — requires physician oversight",
      ],
      synergies: [
        "Synergistic with resistance training for muscle growth",
        "Improved deep sleep quality amplifies natural GH pulsatility",
      ],
    });
  }

  const hsCRP = markers.hsCRP;
  if (hsCRP !== undefined && hsCRP > 2.0) {
    peptides.push({
      name: "BPC-157 + TB-500",
      dosage: "BPC-157 250-500mcg + TB-500 750mcg subcutaneous",
      timing: "Daily, AM dosing",
      rationale: `hs-CRP at ${hsCRP} mg/L indicates elevated systemic inflammation. BPC-157 promotes tissue repair via VEGF pathways; TB-500 (Thymosin Beta-4) modulates inflammation and promotes healing.`,
      risks: [
        "Limited long-term human safety data",
        "May affect blood pressure regulation",
        "Research-use classification in most jurisdictions",
      ],
      synergies: [
        "Combined anti-inflammatory effect greater than either alone",
        "Supports gut healing if GI inflammation is a contributor",
      ],
    });
  }

  const hba1c = markers.hba1c;
  if (hba1c !== undefined && hba1c > 5.7) {
    peptides.push({
      name: "Semaglutide / Tirzepatide",
      dosage: "Semaglutide 0.25mg weekly, titrate to 1.0mg (or Tirzepatide 2.5mg weekly)",
      timing: "Weekly subcutaneous injection",
      rationale: `HbA1c at ${hba1c}% indicates pre-diabetic glucose metabolism. GLP-1 receptor agonists improve insulin sensitivity, reduce appetite, and lower cardiovascular risk.`,
      risks: [
        "GI side effects (nausea, decreased appetite) common initially",
        "Risk of pancreatitis — discontinue if severe abdominal pain",
        "Requires prescription — not research-use",
        "Contraindicated with personal/family history of medullary thyroid cancer",
      ],
      synergies: [
        "Enhanced fat loss when combined with protein-prioritized diet",
        "Improved metabolic markers compound cardiovascular benefit",
      ],
    });
  }

  const cortisol = markers.cortisol;
  if (cortisol !== undefined && cortisol > 20 && peptides.length < 3) {
    peptides.push({
      name: "DSIP (Delta Sleep-Inducing Peptide)",
      dosage: "100-200mcg subcutaneous",
      timing: "30 minutes before sleep",
      rationale: `Cortisol at ${cortisol} mcg/dL is elevated. DSIP helps normalize cortisol circadian rhythm and improve sleep architecture, supporting HPA axis recovery.`,
      risks: [
        "Very limited human clinical data",
        "May cause drowsiness — use only at bedtime",
        "Research-use only",
      ],
      synergies: [
        "Works synergistically with Ipamorelin for GH-enhancing sleep",
        "Improved sleep lowers cortisol naturally",
      ],
    });
  }

  while (peptides.length > 3) peptides.pop();

  const totalT = markers.totalTestosterone;
  if (totalT !== undefined && profile.gender === "male" && totalT < 350) {
    hormones.push({
      name: "Enclomiphene",
      dosage: "12.5-25mg daily oral",
      rationale: `Total Testosterone at ${totalT} ng/dL is below therapeutic threshold. Enclomiphene selectively blocks estrogen negative feedback at the pituitary, stimulating endogenous LH/FSH production and testosterone synthesis — preserving fertility.`,
      monitoring: [
        "Recheck Total T, Free T, E2, LH, FSH at 6 weeks",
        "Monitor liver enzymes (ALT/AST) quarterly",
        "Track subjective symptoms (energy, libido, mood)",
      ],
    });

    hormones.push({
      name: "Gonadorelin",
      dosage: "100mcg subcutaneous 2x/week",
      rationale: "Supports pulsatile GnRH signaling to maintain testicular function and fertility alongside Enclomiphene or as standalone if Enclomiphene is not tolerated.",
      monitoring: [
        "LH/FSH response at 4 weeks",
        "Testicular volume assessment if applicable",
      ],
    });
  }

  const freeT3 = markers.freeT3;
  const tsh = markers.tsh;
  if (freeT3 !== undefined && freeT3 < 2.5) {
    hormones.push({
      name: "Thyroid Support Assessment",
      dosage: "Evaluate with endocrinologist — possible low-dose T3 supplementation",
      rationale: `Free T3 at ${freeT3} pg/mL suggests suboptimal thyroid conversion. Assess for selenium/zinc deficiency, reverse T3, and conversion issues before supplementation.`,
      monitoring: [
        "Full thyroid panel (TSH, Free T3, Free T4, RT3, thyroid antibodies)",
        "Monitor heart rate and bone density markers",
      ],
    });
  }

  const weight = profile.weight || 170;
  const bmr = profile.gender === "male"
    ? 10 * (weight * 0.453592) + 6.25 * ((profile.height || 70) * 2.54) - 5 * profile.age + 5
    : 10 * (weight * 0.453592) + 6.25 * ((profile.height || 65) * 2.54) - 5 * profile.age - 161;

  let activityMultiplier = 1.55;
  if (profile.goals.includes("fat_loss")) activityMultiplier = 1.4;
  if (profile.goals.includes("muscle_gain")) activityMultiplier = 1.7;

  const tdee = Math.round(bmr * activityMultiplier);
  let calories = tdee;
  if (profile.goals.includes("fat_loss")) calories = Math.round(tdee * 0.8);
  if (profile.goals.includes("muscle_gain")) calories = Math.round(tdee * 1.1);

  const proteinPerLb = profile.goals.includes("muscle_gain") ? 1.0 : 0.8;
  const proteinG = Math.round(weight * proteinPerLb);
  const fatG = Math.round((calories * 0.3) / 9);
  const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals: MealPlan[] = days.map((day) => ({
    day,
    breakfast: getBreakfast(day, profile),
    lunch: getLunch(day, profile),
    dinner: getDinner(day, profile),
    snacks: getSnack(day, profile),
  }));

  const diet: DietPlan = {
    calories,
    proteinG,
    carbsG,
    fatG,
    meals,
    notes: getDietNotes(markers, profile),
  };

  const exercise = buildExercisePlan(profile, markers);

  const generalNotes: string[] = [
    "Retest all labs after 90 days to assess progress and adjust protocol.",
    "Prioritize 7-9 hours of quality sleep — this is the single most impactful intervention.",
    "Stay hydrated: aim for 0.5oz per pound of bodyweight daily.",
    "Manage stress through meditation, breathwork, or cold exposure protocols.",
  ];

  if (markers.vitaminD !== undefined && markers.vitaminD < 40) {
    generalNotes.push(
      `Vitamin D at ${markers.vitaminD} ng/mL is suboptimal. Supplement 5000 IU D3 + K2 daily with a fat-containing meal.`,
    );
  }
  if (markers.magnesium !== undefined && markers.magnesium < 1.8) {
    generalNotes.push(
      `Magnesium at ${markers.magnesium} mg/dL is low. Supplement Magnesium Glycinate 400mg before bed.`,
    );
  }

  return {
    peptides,
    hormones,
    diet,
    exercise,
    generalNotes,
    cycleGuidance:
      "Cycle peptides 8-12 weeks on, 4 weeks off, then retest labs before resuming. This allows receptor resensitization and safety monitoring.",
  };
}

function getBreakfast(day: string, profile: ProfileInfo): string {
  const breakfasts = [
    "4-egg omelet with spinach, mushrooms, and avocado. Side of berries.",
    "Greek yogurt parfait with walnuts, chia seeds, and mixed berries.",
    "Protein smoothie: whey isolate, banana, almond butter, spinach, almond milk.",
    "Smoked salmon on sourdough with cream cheese, capers, and microgreens.",
    "Steel-cut oats with collagen peptides, almond butter, and blueberries.",
    "Turkey sausage scramble with bell peppers, onions, and sweet potato hash.",
    "Cottage cheese bowl with pineapple, hemp seeds, and a drizzle of honey.",
  ];
  return breakfasts[["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(day)] || breakfasts[0];
}

function getLunch(day: string, profile: ProfileInfo): string {
  const lunches = [
    "Grilled chicken salad with mixed greens, quinoa, cherry tomatoes, cucumber, olive oil dressing.",
    "Wild-caught salmon bowl with brown rice, edamame, avocado, and sesame ginger sauce.",
    "Turkey and avocado wrap with mixed greens, hummus, and roasted red peppers.",
    "Grass-fed beef stir-fry with broccoli, snap peas, and cauliflower rice.",
    "Mediterranean bowl: falafel, tabbouleh, hummus, pickled vegetables, and tahini.",
    "Shrimp tacos with cabbage slaw, black beans, and chipotle lime crema.",
    "Chicken bone broth soup with vegetables, lentils, and fresh herbs.",
  ];
  return lunches[["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(day)] || lunches[0];
}

function getDinner(day: string, profile: ProfileInfo): string {
  const dinners = [
    "Pan-seared salmon with roasted asparagus and sweet potato mash.",
    "Grass-fed ribeye steak with roasted Brussels sprouts and garlic mashed cauliflower.",
    "Baked chicken thighs with Mediterranean vegetables and quinoa pilaf.",
    "Wild-caught cod with lemon-caper sauce, sauteed spinach, and roasted potatoes.",
    "Slow-cooker pulled pork with coleslaw and baked beans (lower sugar).",
    "Grilled shrimp skewers with zucchini noodles and pesto sauce.",
    "Herb-roasted whole chicken with root vegetables and mixed green salad.",
  ];
  return dinners[["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(day)] || dinners[0];
}

function getSnack(day: string, profile: ProfileInfo): string {
  const snacks = [
    "Apple slices with almond butter; handful of walnuts.",
    "Protein bar (low sugar); celery with hummus.",
    "Hard-boiled eggs (2); mixed berries.",
    "Beef jerky (grass-fed); carrot sticks with guacamole.",
    "Protein shake post-workout; handful of almonds.",
    "Greek yogurt with granola; dark chocolate square (85%+).",
    "Trail mix (nuts, seeds, coconut flakes); banana.",
  ];
  return snacks[["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(day)] || snacks[0];
}

function getDietNotes(markers: LabMarkers, profile: ProfileInfo): string[] {
  const notes: string[] = [
    "Prioritize whole, unprocessed foods. Aim for 25-35g fiber daily.",
    "Include omega-3 rich foods (wild salmon, sardines, walnuts) 3-4x/week.",
  ];

  if (markers.hsCRP && markers.hsCRP > 1.5) {
    notes.push("Focus on anti-inflammatory foods: turmeric, ginger, green leafy vegetables, fatty fish. Minimize refined sugars and seed oils.");
  }
  if (markers.hba1c && markers.hba1c > 5.4) {
    notes.push("Limit refined carbohydrates and added sugars. Time carb intake around workouts. Consider 16:8 intermittent fasting window.");
  }
  if (profile.goals.includes("muscle_gain")) {
    notes.push("Consume protein within 30 minutes post-training. Distribute protein evenly across 4-5 meals for optimal MPS.");
  }
  if (profile.goals.includes("fat_loss")) {
    notes.push("Maintain moderate caloric deficit (~20%). Prioritize protein to preserve lean mass during deficit.");
  }
  return notes;
}

function buildExercisePlan(profile: ProfileInfo, markers: LabMarkers): ExercisePlan {
  const goalsInclude = (g: string) => profile.goals.includes(g);

  let daysPerWeek = 4;
  if (goalsInclude("muscle_gain")) daysPerWeek = 5;
  if (goalsInclude("fat_loss")) daysPerWeek = 5;

  const splits: ExerciseSplit[] = [];

  if (goalsInclude("muscle_gain")) {
    splits.push(
      { day: "Monday", focus: "Upper Push", exercises: ["Bench Press 4x8", "Overhead Press 3x10", "Incline DB Press 3x12", "Lateral Raises 3x15", "Tricep Pushdowns 3x12"], duration: "60 min" },
      { day: "Tuesday", focus: "Lower Body", exercises: ["Back Squat 4x6", "Romanian Deadlift 3x10", "Leg Press 3x12", "Walking Lunges 3x12/leg", "Calf Raises 4x15"], duration: "60 min" },
      { day: "Wednesday", focus: "Active Recovery", exercises: ["20 min walk", "Mobility work / yoga", "Foam rolling"], duration: "30 min" },
      { day: "Thursday", focus: "Upper Pull", exercises: ["Weighted Pull-ups 4x6", "Barbell Rows 4x8", "Face Pulls 3x15", "Dumbbell Curls 3x12", "Hammer Curls 3x12"], duration: "60 min" },
      { day: "Friday", focus: "Legs & Core", exercises: ["Front Squat 4x8", "Hip Thrusts 3x12", "Leg Curls 3x12", "Plank 3x45s", "Cable Woodchops 3x12/side"], duration: "55 min" },
    );
  } else if (goalsInclude("fat_loss")) {
    splits.push(
      { day: "Monday", focus: "Full Body Strength", exercises: ["Goblet Squat 3x12", "Push-ups 3x15", "DB Rows 3x12", "Lunges 3x10/leg", "Plank 3x30s"], duration: "45 min" },
      { day: "Tuesday", focus: "HIIT Cardio", exercises: ["30s sprint / 60s walk x 10 rounds", "Jump rope intervals", "Burpees 3x10"], duration: "30 min" },
      { day: "Wednesday", focus: "Upper Body + Core", exercises: ["Overhead Press 3x10", "Lat Pulldown 3x12", "Push Press 3x8", "Russian Twists 3x20", "Dead Bugs 3x10/side"], duration: "45 min" },
      { day: "Thursday", focus: "Active Recovery", exercises: ["30 min walk", "Stretching routine", "Foam rolling"], duration: "30 min" },
      { day: "Friday", focus: "Lower Body + Cardio", exercises: ["Deadlift 3x8", "Step-ups 3x12/leg", "Kettlebell Swings 3x15", "Box Jumps 3x8", "Assault Bike 10 min"], duration: "50 min" },
    );
  } else {
    splits.push(
      { day: "Monday", focus: "Full Body A", exercises: ["Squat 3x8", "Bench Press 3x8", "Barbell Row 3x10", "Plank 3x30s"], duration: "50 min" },
      { day: "Wednesday", focus: "Full Body B", exercises: ["Deadlift 3x6", "Overhead Press 3x10", "Chin-ups 3xAMRAP", "Pallof Press 3x10/side"], duration: "50 min" },
      { day: "Friday", focus: "Full Body C", exercises: ["Front Squat 3x8", "Incline DB Press 3x12", "Cable Rows 3x12", "Farmers Walks 3x40m"], duration: "50 min" },
      { day: "Saturday", focus: "Mobility & Cardio", exercises: ["30 min zone 2 cardio", "Full body stretch routine", "Foam rolling"], duration: "45 min" },
    );
  }

  let cardio = "Zone 2 cardio (conversational pace) 3x/week for 30 minutes. Options: brisk walking, cycling, rowing, swimming.";
  if (goalsInclude("fat_loss")) {
    cardio = "Zone 2 cardio 3x/week for 30-45 min PLUS 2 HIIT sessions per week (20 min). Monitor heart rate to stay in target zones.";
  }

  const notes: string[] = [
    "Warm up 5-10 minutes before each session with dynamic stretching.",
    "Focus on progressive overload — increase weight or reps weekly.",
    "Rest 60-90 seconds between sets for hypertrophy, 2-3 minutes for strength.",
  ];

  if (markers.cortisol && markers.cortisol > 20) {
    notes.push("Elevated cortisol: Avoid excessive HIIT. Prioritize resistance training and zone 2 cardio to avoid further HPA axis stress.");
  }

  return { daysPerWeek, splits, cardio, notes };
}
