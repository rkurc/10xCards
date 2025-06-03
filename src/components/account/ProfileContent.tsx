import { useDirectAuth } from "@/hooks/useDirectAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// TODO: Implement personal data management functionality (US-011)
// - Add user profile settings
// - Implement data export functionality for GDPR compliance
// - Add account deletion option that removes all user data

export function ProfileContent() {
  const { user } = useDirectAuth();
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profil użytkownika</CardTitle>
          <CardDescription>Musisz być zalogowany, aby zobaczyć swoje dane.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profil użytkownika</CardTitle>
          <CardDescription>Zarządzaj swoimi danymi osobowymi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          
          {user.name && (
            <div>
              <p className="text-sm font-medium">Imię</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
          )}
          
          {/* TODO: Add form to update profile information */}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button variant="outline" disabled>
            Eksportuj moje dane
          </Button>
          <Button variant="destructive" disabled>
            Usuń konto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ProfileContent;
