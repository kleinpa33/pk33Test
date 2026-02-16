import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { SafetyBanner } from "@/components/safety-banner";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Pill,
  Dumbbell,
  Utensils,
  AlertTriangle,
  ArrowLeft,
  Activity,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { ProgramRecommendation, MarkerStatus } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "optimal"
      ? "secondary"
      : status === "suboptimal"
        ? "outline"
        : "destructive";
  return (
    <Badge variant={variant} className="text-xs capitalize">
      {status}
    </Badge>
  );
}

export default function ProgramView() {
  const [, params] = useRoute("/program/:labId");
  const labId = params?.labId;

  const { data: program, isLoading: programLoading } = useQuery<{
    program: { recommendations: ProgramRecommendation } | null;
    markerStatuses: MarkerStatus[];
  }>({
    queryKey: ["/api/program", labId],
    enabled: !!labId,
  });

  if (programLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const recs = program?.program?.recommendations;
  const markers = program?.markerStatuses ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SafetyBanner />
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <a href="/" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                90-Day Optimization Protocol
              </h1>
              <p className="text-muted-foreground text-sm">
                Personalized program based on your lab results
              </p>
            </div>
          </div>
        </div>

        <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-destructive dark:text-red-400">
                  Medical Disclaimer
                </p>
                <p className="text-muted-foreground">
                  This protocol is for informational purposes only. All peptide,
                  hormone, and supplement interventions require supervision by a
                  licensed medical professional. Peptides referenced are
                  frequently classified as research-use only. Do not begin any
                  protocol without consulting your physician.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {markers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Biomarker Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {markers.map((m) => {
                  const colorClass =
                    m.status === "optimal"
                      ? "text-chart-3"
                      : m.status === "suboptimal"
                        ? "text-chart-4"
                        : "text-destructive";
                  return (
                    <div
                      key={m.name}
                      className="flex items-center justify-between gap-2 rounded-md border p-3"
                      data-testid={`marker-status-${m.name}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.name}
                        </p>
                        <p className={`text-sm font-semibold ${colorClass}`}>
                          {m.value} {m.unit}
                        </p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {recs ? (
          <Tabs defaultValue="peptides">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="peptides" data-testid="tab-peptides" className="gap-1.5">
                <Pill className="h-3.5 w-3.5" /> Peptides
              </TabsTrigger>
              <TabsTrigger value="hormones" data-testid="tab-hormones" className="gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" /> Hormones
              </TabsTrigger>
              <TabsTrigger value="diet" data-testid="tab-diet" className="gap-1.5">
                <Utensils className="h-3.5 w-3.5" /> Diet
              </TabsTrigger>
              <TabsTrigger value="exercise" data-testid="tab-exercise" className="gap-1.5">
                <Dumbbell className="h-3.5 w-3.5" /> Exercise
              </TabsTrigger>
            </TabsList>

            <TabsContent value="peptides" className="space-y-4">
              {recs.peptides.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No peptide interventions recommended based on your labs.
                  </CardContent>
                </Card>
              ) : (
                recs.peptides.map((pep, i) => (
                  <Card key={i} data-testid={`peptide-card-${i}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{pep.name}</CardTitle>
                        <p className="text-sm text-primary mt-1">{pep.dosage}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {pep.timing}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {pep.rationale}
                      </p>
                      {pep.risks.length > 0 && (
                        <div className="rounded-md bg-destructive/5 dark:bg-destructive/10 p-3">
                          <p className="text-xs font-semibold text-destructive dark:text-red-400 mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Risks
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {pep.risks.map((r, ri) => (
                              <li key={ri} className="flex items-start gap-1">
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-destructive shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {pep.synergies.length > 0 && (
                        <div className="rounded-md bg-primary/5 dark:bg-primary/10 p-3">
                          <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                            <Info className="h-3 w-3" /> Synergies
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {pep.synergies.map((s, si) => (
                              <li key={si} className="flex items-start gap-1">
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
              {recs.cycleGuidance && (
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {recs.cycleGuidance}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="hormones" className="space-y-4">
              {recs.hormones.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No hormonal interventions recommended based on your labs.
                  </CardContent>
                </Card>
              ) : (
                recs.hormones.map((h, i) => (
                  <Card key={i} data-testid={`hormone-card-${i}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{h.name}</CardTitle>
                      <p className="text-sm text-primary mt-1">{h.dosage}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {h.rationale}
                      </p>
                      {h.monitoring.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Monitoring Required
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {h.monitoring.map((m, mi) => (
                              <li key={mi} className="flex items-start gap-1">
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-chart-4 shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="diet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Macros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Calories", val: recs.diet.calories, unit: "kcal" },
                      { label: "Protein", val: recs.diet.proteinG, unit: "g" },
                      { label: "Carbs", val: recs.diet.carbsG, unit: "g" },
                      { label: "Fat", val: recs.diet.fatG, unit: "g" },
                    ].map((macro) => (
                      <div
                        key={macro.label}
                        className="text-center p-4 rounded-md border"
                        data-testid={`macro-${macro.label.toLowerCase()}`}
                      >
                        <p className="text-2xl font-bold text-primary">
                          {macro.val}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {macro.unit} {macro.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  {recs.diet.notes.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {recs.diet.notes.map((n, i) => (
                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
                          {n}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {recs.diet.meals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sample 7-Day Meal Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recs.diet.meals.map((meal, i) => (
                        <div
                          key={i}
                          className="rounded-md border p-4 space-y-2"
                          data-testid={`meal-day-${i}`}
                        >
                          <p className="text-sm font-semibold">{meal.day}</p>
                          <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">
                                Breakfast:{" "}
                              </span>
                              {meal.breakfast}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Lunch:{" "}
                              </span>
                              {meal.lunch}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Dinner:{" "}
                              </span>
                              {meal.dinner}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Snacks:{" "}
                              </span>
                              {meal.snacks}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="exercise" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Weekly Training Split ({recs.exercise.daysPerWeek} days/week)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recs.exercise.splits.map((split, i) => (
                    <div
                      key={i}
                      className="rounded-md border p-4 space-y-2"
                      data-testid={`exercise-day-${i}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{split.day}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {split.focus}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {split.duration}
                          </Badge>
                        </div>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        {split.exercises.map((ex, ei) => (
                          <li key={ei} className="flex items-start gap-1">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cardio Protocol</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {recs.exercise.cardio}
                  </p>
                  {recs.exercise.notes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {recs.exercise.notes.map((n, i) => (
                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
                          {n}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {recs.generalNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">General Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {recs.generalNotes.map((n, i) => (
                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-chart-4 shrink-0" />
                          {n}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                <FlaskConical className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                No program generated yet
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Submit lab results first to generate a personalized 90-day
                optimization protocol.
              </p>
              <Button asChild>
                <a href="/labs/new">Enter Lab Results</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
