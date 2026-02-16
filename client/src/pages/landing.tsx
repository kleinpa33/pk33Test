import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import {
  Beaker,
  Activity,
  Shield,
  FlaskConical,
  ChevronRight,
  Dna,
  Brain,
  Target,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 dark:from-primary/10 dark:via-transparent dark:to-chart-2/10" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-chart-2/5 dark:bg-chart-2/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 dark:bg-primary/15 px-3 py-1.5 text-sm text-primary">
                <FlaskConical className="h-3.5 w-3.5" />
                Evidence-Based Health Optimization
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Your Blood Work,{" "}
                <span className="text-primary">Decoded</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Upload your lab results and receive a personalized 90-day
                optimization protocol — peptides, hormones, nutrition, and
                exercise — all grounded in functional medicine science.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login" className="gap-2">
                    Get Started <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Free to use
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  HIPAA-conscious design
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  No credit card required
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 to-chart-2/20 blur-xl" />
                <div className="relative rounded-2xl border bg-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Dna className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Lab Analysis</p>
                      <p className="text-xs text-muted-foreground">
                        40+ biomarkers parsed
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Total Testosterone", val: "580 ng/dL", pct: 72, color: "bg-chart-3" },
                      { label: "IGF-1", val: "142 ng/mL", pct: 45, color: "bg-chart-4" },
                      { label: "hs-CRP", val: "0.8 mg/L", pct: 85, color: "bg-primary" },
                      { label: "HbA1c", val: "5.2%", pct: 90, color: "bg-chart-3" },
                    ].map((m) => (
                      <div key={m.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-medium">{m.val}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${m.color}`}
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-md bg-primary/5 dark:bg-primary/10 px-3 py-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Generating 90-day protocol...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">
              How BioSync Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From raw lab data to actionable protocols in minutes, powered by
              evidence-based functional medicine logic.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Beaker,
                title: "Upload Labs",
                desc: "Enter your blood test markers manually. We support 40+ key biomarkers including hormones, metabolic, and inflammatory panels.",
              },
              {
                icon: Brain,
                title: "AI-Powered Analysis",
                desc: "Our rules engine calculates z-scores, identifies deviations from optimal ranges, and prioritizes interventions by severity.",
              },
              {
                icon: Target,
                title: "Personalized Protocol",
                desc: "Receive a complete 90-day program: targeted peptides (max 3), hormonal support, tailored nutrition macros, and exercise splits.",
              },
            ].map((f) => (
              <Card key={f.title} className="group">
                <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 rounded-md bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BioSync Labs is for informational purposes only. All peptide,
            hormone, and supplement recommendations require review and
            prescription by a licensed physician. Peptides referenced are often
            classified as research-use only. This platform does not provide
            medical advice, diagnosis, or treatment.
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BioSync Labs. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
