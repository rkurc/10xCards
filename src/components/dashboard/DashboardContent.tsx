import { useContext } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { AuthContext } from "../layout/RootLayout";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>Wystąpił problem podczas ładowania dashboardu: {error.message}</AlertDescription>
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

export function DashboardContent() {
  const { user } = useContext(AuthContext);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Witaj, {user?.name}! Co chcesz dzisiaj zrobić?
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Generuj fiszki</CardTitle>
                <CardDescription>Twórz nowe fiszki za pomocą AI</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Przekształć dowolny tekst w wysokiej jakości fiszki edukacyjne.</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <a href="/generate">Rozpocznij generowanie</a>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moje zestawy</CardTitle>
                <CardDescription>Zarządzaj swoimi zestawami fiszek</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Przeglądaj, edytuj i organizuj swoje zestawy fiszek.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <a href="/sets">Przeglądaj zestawy</a>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rozpocznij naukę</CardTitle>
                <CardDescription>Ucz się za pomocą algorytmu powtórek</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Wykorzystaj spaced repetition dla efektywniejszej nauki.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <a href="/learn">Zacznij sesję</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
