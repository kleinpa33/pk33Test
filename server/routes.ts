import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { labMarkerSchema, type LabMarkers } from "@shared/schema";
import { generateProgram, analyzeMarkers } from "./recommender";
import { parseLabFile } from "./lab-parser";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPEG, WebP, GIF images and PDF files are supported"));
    }
  },
});

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

  app.delete("/api/labs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteLabResult(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Lab result not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lab result:", error);
      res.status(500).json({ message: "Failed to delete lab result" });
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

  app.get("/api/samples", isAuthenticated, async (_req: any, res) => {
    try {
      const sampleUserIds = ["sample-low-t-male", "sample-stress-female", "sample-metabolic-male"];
      const samples = [];
      for (const uid of sampleUserIds) {
        const profile = await storage.getProfile(uid);
        if (!profile) continue;
        const labs = await storage.getLabResults(uid);
        const progs = await storage.getPrograms(uid);
        if (labs.length > 0 && progs.length > 0) {
          samples.push({
            id: uid,
            name: uid === "sample-low-t-male"
              ? "Low Testosterone Male (Age 38)"
              : uid === "sample-stress-female"
                ? "High Stress Female (Age 45)"
                : "Metabolic Issues Male (Age 32)",
            profile,
            labId: labs[0].id,
            markers: labs[0].markers,
            programId: progs[0].id,
          });
        }
      }
      res.json(samples);
    } catch (error) {
      console.error("Error fetching samples:", error);
      res.status(500).json({ message: "Failed to fetch samples" });
    }
  });

  app.post("/api/labs/load-sample", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sampleId } = req.body;

      const sampleLabs = await storage.getLabResults(sampleId);
      if (sampleLabs.length === 0) {
        return res.status(404).json({ message: "Sample not found" });
      }

      const sampleMarkers = sampleLabs[0].markers as LabMarkers;

      const lab = await storage.createLabResult({
        userId,
        markers: sampleMarkers,
      });

      const profile = await storage.getProfile(userId);
      if (profile) {
        const recommendations = generateProgram(sampleMarkers, {
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
      console.error("Error loading sample:", error);
      res.status(500).json({ message: "Failed to load sample data" });
    }
  });

  app.post("/api/labs/parse-file", isAuthenticated, (req: any, res: any, next: any) => {
    upload.single("labFile")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ message: "File too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ message: err.message || "Invalid file upload." });
      }
      next();
    });
  }, async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const base64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const markers = await parseLabFile(base64, mimeType);
      const count = Object.keys(markers).length;

      if (count === 0) {
        return res.status(422).json({
          message: "Could not extract any biomarkers from this file. Please try a clearer image or enter values manually.",
        });
      }

      res.json({ markers, extractedCount: count });
    } catch (error: any) {
      console.error("Error parsing lab file:", error);
      res.status(500).json({
        message: error.message || "Failed to parse lab file. Please try again or enter values manually.",
      });
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
