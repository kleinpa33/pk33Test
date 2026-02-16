import { db } from "./db";
import { users } from "@shared/schema";
import { profiles, labResults, programs } from "@shared/schema";
import { generateProgram } from "./recommender";
import type { LabMarkers } from "@shared/schema";
import { eq } from "drizzle-orm";

const SAMPLE_PROFILES = [
  {
    userId: "sample-low-t-male",
    age: 38,
    gender: "male",
    goals: ["muscle_gain", "hormone_optimization"],
    weight: 185,
    height: 71,
    markers: {
      totalTestosterone: 280,
      freeTestosterone: 6.2,
      igf1: 120,
      hsCRP: 3.5,
      hba1c: 5.9,
      tsh: 2.1,
      freeT3: 3.2,
      cortisol: 14,
      vitaminD: 22,
      ferritin: 45,
      fastingGlucose: 105,
      estradiol: 28,
      shbg: 35,
      lh: 4.5,
      fsh: 5.2,
    } as Partial<LabMarkers>,
  },
  {
    userId: "sample-stress-female",
    age: 45,
    gender: "female",
    goals: ["longevity", "inflammation_reduction", "sleep_recovery"],
    weight: 140,
    height: 65,
    markers: {
      totalTestosterone: 35,
      estradiol: 85,
      igf1: 95,
      hsCRP: 4.8,
      hba1c: 5.3,
      tsh: 3.8,
      freeT3: 2.3,
      freeT4: 0.9,
      cortisol: 24,
      vitaminD: 18,
      vitaminB12: 280,
      magnesium: 1.5,
      fastingGlucose: 88,
      hdl: 62,
      progesterone: 0.3,
      dheas: 120,
    } as Partial<LabMarkers>,
  },
  {
    userId: "sample-metabolic-male",
    age: 32,
    gender: "male",
    goals: ["fat_loss", "metabolic_health"],
    weight: 220,
    height: 70,
    markers: {
      totalTestosterone: 620,
      freeTestosterone: 15,
      igf1: 210,
      hsCRP: 0.6,
      hba1c: 6.2,
      tsh: 1.8,
      freeT3: 3.5,
      cortisol: 12,
      fastingGlucose: 112,
      fastingInsulin: 14,
      totalCholesterol: 235,
      ldl: 155,
      hdl: 38,
      triglycerides: 180,
      vitaminD: 55,
      alt: 32,
      ast: 28,
    } as Partial<LabMarkers>,
  },
];

export async function seedSampleData() {
  console.log("Checking for sample data...");

  for (const sample of SAMPLE_PROFILES) {
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, sample.userId));

    if (existingProfile.length > 0) {
      console.log(`Sample "${sample.userId}" already exists, skipping.`);
      continue;
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, sample.userId));

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: sample.userId,
        email: `${sample.userId}@sample.biosync`,
        firstName: "Sample",
        lastName: sample.userId.replace("sample-", "").replace(/-/g, " "),
      });
    }

    await db.insert(profiles).values({
      userId: sample.userId,
      age: sample.age,
      gender: sample.gender,
      goals: sample.goals,
      weight: sample.weight,
      height: sample.height,
    });

    const [lab] = await db
      .insert(labResults)
      .values({
        userId: sample.userId,
        markers: sample.markers,
      })
      .returning();

    const recommendations = generateProgram(sample.markers as LabMarkers, {
      age: sample.age,
      gender: sample.gender,
      goals: sample.goals,
      weight: sample.weight,
      height: sample.height,
    });

    await db.insert(programs).values({
      userId: sample.userId,
      labResultId: lab.id,
      recommendations,
    });

    console.log(`Seeded sample: "${sample.userId}" (lab ${lab.id})`);
  }

  console.log("Sample data seeding complete.");
}
