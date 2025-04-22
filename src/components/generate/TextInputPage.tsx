import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { GenerateForm } from "./GenerateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ErrorFallback component
function ErrorFallback({ error }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-800 rounded-md">
      <h2 className="text-lg font-semibold">Coś poszło nie tak</h2>
      <p className="text-sm">{error.message}</p>
    </div>
  );
}

// LoadingFallback component
function LoadingFallback() {
  return <div className="p-4 text-center">Ładowanie...</div>;
}

export default function TextInputPage() {
  return (
    <div className="container mx-auto py-8">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
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
      </ErrorBoundary>
    </div>
  );
}
