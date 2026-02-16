import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { labMarkerSchema, type LabMarkers } from "@shared/schema";
import { generateProgram, analyzeMarkers } from "./recommender";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      res.json(profile ?? null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { age, gender, goals, weight, height } = req.body;
      if (!age || !gender || !goals?.length) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const profile = await storage.upsertProfile(userId, {
        age,
        gender,
        goals,
        weight: weight || null,
        height: height || null,
      });
      res.json(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.get("/api/labs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const labs = await storage.getLabResults(userId);
      res.json(labs);
    } catch (error) {
      console.error("Error fetching labs:", error);
      res.status(500).json({ message: "Failed to fetch labs" });
    }
  });

  app.get("/api/labs/latest/statuses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const labs = await storage.getLabResults(userId);
      if (labs.length === 0) return res.json([]);

      const profile = await storage.getProfile(userId);
      if (!profile) return res.json([]);

      const markers = labs[0].markers as LabMarkers;
      const statuses = analyzeMarkers(markers, {
        age: profile.age,
        gender: profile.gender,
        goals: profile.goals,
      });
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching marker statuses:", error);
      res.status(500).json({ message: "Failed to fetch marker statuses" });
    }
  });

  app.post("/api/labs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { markers } = req.body;
      if (!markers) {
        return res.status(400).json({ message: "Missing markers" });
      }

      const parsed = labMarkerSchema.safeParse(markers);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid lab markers", errors: parsed.error.issues });
      }

      const lab = await storage.createLabResult({
        userId,
        markers: parsed.data,
      });

      const profile = await storage.getProfile(userId);
      if (profile) {
        const recommendations = generateProgram(parsed.data, {
          age: profile.age,
          gender: profile.gender,
          goals: profile.goals,
          weight: profile.weight,
          height: profile.height,
        });
        await storage.createProgram({
          userId,
          labResultId: lab.id,
          recommendations,
        });
      }

      res.json(lab);
    } catch (error) {
      console.error("Error creating lab result:", error);
      res.status(500).json({ message: "Failed to create lab result" });
    }
  });

  app.get("/api/programs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progs = await storage.getPrograms(userId);
      res.json(progs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get("/api/program/:labId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { labId } = req.params;

      const lab = await storage.getLabResult(labId, userId);
      if (!lab) return res.status(404).json({ message: "Lab result not found" });

      let program = await storage.getProgramByLabId(labId, userId);

      if (!program) {
        const profile = await storage.getProfile(userId);
        if (profile) {
          const markers = lab.markers as LabMarkers;
          const recommendations = generateProgram(markers, {
            age: profile.age,
            gender: profile.gender,
            goals: profile.goals,
            weight: profile.weight,
            height: profile.height,
          });
          program = await storage.createProgram({
            userId,
            labResultId: labId,
            recommendations,
          });
        }
      }

      const profile = await storage.getProfile(userId);
      const markers = lab.markers as LabMarkers;
      const markerStatuses = profile
        ? analyzeMarkers(markers, {
            age: profile.age,
            gender: profile.gender,
            goals: profile.goals,
          })
        : [];

      res.json({ program, markerStatuses });
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ message: "Failed to fetch program" });
    }
  });

  return httpServer;
}
