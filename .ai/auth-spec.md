# Specyfikacja techniczna modułu autentykacji dla 10xCards

## 1. Wprowadzenie

Niniejsza specyfikacja opisuje szczegółową architekturę modułu rejestracji, logowania i odzyskiwania hasła dla aplikacji 10xCards. Rozwiązanie bazuje na technologii Supabase Auth zintegrowanej z Astro oraz React, zgodnie z wymaganiami określonymi w US-003 oraz przyjętym stosem technologicznym.

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Nowe strony i komponenty

#### Strony Astro:
- `/login.astro` - strona logowania
- `/register.astro` - strona rejestracji
- `/forgot-password.astro` - strona odzyskiwania hasła
- `/reset-password.astro` - strona resetowania hasła (dostępna po kliknięciu w link z maila)
- `/account.astro` - strona zarządzania kontem użytkownika (chroniona)

#### Komponenty React:
- `LoginForm.tsx` - formularz logowania z walidacją
- `RegisterForm.tsx` - formularz rejestracji z walidacją
- `ForgotPasswordForm.tsx` - formularz odzyskiwania hasła
- `ResetPasswordForm.tsx` - formularz resetowania hasła
- `UserMenu.tsx` - menu użytkownika w prawym górnym rogu (zawiera opcje wylogowania)
- `AuthGuard.tsx` - komponent warunkowy do ochrony zasobów wymagających autentykacji

### 2.2. Modyfikacje istniejących komponentów

#### Layout:
- `BaseLayout.astro` - rozszerzenie o stan autentykacji i dynamiczne renderowanie przycisku logowania lub menu użytkownika w nagłówku
- `Navigation.tsx` - rozbudowa nawigacji o elementy zależne od stanu autentykacji

### 2.3. Podział odpowiedzialności

#### Strony Astro:
- Renderowanie struktury stron i ładowanie komponentów React
- Przekazywanie początkowego stanu do hydratacji
- Sprawdzanie statusu autoryzacji użytkownika na poziomie server-side
- Przekierowanie użytkowników w zależności od stanu autentykacji
- Ograniczenie dostępu do wszystkich stron funkcjonalnych (generowanie fiszek, przegląd, kolekcje, nauka) dla niezalogowanych użytkowników

#### Komponenty React:
- Obsługa formularzy i interakcji użytkownika
- Walidacja danych wejściowych po stronie klienta
- Wykonywanie żądań do API Supabase
- Zarządzanie stanem autentykacji po stronie klienta
- Wyświetlanie komunikatów błędów i potwierdzeń

### 2.4. Walidacja i komunikaty błędów

#### Walidacja:
- Email: format poprawnego adresu email
- Hasło: minimum 8 znaków, co najmniej jedna litera i jedna cyfra
- Potwierdzenie hasła: zgodność z polem hasła

#### Komunikaty błędów:
- Niepoprawny format adresu email
- Za słabe hasło
- Niezgodność haseł
- Niepoprawne dane logowania
- Konto z podanym adresem email już istnieje
- Błąd serwera podczas rejestracji/logowania
- Błąd wysyłania linku resetowania hasła

### 2.5. Obsługa scenariuszy

#### Dostęp dla niezalogowanych użytkowników:
1. Użytkownik niezalogowany ma dostęp tylko do strony powitalnej (głównej)
2. Próba dostępu do jakiejkolwiek innej funkcjonalności (generowanie fiszek, przegląd, kolekcje, nauka) przekierowuje na stronę logowania
3. Po zalogowaniu użytkownik jest przekierowany do oryginalnie żądanej strony

#### Rejestracja:
1. Użytkownik wypełnia formularz rejestracji
2. System waliduje dane wejściowe
3. Po poprawnej walidacji, konto zostaje utworzone przez Supabase Auth
4. Użytkownik otrzymuje komunikat o pomyślnej rejestracji
5. System przekierowuje użytkownika na stronę główną lub dashboard

#### Logowanie:
1. Użytkownik wprowadza email i hasło
2. System waliduje dane wejściowe
3. Po poprawnej walidacji, system weryfikuje dane przez Supabase Auth
4. W przypadku poprawnych danych, użytkownik jest przekierowany do poprzedniej strony lub dashboardu
5. W przypadku niepoprawnych danych, wyświetlany jest komunikat błędu

