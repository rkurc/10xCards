import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GenerateForm } from "./GenerateForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>Wystąpił problem podczas ładowania komponentu: {error.message}</AlertDescription>
    </Alert>
  );
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">Ładowanie...</span>
    </div>
  );
}

export default function GenerateContent() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Generuj fiszki</h1>
          <p className="text-muted-foreground">
            Wklej tekst źródłowy, aby wygenerować fiszki za pomocą sztucznej inteligencji.
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <Card>
            <CardHeader>
              <CardTitle>Generuj fiszki</CardTitle>
              <CardDescription>Wklej tekst źródłowy i wybierz parametry generowania fiszek</CardDescription>
            </CardHeader>
            <CardContent>
              <GenerateForm />
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
