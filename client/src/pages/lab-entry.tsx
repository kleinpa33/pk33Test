import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { labMarkerSchema, type LabMarkers } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafetyBanner } from "@/components/safety-banner";
import { Header } from "@/components/header";
import {
  Loader2,
  Beaker,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react";

interface MarkerDef {
  key: keyof LabMarkers;
  label: string;
  unit: string;
  placeholder: string;
}

const hormoneMarkers: MarkerDef[] = [
  { key: "totalTestosterone", label: "Total Testosterone", unit: "ng/dL", placeholder: "300-1000" },
  { key: "freeTestosterone", label: "Free Testosterone", unit: "pg/mL", placeholder: "5-25" },
  { key: "estradiol", label: "Estradiol (E2)", unit: "pg/mL", placeholder: "10-40" },
  { key: "progesterone", label: "Progesterone", unit: "ng/mL", placeholder: "0.1-0.5" },
  { key: "dheas", label: "DHEA-S", unit: "mcg/dL", placeholder: "100-500" },
  { key: "shbg", label: "SHBG", unit: "nmol/L", placeholder: "10-55" },
  { key: "lh", label: "LH", unit: "mIU/mL", placeholder: "1.5-9" },
  { key: "fsh", label: "FSH", unit: "mIU/mL", placeholder: "1.5-12" },
];

const thyroidMarkers: MarkerDef[] = [
  { key: "tsh", label: "TSH", unit: "mIU/L", placeholder: "0.5-4.5" },
  { key: "freeT3", label: "Free T3", unit: "pg/mL", placeholder: "2.3-4.2" },
  { key: "freeT4", label: "Free T4", unit: "ng/dL", placeholder: "0.8-1.8" },
];

const metabolicMarkers: MarkerDef[] = [
  { key: "fastingGlucose", label: "Fasting Glucose", unit: "mg/dL", placeholder: "70-100" },
  { key: "fastingInsulin", label: "Fasting Insulin", unit: "uIU/mL", placeholder: "2-10" },
  { key: "hba1c", label: "HbA1c", unit: "%", placeholder: "4.0-5.6" },
  { key: "totalCholesterol", label: "Total Cholesterol", unit: "mg/dL", placeholder: "<200" },
  { key: "ldl", label: "LDL Cholesterol", unit: "mg/dL", placeholder: "<100" },
  { key: "hdl", label: "HDL Cholesterol", unit: "mg/dL", placeholder: ">50" },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", placeholder: "<150" },
  { key: "homocysteine", label: "Homocysteine", unit: "umol/L", placeholder: "5-15" },
];

const growthInflamMarkers: MarkerDef[] = [
  { key: "igf1", label: "IGF-1", unit: "ng/mL", placeholder: "100-300" },
  { key: "hsCRP", label: "hs-CRP", unit: "mg/L", placeholder: "<1.0" },
  { key: "cortisol", label: "Cortisol (AM)", unit: "mcg/dL", placeholder: "6-23" },
];

const nutrientMarkers: MarkerDef[] = [
  { key: "vitaminD", label: "Vitamin D (25-OH)", unit: "ng/mL", placeholder: "30-80" },
  { key: "vitaminB12", label: "Vitamin B12", unit: "pg/mL", placeholder: "200-900" },
  { key: "ferritin", label: "Ferritin", unit: "ng/mL", placeholder: "30-300" },
  { key: "iron", label: "Iron", unit: "mcg/dL", placeholder: "60-170" },
  { key: "magnesium", label: "Magnesium", unit: "mg/dL", placeholder: "1.7-2.2" },
  { key: "zinc", label: "Zinc", unit: "mcg/dL", placeholder: "60-120" },
];

const cbcMarkers: MarkerDef[] = [
  { key: "wbc", label: "WBC", unit: "K/uL", placeholder: "4.5-11" },
  { key: "rbc", label: "RBC", unit: "M/uL", placeholder: "4.5-5.5" },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", placeholder: "13.5-17.5" },
  { key: "hematocrit", label: "Hematocrit", unit: "%", placeholder: "38-50" },
  { key: "platelets", label: "Platelets", unit: "K/uL", placeholder: "150-400" },
];

const organMarkers: MarkerDef[] = [
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", placeholder: "0.6-1.2" },
  { key: "alt", label: "ALT", unit: "U/L", placeholder: "7-56" },
  { key: "ast", label: "AST", unit: "U/L", placeholder: "10-40" },
  { key: "albumin", label: "Albumin", unit: "g/dL", placeholder: "3.5-5.5" },
  { key: "sodium", label: "Sodium", unit: "mEq/L", placeholder: "136-145" },
  { key: "potassium", label: "Potassium", unit: "mEq/L", placeholder: "3.5-5.0" },
  { key: "calcium", label: "Calcium", unit: "mg/dL", placeholder: "8.5-10.5" },
];

const tabCategories = [
  { id: "hormones", label: "Hormones", markers: hormoneMarkers },
  { id: "thyroid", label: "Thyroid", markers: thyroidMarkers },
  { id: "metabolic", label: "Metabolic", markers: metabolicMarkers },
  { id: "growth", label: "Growth & Inflammation", markers: growthInflamMarkers },
  { id: "nutrients", label: "Nutrients", markers: nutrientMarkers },
  { id: "cbc", label: "CBC", markers: cbcMarkers },
  { id: "organ", label: "Organ Function", markers: organMarkers },
];

const allMarkerKeys = tabCategories.flatMap((c) => c.markers.map((m) => m.key));

export default function LabEntry() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  const form = useForm<LabMarkers>({
    resolver: zodResolver(labMarkerSchema),
    defaultValues: {},
  });

  const fileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("labFile", file);
      const res = await fetch("/api/labs/parse-file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to parse file");
      }
      return res.json();
    },
    onSuccess: (data: { markers: Partial<LabMarkers>; extractedCount: number }) => {
      for (const key of allMarkerKeys) {
        const val = data.markers[key];
        if (val !== undefined && val !== null) {
          form.setValue(key, val);
        }
      }
      setExtractedCount(data.extractedCount);
      toast({
        title: "Biomarkers extracted",
        description: `Successfully extracted ${data.extractedCount} biomarkers from your file. Review the values below and submit when ready.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadedFile(null);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: LabMarkers) => {
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== 0 && !isNaN(v as number)),
      );
      const res = await apiRequest("POST", "/api/labs", { markers: cleaned });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      toast({
        title: "Labs submitted",
        description: "Your lab results have been saved. Generating your program...",
      });
      setLocation(`/program/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit labs. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PNG, JPEG, WebP, GIF image or a PDF file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB.",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
      setExtractedCount(null);
      fileMutation.mutate(file);
    },
    [fileMutation, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setExtractedCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  function renderMarkerField(marker: MarkerDef) {
    const isExtracted = extractedCount !== null && form.getValues(marker.key) !== undefined;
    return (
      <FormField
        key={marker.key}
        control={form.control}
        name={marker.key}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm flex items-center gap-1.5 flex-wrap">
              {marker.label}
              {isExtracted && (
                <span className="text-[10px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                  AI extracted
                </span>
              )}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type="number"
                  step="any"
                  placeholder={marker.placeholder}
                  data-testid={`input-marker-${marker.key}`}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : parseFloat(val));
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {marker.unit}
                </span>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SafetyBanner />
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Beaker className="h-6 w-6 text-primary" />
            Enter Lab Results
          </h1>
          <p className="text-muted-foreground">
            Upload a lab report file or enter values manually below. The more
            data, the better your protocol.
          </p>
        </div>

        <Card className="mb-6" data-testid="upload-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload Lab Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!uploadedFile ? (
              <div
                data-testid="dropzone"
                className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                  className="hidden"
                  onChange={handleFileInput}
                  data-testid="input-file-upload"
                />
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drag & drop your lab report here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse. Supports PNG, JPEG, WebP, GIF, PDF (max
                  10MB)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid="text-uploaded-filename">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {fileMutation.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Analyzing...</span>
                    </div>
                  ) : extractedCount !== null ? (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      <span data-testid="text-extracted-count">
                        {extractedCount} markers found
                      </span>
                    </div>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={clearFile}
                    data-testid="button-clear-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {extractedCount !== null && (
                  <p className="text-xs text-muted-foreground">
                    Values have been auto-filled below. Review them for accuracy
                    before submitting — you can edit any field.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Important Notes
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Enter values exactly as reported on your lab work</li>
                  <li>Leave fields blank if not tested</li>
                  <li>
                    Fill at minimum: Total T, IGF-1, hs-CRP, HbA1c for a basic
                    protocol
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))}
            className="space-y-6"
          >
            <Tabs defaultValue="hormones">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {tabCategories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    data-testid={`tab-${cat.id}`}
                    className="text-xs"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabCategories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{cat.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {cat.markers.map(renderMarkerField)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitMutation.isPending || fileMutation.isPending}
              data-testid="button-submit-labs"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting & Analyzing...
                </>
              ) : (
                "Submit Labs & Generate Protocol"
              )}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
