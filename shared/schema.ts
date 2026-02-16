export * from "./models/auth";

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  age: integer("age").notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  goals: text("goals").array().notNull(),
  weight: integer("weight"),
  height: integer("height"),
});

export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  markers: jsonb("markers").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  labResultId: varchar("lab_result_id").notNull().references(() => labResults.id),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertLabResultSchema = createInsertSchema(labResults).omit({ id: true, createdAt: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type LabResult = typeof labResults.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

const optNum = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  },
  z.number().optional(),
);

export const labMarkerSchema = z.object({
  totalTestosterone: optNum,
  freeTestosterone: optNum,
  igf1: optNum,
  hsCRP: optNum,
  hba1c: optNum,
  tsh: optNum,
  freeT3: optNum,
  freeT4: optNum,
  cortisol: optNum,
  dheas: optNum,
  estradiol: optNum,
  progesterone: optNum,
  vitaminD: optNum,
  vitaminB12: optNum,
  ferritin: optNum,
  iron: optNum,
  magnesium: optNum,
  zinc: optNum,
  fastingGlucose: optNum,
  fastingInsulin: optNum,
  homocysteine: optNum,
  totalCholesterol: optNum,
  ldl: optNum,
  hdl: optNum,
  triglycerides: optNum,
  creatinine: optNum,
  alt: optNum,
  ast: optNum,
  wbc: optNum,
  rbc: optNum,
  hemoglobin: optNum,
  hematocrit: optNum,
  platelets: optNum,
  sodium: optNum,
  potassium: optNum,
  calcium: optNum,
  albumin: optNum,
  shbg: optNum,
  lh: optNum,
  fsh: optNum,
});

export type LabMarkers = z.infer<typeof labMarkerSchema>;

export interface ProgramRecommendation {
  peptides: PeptideRec[];
  hormones: HormoneRec[];
  diet: DietPlan;
  exercise: ExercisePlan;
  generalNotes: string[];
  cycleGuidance: string;
}

export interface PeptideRec {
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
  risks: string[];
  synergies: string[];
}

export interface HormoneRec {
  name: string;
  dosage: string;
  rationale: string;
  monitoring: string[];
}

export interface DietPlan {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  meals: MealPlan[];
  notes: string[];
}

export interface MealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface ExercisePlan {
  daysPerWeek: number;
  splits: ExerciseSplit[];
  cardio: string;
  notes: string[];
}

export interface ExerciseSplit {
  day: string;
  focus: string;
  exercises: string[];
  duration: string;
}

export interface MarkerStatus {
  name: string;
  value: number;
  unit: string;
  optimalLow: number;
  optimalHigh: number;
  status: "optimal" | "suboptimal" | "critical";
  zScore: number;
}
