import { useContext } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";
import { GenerationProvider } from "../contexts/generation-context";

export function App() {
  const { isAuthenticated, login } = useContext(AuthContext);


  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    } else {
      login();
      // After login, redirect to dashboard
      setTimeout(() => (window.location.href = "/dashboard"), 100);
    }
  };

  return (
    <GenerationProvider>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Witaj w 10xCards</h1>
            <p className="text-xl text-muted-foreground">
              Twórz i ucz się za pomocą fiszek generowanych przez sztuczną inteligencję
            </p>
          </div>

          <div className="grid gap-8">
            {/* Main feature card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Automatyczne generowanie fiszek</CardTitle>
                <CardDescription>Oszczędź czas i wysiłek dzięki zaawansowanej AI</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Zapomnij o żmudnym, ręcznym tworzeniu fiszek. Z 10xCards wystarczy, że wkleisz dowolny tekst, a nasza
                  sztuczna inteligencja automatycznie wygeneruje wysokiej jakości fiszki dostosowane do twoich potrzeb
                  naukowych.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGetStarted} variant="secondary" size="lg">
                  {isAuthenticated ? "Przejdź do panelu" : "Zarejestruj się za darmo"}
                </Button>
              </CardFooter>
            </Card>

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Oszczędność czasu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Generuj dziesiątki fiszek w kilka sekund zamiast poświęcać godziny na ich ręczne tworzenie.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inteligentne fiszki</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Nasze AI tworzy fiszki ze zrozumieniem kontekstu, skupiając się na kluczowych informacjach.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pełna kontrola</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Edytuj, akceptuj lub odrzucaj wygenerowane fiszki według własnych preferencji.</p>
                </CardContent>
              </Card>
            </div>

            {/* Call to action */}
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>Gotowy na efektywniejszą naukę?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Dołącz do społeczności użytkowników, którzy już korzystają z naszych narzędzi i osiągają lepsze
                  wyniki.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGetStarted} variant="secondary" size="lg">
                  {isAuthenticated ? "Przejdź do panelu" : "Zarejestruj się za darmo"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </GenerationProvider>
  );
}
