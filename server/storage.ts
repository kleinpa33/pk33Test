import {
  profiles,
  labResults,
  programs,
  type Profile,
  type InsertProfile,
  type LabResult,
  type InsertLabResult,
  type Program,
  type InsertProgram,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(userId: string, data: Omit<InsertProfile, "userId">): Promise<Profile>;
  getLabResults(userId: string): Promise<LabResult[]>;
  getLabResult(id: string, userId: string): Promise<LabResult | undefined>;
  createLabResult(data: InsertLabResult): Promise<LabResult>;
  getPrograms(userId: string): Promise<Program[]>;
  getProgramByLabId(labResultId: string, userId: string): Promise<Program | undefined>;
  createProgram(data: InsertProgram): Promise<Program>;
}

class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(userId: string, data: Omit<InsertProfile, "userId">): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ ...data })
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    }
    const [profile] = await db
      .insert(profiles)
      .values({ ...data, userId })
      .returning();
    return profile;
  }

  async getLabResults(userId: string): Promise<LabResult[]> {
    return db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, userId))
      .orderBy(desc(labResults.createdAt));
  }

  async getLabResult(id: string, userId: string): Promise<LabResult | undefined> {
    const [result] = await db
      .select()
      .from(labResults)
      .where(eq(labResults.id, id));
    if (result && result.userId !== userId) return undefined;
    return result;
  }

  async createLabResult(data: InsertLabResult): Promise<LabResult> {
    const [result] = await db.insert(labResults).values(data).returning();
    return result;
  }

  async getPrograms(userId: string): Promise<Program[]> {
    return db
      .select()
      .from(programs)
      .where(eq(programs.userId, userId))
      .orderBy(desc(programs.createdAt));
  }

  async getProgramByLabId(labResultId: string, userId: string): Promise<Program | undefined> {
    const [program] = await db
      .select()
      .from(programs)
      .where(eq(programs.labResultId, labResultId));
    if (program && program.userId !== userId) return undefined;
    return program;
  }

  async createProgram(data: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(data).returning();
    return program;
  }
}

export const storage = new DatabaseStorage();
