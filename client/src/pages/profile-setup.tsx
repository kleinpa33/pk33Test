import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SafetyBanner } from "@/components/safety-banner";
import { Header } from "@/components/header";
import { Loader2, User } from "lucide-react";
import type { Profile } from "@shared/schema";

const goalOptions = [
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "fat_loss", label: "Fat Loss" },
  { id: "longevity", label: "Longevity & Anti-Aging" },
  { id: "hormone_optimization", label: "Hormone Optimization" },
  { id: "cognitive_enhancement", label: "Cognitive Enhancement" },
  { id: "sleep_recovery", label: "Sleep & Recovery" },
  { id: "metabolic_health", label: "Metabolic Health" },
  { id: "inflammation_reduction", label: "Inflammation Reduction" },
];

const profileFormSchema = z.object({
  age: z.coerce.number().min(18, "Must be 18+").max(120),
  gender: z.string().min(1, "Required"),
  goals: z.array(z.string()).min(1, "Select at least one goal"),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
});

type ProfileForm = z.infer<typeof profileFormSchema>;

export default function ProfileSetup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: existingProfile, isLoading: loadingProfile } = useQuery<Profile | null>({
    queryKey: ["/api/profile"],
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      age: 30,
      gender: "",
      goals: [],
      weight: undefined,
      height: undefined,
    },
  });

  useEffect(() => {
    if (existingProfile) {
      form.reset({
        age: existingProfile.age,
        gender: existingProfile.gender,
        goals: existingProfile.goals,
        weight: existingProfile.weight ?? undefined,
        height: existingProfile.height ?? undefined,
      });
    }
  }, [existingProfile, form]);

  const mutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile saved", description: "Your profile has been updated." });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SafetyBanner />
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {existingProfile ? "Edit Profile" : "Set Up Your Profile"}
          </h1>
          <p className="text-muted-foreground">
            Your profile helps us personalize your optimization program with
            age- and gender-adjusted optimal ranges.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            data-testid="input-age"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biological Sex</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="180"
                            data-testid="input-weight"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (inches)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="70"
                            data-testid="input-height"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="goals"
                  render={() => (
                    <FormItem>
                      <FormLabel>Optimization Goals</FormLabel>
                      <FormDescription>
                        Select all areas you want to focus on.
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {goalOptions.map((goal) => (
                          <FormField
                            key={goal.id}
                            control={form.control}
                            name="goals"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-goal-${goal.id}`}
                                    checked={field.value?.includes(goal.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      field.onChange(
                                        checked
                                          ? [...current, goal.id]
                                          : current.filter(
                                              (v: string) => v !== goal.id,
                                            ),
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {goal.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                  data-testid="button-save-profile"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