#### Odzyskiwanie hasła:
1. Użytkownik wprowadza adres email na stronie odzyskiwania hasła
2. System waliduje format adresu email
3. System wysyła email z linkiem do resetowania hasła
4. Użytkownik klika link w emailu i jest przekierowany na stronę resetowania hasła
5. Użytkownik wprowadza nowe hasło i potwierdza je
6. System aktualizuje hasło i przekierowuje użytkownika na stronę logowania

## 3. LOGIKA BACKENDOWA

### 3.1. Struktura endpointów API

#### Endpointy Supabase Auth:
- `/auth/signup` - rejestracja nowego użytkownika
- `/auth/signin` - logowanie użytkownika
- `/auth/signout` - wylogowanie użytkownika
- `/auth/resetPassword` - inicjacja procesu resetowania hasła
- `/auth/updateUser` - aktualizacja danych użytkownika

### 3.2. Modele danych

#### User:
```typescript
interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in?: string;
  metadata?: Record<string, any>;
}
```

### 3.3. Mechanizmy walidacji danych

- Walidacja frontendowa przez formularze React z biblioteką formularzy (np. React Hook Form)
- Walidacja backendowa przez Supabase Auth
- Własne middleware do walidacji specyficznych dla aplikacji reguł

### 3.4. Obsługa wyjątków

- Standardowe kody błędów HTTP (400, 401, 403, 500)
- Strukturyzowane odpowiedzi błędów z API Supabase
- Centralna obsługa błędów w komponentach React
- Dedykowany kontekst React do zarządzania stanem błędów

### 3.5. Aktualizacja renderowania server-side

Modyfikacja pliku `astro.config.mjs` w celu zapewnienia prawidłowej obsługi sesji:

```javascript
export default defineConfig({
  // ...existing code...
  serverMiddleware: [
    // Middleware do przetwarzania sesji użytkownika
    {
      onRequest: async ({ request, cookies, locals }) => {
        const session = await getSessionFromCookies(cookies);
        if (session) {
          locals.user = session.user;
        }
      }
    }
  ]
});
```

## 4. SYSTEM AUTENTYKACJI

### 4.1. Integracja z Supabase Auth

#### Inicjalizacja klienta Supabase:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Serwis autentykacji:
```typescript
// src/services/authService.ts
import { supabase } from '../lib/supabase';

export const authService = {
  async login(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },
  async register(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },
  async logout() {
    return supabase.auth.signOut();
  },
  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },
  async updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },
  async getCurrentUser() {
    return supabase.auth.getUser();
  },
  async getSession() {
    return supabase.auth.getSession();
  }
};
```

### 4.2. Mechanizm ochrony zasobów

#### Context Provider do zarządzania stanem autentykacji:
```typescript
// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await authService.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
      }
      setLoading(false);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### Hook do ochrony stron wymagających autentykacji:
```typescript
// src/hooks/useRequireAuth.ts
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useRequireAuth(redirectUrl = '/login') {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectUrl;
    }
  }, [user, loading, redirectUrl]);
  
  return { user, loading };
}
```

### 4.3. Ochrona stron na poziomie serwera

```typescript
// src/utils/auth.ts
import { supabase } from '../lib/supabase';
import type { AstroGlobal } from 'astro';

export async function checkAuth(Astro: AstroGlobal) {
  const authCookie = Astro.cookies.get('sb-auth-token');
  
  if (!authCookie?.value) {
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authCookie.value);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
```

## 5. WNIOSKI I ZALECENIA

1. Korzystanie z Supabase Auth znacząco uprości implementację systemu autentykacji, eliminując konieczność tworzenia własnych rozwiązań.

2. Podział odpowiedzialności między Astro (server-side) i React (client-side) pozwoli na optymalne wykorzystanie obu technologii: szybkie ładowanie stron dzięki Astro oraz interaktywność formularzy dzięki React.

3. Zgodnie ze zaktualizowanym PRD, wszystkie funkcjonalności aplikacji (poza stroną powitalną) wymagają autentykacji, co ułatwia implementację zabezpieczeń dostępu.

4. Należy zadbać o odpowiednie zabezpieczenie API i kontrolę dostępu do zasobów zarówno na poziomie frontendu, jak i backendu.

5. Warto rozważyć implementację mechanizmu odświeżania tokenów sesji dla lepszego doświadczenia użytkownika przy dłuższych sesjach.

6. System autentykacji powinien być zintegrowany z mechanizmem uprawnień i ról użytkowników, gdy funkcjonalności będą rozbudowywane.
