import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GenerationService } from "@/services/generation.service";
import { supabaseClient } from "@/db/supabase.client";

// Initialize services
const generationService = new GenerationService(supabaseClient);

// Form schema using zod
const formSchema = z.object({
  text: z
    .string()
    .min(100, "Tekst musi zawierać co najmniej 100 znaków")
    .max(10000, "Tekst nie może przekraczać 10000 znaków"),
  target_count: z.coerce
    .number()
    .int()
    .min(5, "Minimalna liczba fiszek to 5")
    .max(50, "Maksymalna liczba fiszek to 50")
    .default(10),
  set_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GenerateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charsCount, setCharsCount] = useState(0);

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      target_count: 10,
      set_id: undefined,
    },
  });

  // Mock sets data - in a real app this would come from an API
  const cardSets = [
    { id: "set1", name: "Historia" },
    { id: "set2", name: "Biologia" },
    { id: "set3", name: "Matematyka" },
  ];

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    console.log("Submitting form for generation...");

    try {
      const mockUserId = "user-1";
      const response = await generationService.startTextProcessing(mockUserId, {
        text: data.text,
        target_count: data.target_count,
        set_id: data.set_id
      });

      console.log(`Generation successful, got ID: ${response.generation_id}`);
      toast.success("Tekst przesłany do analizy");
      
      // Add delay to ensure the toast is visible
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create the URL and log it
      const reviewUrl = `/generate/review/${response.generation_id}`;
      console.log(`Redirecting to: ${reviewUrl}`);
      
      // Use direct browser navigation
      window.location.href = reviewUrl;
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Wystąpił błąd podczas przesyłania tekstu");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle text change to update character count
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCharsCount(value.length);
    form.setValue("text", value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tekst źródłowy</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Wklej tekst, z którego chcesz wygenerować fiszki..."
                    className="min-h-[250px] resize-y"
                    {...field}
                    onChange={handleTextChange}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">{charsCount}/10000</div>
                </div>
              </FormControl>
              <FormDescription>
                Wklej tekst, który chcesz przekształcić w fiszki (minimum 100, maksimum 10000 znaków).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="target_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Liczba fiszek</FormLabel>
                <FormControl>
                  <Input type="number" min={5} max={50} {...field} />
                </FormControl>
                <FormDescription>Docelowa liczba fiszek (5-50)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="set_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zestaw (opcjonalnie)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz istniejący zestaw" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cardSets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Możesz dodać fiszki do istniejącego zestawu</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generuj fiszki
          </Button>
        </div>
      </form>
    </Form>
  );
}
