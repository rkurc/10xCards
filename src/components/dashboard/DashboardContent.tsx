import { useDirectAuth } from "@/hooks/useDirectAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardContentProps {
  // Add any props if needed
}

export default function DashboardContent({}: DashboardContentProps) {
  const { user, loading } = useDirectAuth();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-7 bg-muted/20 rounded-md animate-pulse w-1/2 mb-2"></div>
              <div className="h-5 bg-muted/20 rounded-md animate-pulse w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted/20 rounded-md animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="dashboard-content" className="space-y-8">
      <div data-testid="dashboard-header" className="flex items-center">
        <div>
          <h2 data-testid="dashboard-greeting" className="text-xl font-semibold mb-1">
            Witaj, {user?.name || user?.email?.split("@")[0] || "użytkowniku"}!
          </h2>
          <p className="text-muted-foreground">
            Oto Twoje karty do nauki i postępy
          </p>
        </div>
        <Button className="ml-auto" asChild>
          <a href="/create">Stwórz nowe karty</a>
        </Button>
      </div>

      <div data-testid="dashboard-stats-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Karty do nauki</CardTitle>
            <CardDescription>Karty czekające na powtórzenie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <span className="text-5xl font-bold">12</span>
              <p className="text-muted-foreground mt-2">kart do powtórzenia</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <a href="/study">Rozpocznij naukę</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Twoje zestawy</CardTitle>
            <CardDescription>Wszystkie Twoje zestawy kart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <span className="text-5xl font-bold">3</span>
              <p className="text-muted-foreground mt-2">utworzone zestawy</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <a href="/sets">Zobacz zestawy</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Twoje postępy</CardTitle>
            <CardDescription>Statystyki nauki</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <span className="text-5xl font-bold">87%</span>
              <p className="text-muted-foreground mt-2">skuteczność zapamiętywania</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <a href="/stats">Zobacz statystyki</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
