import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginFormProps {
  redirectUrl?: string;
}

export function LoginForm({ redirectUrl = "/dashboard" }: LoginFormProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Zaloguj się do 10xCards</CardTitle>
        <CardDescription>
          Kontynuuj naukę z wykorzystaniem spaced repetition
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Kliknij przycisk poniżej, aby kontynuować.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a href={redirectUrl}>Kontynuuj</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
