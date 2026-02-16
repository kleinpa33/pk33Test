import OpenAI from "openai";
import type { LabMarkers } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MARKER_KEYS = [
  "totalTestosterone", "freeTestosterone", "igf1", "hsCRP", "hba1c",
  "tsh", "freeT3", "freeT4", "cortisol", "dheas", "estradiol",
  "progesterone", "vitaminD", "vitaminB12", "ferritin", "iron",
  "magnesium", "zinc", "fastingGlucose", "fastingInsulin", "homocysteine",
  "totalCholesterol", "ldl", "hdl", "triglycerides", "creatinine",
  "alt", "ast", "wbc", "rbc", "hemoglobin", "hematocrit", "platelets",
  "sodium", "potassium", "calcium", "albumin", "shbg", "lh", "fsh",
];

const SYSTEM_PROMPT = `You are a medical lab result extraction system. Given an image of a blood test / lab report, extract all biomarker values you can find.

Return a JSON object with ONLY numeric values (no units, no ranges, no text). Use these exact keys where applicable:

- totalTestosterone (ng/dL)
- freeTestosterone (pg/mL)
- igf1 (ng/mL) - also known as IGF-1, Insulin-like Growth Factor 1
- hsCRP (mg/L) - also known as hs-CRP, high-sensitivity C-Reactive Protein
- hba1c (%) - also known as HbA1c, Hemoglobin A1c, A1C
- tsh (mIU/L) - Thyroid Stimulating Hormone
- freeT3 (pg/mL)
- freeT4 (ng/dL)
- cortisol (mcg/dL) - morning cortisol
- dheas (mcg/dL) - DHEA-S, DHEA Sulfate
- estradiol (pg/mL) - also E2
- progesterone (ng/mL)
- vitaminD (ng/mL) - 25-OH Vitamin D, 25-Hydroxyvitamin D
- vitaminB12 (pg/mL)
- ferritin (ng/mL)
- iron (mcg/dL) - serum iron
- magnesium (mg/dL)
- zinc (mcg/dL)
- fastingGlucose (mg/dL) - Glucose, Fasting
- fastingInsulin (uIU/mL) - Insulin, Fasting
- homocysteine (umol/L)
- totalCholesterol (mg/dL)
- ldl (mg/dL) - LDL Cholesterol
- hdl (mg/dL) - HDL Cholesterol
- triglycerides (mg/dL)
- creatinine (mg/dL)
- alt (U/L) - ALT, Alanine Aminotransferase, SGPT
- ast (U/L) - AST, Aspartate Aminotransferase, SGOT
- wbc (K/uL) - White Blood Cell Count
- rbc (M/uL) - Red Blood Cell Count
- hemoglobin (g/dL) - Hgb
- hematocrit (%) - Hct
- platelets (K/uL) - Platelet Count
- sodium (mEq/L) - Na
- potassium (mEq/L) - K
- calcium (mg/dL) - Ca
- albumin (g/dL)
- shbg (nmol/L) - Sex Hormone Binding Globulin
- lh (mIU/mL) - Luteinizing Hormone
- fsh (mIU/mL) - Follicle Stimulating Hormone

IMPORTANT RULES:
1. Only include markers you can clearly read from the document
2. Return ONLY a JSON object with the extracted numeric values - no explanation text
3. If a value is clearly in different units than expected, convert it first
4. Do not guess or fabricate values. Only include what's explicitly shown
5. If you cannot find any biomarkers, return an empty object {}`;

export async function parseLabFile(base64Image: string, mimeType: string): Promise<Partial<LabMarkers>> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
          {
            type: "text",
            text: "Extract all biomarker values from this lab report. Return only a JSON object with the values.",
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("Failed to parse AI response as JSON:", content.substring(0, 200));
    return {};
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {};
  }

  const result: Partial<LabMarkers> = {};

  for (const key of MARKER_KEYS) {
    const val = parsed[key];
    if (val !== undefined && val !== null) {
      const num = typeof val === "number" ? val : parseFloat(String(val));
      if (!isNaN(num) && isFinite(num) && num >= 0) {
        (result as any)[key] = num;
      }
    }
  }

  return result;
}
