import { useDirectAuth } from "../../hooks/useDirectAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

// TODO: Implement statistics dashboard functionality (US-007)
// - Add components to display generation statistics
// - Track number of generated and accepted cards
// - Add real-time statistics updates

export default function DashboardContent() {
  const { user, loading } = useDirectAuth();
  const [cardSetsCount, setCardSetsCount] = useState<number>(0);
  const [isLoadingCardSets, setIsLoadingCardSets] = useState(true);

  // Fetch card sets count
  useEffect(() => {
    const fetchCardSetsCount = async () => {
      if (!user) return;

      try {
        setIsLoadingCardSets(true);

        // Use the API to get the actual card sets list and extract the count
        const response = await fetch("/api/card-sets?page=1&limit=1", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch card sets");
        }

        const data = await response.json();
        setCardSetsCount(data.pagination.total);
      } catch (err) {
        console.error("Failed to fetch card sets:", err);
        setCardSetsCount(0);
      } finally {
        setIsLoadingCardSets(false);
      }
    };

    if (user) {
      fetchCardSetsCount();
    }
  }, [user]);

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

  if (!user) {
    // If user is not available, render nothing (or a minimal placeholder if desired)
    return null;
  }

  return (
    <div data-testid="dashboard-content" className="space-y-8">
      <div data-testid="dashboard-header" className="flex items-center">
        <div>
          <h2 data-testid="dashboard-greeting" className="text-xl font-semibold mb-1">
            Witaj, {user?.name || user?.email?.split("@")[0] || "użytkowniku"}!
          </h2>
          <p className="text-muted-foreground">Oto Twoje karty do nauki i postępy</p>
        </div>
        <Button className="ml-auto" asChild>
          <a href="/generate">Stwórz nowe karty</a>
        </Button>
      </div>

      <div data-testid="dashboard-stats-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Karty do nauki</CardTitle>
            <CardDescription>Karty czekające na powtórzenie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <span className="text-5xl font-bold">--</span>
              <p className="text-muted-foreground mt-2">funkcja wkrótce dostępna</p>
            </div>
          </CardContent>
          <CardFooter>
            {!loading && !isLoadingCardSets && (
              <Button className="w-full" variant="outline" disabled data-testid="study-button">
                Rozpocznij naukę
              </Button>
            )}
            {/* Do not render any button at all during loading */}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Twoje zestawy</CardTitle>
            <CardDescription>Wszystkie Twoje zestawy kart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              {isLoadingCardSets ? (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 bg-muted/20 rounded-md animate-pulse mb-2"></div>
                  <div className="h-5 w-20 bg-muted/20 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <>
                  <span className="text-5xl font-bold">{cardSetsCount}</span>
                  <p className="text-muted-foreground mt-2">
                    {cardSetsCount === 1 ? "utworzony zestaw" : "utworzone zestawy"}
                  </p>
                </>
              )}
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
