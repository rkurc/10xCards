import { useState } from "react";
import { useDirectAuth } from "@/hooks/useDirectAuth";
import { updateProfile } from "@/services/auth.direct";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileContent() {
  const { user, loading } = useDirectAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when user is loaded
  useState(() => {
    if (user) {
      setName(user.name || "");
    }
  });

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dane konta</CardTitle>
            <CardDescription>Ładowanie...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse h-40 bg-muted/20 rounded-md"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dane konta</CardTitle>
            <CardDescription>Nie zalogowano</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Zaloguj się, aby zobaczyć dane konta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile({ name });

      if (result.success) {
        toast({
          title: "Zapisano zmiany",
          description: "Twoje dane zostały zaktualizowane.",
          variant: "default",
        });
        setEditMode(false);
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się zapisać zmian",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dane konta</CardTitle>
          <CardDescription>Podstawowe informacje o Twoim koncie</CardDescription>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled aria-disabled="true" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa użytkownika</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Podaj swoją nazwę"
                />
              </div>
            </div>
          ) : (
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nazwa użytkownika</dt>
                <dd>{user.name || "Nie ustawiono"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
        <CardFooter>
          {editMode ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setEditMode(false)} disabled={isSaving}>
                Anuluj
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Edytuj dane
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bezpieczeństwo</CardTitle>
          <CardDescription>Zarządzaj hasłem i bezpieczeństwem konta</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Twoje hasło powinno być silne i unikalne dla każdego konta.</p>
          <p className="text-sm text-muted-foreground">Ostatnia zmiana hasła: Nigdy</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => (window.location.href = "/reset-password")}>
            Zmień hasło
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eksport danych</CardTitle>
          <CardDescription>Pobierz swoje dane zgodnie z RODO</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Możesz pobrać wszystkie dane związane z Twoim kontem w formacie JSON.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" disabled>
            Eksportuj dane
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Usunięcie konta</CardTitle>
          <CardDescription>Ta operacja jest nieodwracalna</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, w tym fiszek i historii nauki.</p>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" disabled>
            Usuń konto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
