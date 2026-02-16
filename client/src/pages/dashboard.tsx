import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SafetyBanner } from "@/components/safety-banner";
import { Header } from "@/components/header";
import {
  Beaker,
  Plus,
  Activity,
  Calendar,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  FlaskConical,
  Loader2,
  Trash2,
} from "lucide-react";
import type { LabResult, Profile, Program, MarkerStatus } from "@shared/schema";

function MarkerGauge({ marker }: { marker: MarkerStatus }) {
  const pct = Math.max(
    0,
    Math.min(
      100,
      ((marker.value - marker.optimalLow) /
        (marker.optimalHigh - marker.optimalLow)) *
        100,
    ),
  );

  const colorClass =
    marker.status === "optimal"
      ? "text-chart-3"
      : marker.status === "suboptimal"
        ? "text-chart-4"
        : "text-destructive";

  const bgClass =
    marker.status === "optimal"
      ? "bg-chart-3"
      : marker.status === "suboptimal"
        ? "bg-chart-4"
        : "bg-destructive";

  return (
    <div className="space-y-2" data-testid={`gauge-${marker.name}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{marker.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${colorClass}`}>
            {marker.value} {marker.unit}
          </span>
          <Badge
            variant={
              marker.status === "optimal"
                ? "secondary"
                : marker.status === "suboptimal"
                  ? "outline"
                  : "destructive"
            }
            className="text-xs"
          >
            {marker.status}
          </Badge>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${bgClass} transition-all duration-500`}
          style={{ width: `${Math.max(5, Math.min(100, pct))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {marker.optimalLow} {marker.unit}
        </span>
        <span>
          {marker.optimalHigh} {marker.unit}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: labs, isLoading: labsLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/labs"],
    enabled: isAuthenticated,
  });

  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    enabled: isAuthenticated,
  });

  const { data: markerStatuses } = useQuery<MarkerStatus[]>({
    queryKey: ["/api/labs", "latest", "statuses"],
    enabled: isAuthenticated && !!labs && labs.length > 0,
  });

  const { data: samples } = useQuery<any[]>({
    queryKey: ["/api/samples"],
    enabled: isAuthenticated,
  });

  const loadSampleMutation = useMutation({
    mutationFn: async (sampleId: string) => {
      const res = await apiRequest("POST", "/api/labs/load-sample", { sampleId });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Sample loaded",
        description: "Sample blood test loaded. Redirecting to your protocol...",
      });
      setLocation(`/program/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load sample data.",
        variant: "destructive",
      });
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: async (labId: string) => {
      await apiRequest("DELETE", `/api/labs/${labId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Deleted",
        description: "Lab result has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lab result.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!profileLoading && profile === null && isAuthenticated) {
      setLocation("/profile");
    }
  }, [profileLoading, profile, isAuthenticated, setLocation]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const latestLab = labs?.[0];
  const latestProgram = programs?.[0];
  const hasLabs = labs && labs.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SafetyBanner />
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.firstName ?? "there"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your health optimization dashboard
            </p>
          </div>
          <Button asChild data-testid="button-new-labs">
            <a href="/labs/new" className="gap-2">
              <Plus className="h-4 w-4" /> New Lab Entry
            </a>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
                  <Beaker className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Lab Results</p>
                  <p className="text-2xl font-bold">{labs?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-chart-2/10 dark:bg-chart-2/15 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-5 w-5 text-chart-2" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Programs</p>
                  <p className="text-2xl font-bold">{programs?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-chart-3/10 dark:bg-chart-3/15 flex items-center justify-center shrink-0">
                  <Activity className="h-5 w-5 text-chart-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    Profile Status
                  </p>
                  <p className="text-lg font-bold">
                    {profile?.gender === "male" ? "M" : "F"}, {profile?.age}y
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {samples && samples.length > 0 && (
          <Card data-testid="sample-data-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Sample Blood Tests
              </CardTitle>
              <Badge variant="secondary" className="text-xs">Demo Data</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Try the platform with pre-loaded blood test profiles to see how recommendations are generated.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {samples.map((s: any) => (
                  <div
                    key={s.id}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <p className="text-sm font-medium" data-testid={`text-sample-name-${s.id}`}>
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(s.markers).length} biomarkers
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={loadSampleMutation.isPending}
                      onClick={() => loadSampleMutation.mutate(s.id)}
                      data-testid={`button-load-sample-${s.id}`}
                    >
                      {loadSampleMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Load & Analyze"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!hasLabs ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                <Beaker className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No lab results yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter your blood work to unlock personalized peptide, hormone,
                nutrition, and exercise protocols.
              </p>
              <Button asChild data-testid="button-first-lab">
                <a href="/labs/new" className="gap-2">
                  <Plus className="h-4 w-4" /> Enter Lab Results
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {markerStatuses && markerStatuses.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">
                    Biomarker Overview
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Latest Results
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {markerStatuses.map((m) => (
                      <MarkerGauge key={m.name} marker={m} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">Recent Labs</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/labs/new" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> New
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {labs?.slice(0, 5).map((lab) => {
                      const markers = lab.markers as Record<string, number>;
                      const count = Object.keys(markers).length;
                      return (
                        <div
                          key={lab.id}
                          className="flex items-center justify-between gap-3 rounded-md border p-3 hover-elevate cursor-pointer"
                          data-testid={`lab-entry-${lab.id}`}
                        >
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1"
                            onClick={() => setLocation(`/program/${lab.id}`)}
                          >
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {new Date(lab.createdAt!).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {count} markers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-delete-lab-${lab.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this lab result? This cannot be undone.")) {
                                  deleteLabMutation.mutate(lab.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {latestProgram && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle className="text-lg">Latest Program</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setLocation(`/program/${latestProgram.labResultId}`)
                      }
                    >
                      View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const recs = latestProgram.recommendations as any;
                      return (
                        <div className="space-y-4">
                          {recs?.peptides?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Peptides
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {recs.peptides.map(
                                  (p: any, i: number) => (
                                    <Badge key={i} variant="secondary">
                                      {p.name}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                          {recs?.hormones?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Hormones
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {recs.hormones.map(
                                  (h: any, i: number) => (
                                    <Badge key={i} variant="outline">
                                      {h.name}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2 rounded-md bg-destructive/5 dark:bg-destructive/10 p-3">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                              All recommendations are informational only and
                              require licensed MD supervision.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
