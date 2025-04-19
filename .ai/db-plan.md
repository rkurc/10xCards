# Schemat bazy danych dla aplikacji 10xCards

## 1. Tabele i ich struktura

### 1.1. Rozszerzenia PostgreSQL
```sql
-- Rozszerzenie dla generowania UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.2. Typy wyliczeniowe (Enums)
```sql
-- Typ źródła fiszki
CREATE TYPE source_type AS ENUM ('ai', 'ai_edited', 'manual');

-- Typ statusu znajomości fiszki
CREATE TYPE knowledge_status AS ENUM ('new', 'learning', 'review', 'mastered');
```

### 1.3. Tabele główne

#### profiles - Rozszerzenie auth.users Supabase
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### card_sets - Zestawy fiszek
```sql
CREATE TABLE public.card_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT card_sets_name_length CHECK (char_length(name) <= 100)
);
```

#### cards - Fiszki 
```sql
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  front_content TEXT NOT NULL,
  back_content TEXT NOT NULL,
  source_type source_type NOT NULL DEFAULT 'manual',
  readability_score NUMERIC(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT cards_front_length CHECK (char_length(front_content) <= 200),
  CONSTRAINT cards_back_length CHECK (char_length(back_content) <= 500)
);
```

#### cards_to_sets - Powiązania fiszek z zestawami (relacja wiele-do-wielu)
```sql
CREATE TABLE public.cards_to_sets (
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  set_id UUID REFERENCES public.card_sets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (card_id, set_id)
);
```

#### card_progress - Postęp nauki fiszek
```sql
CREATE TABLE public.card_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  status knowledge_status DEFAULT 'new',
  ease_factor NUMERIC(4,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 0, -- liczba dni między powtórkami
  next_review TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_review TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, card_id)
);
```

#### card_personalizations - Personalizacja fiszek
```sql
CREATE TABLE public.card_personalizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}', -- przechowuje kolory, odnośniki, itp.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, card_id)
);
```

#### generation_logs - Logi generowania fiszek przez AI
```sql
CREATE TABLE public.generation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  model TEXT,
  generated_count INTEGER NOT NULL DEFAULT 0,
  accepted_unedited_count INTEGER NULLABLE,
  accepted_edited_count INTEGER NULLABLE,
  source_text_hash TEXT, -- hash tekstu źródłowego dla deduplikacji
  source_text_length INTEGER, -- długość tekstu źródłowego (1000-10000 znaków)
  generation_duration: INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 2. Relacje między tabelami

### Relacje jeden-do-wielu
- **profiles -> card_sets**: Użytkownik może posiadać wiele zestawów fiszek
- **profiles -> cards**: Użytkownik może posiadać wiele fiszek
- **profiles -> card_progress**: Użytkownik może mieć wiele wpisów postępu nauki
- **profiles -> card_personalizations**: Użytkownik może mieć wiele personalizacji fiszek
- **profiles -> generation_logs**: Użytkownik może mieć wiele wpisów generowania przez AI

### Relacje wiele-do-wielu
- **cards <-> card_sets**: Fiszka może należeć do wielu zestawów, zestaw może zawierać wiele fiszek (poprzez tabelę cards_to_sets)

## 3. Indeksy dla optymalizacji wydajności

```sql
-- Indeksy dla tabeli cards
CREATE INDEX cards_user_id_idx ON public.cards(user_id);
CREATE INDEX cards_user_updated_idx ON public.cards(user_id, updated_at);
CREATE INDEX cards_readability_idx ON public.cards(readability_score);
CREATE INDEX cards_not_deleted_idx ON public.cards(is_deleted) WHERE is_deleted = false;

-- Indeksy dla tabeli card_sets
CREATE INDEX card_sets_user_id_idx ON public.card_sets(user_id);
CREATE INDEX card_sets_not_deleted_idx ON public.card_sets(is_deleted) WHERE is_deleted = false;

-- Indeksy dla tabeli cards_to_sets
CREATE INDEX cards_to_sets_set_id_idx ON public.cards_to_sets(set_id);
CREATE INDEX cards_to_sets_card_id_idx ON public.cards_to_sets(card_id);

-- Indeksy dla tabeli card_progress (kluczowe dla algorytmu powtórek)
CREATE INDEX card_progress_user_id_idx ON public.card_progress(user_id);
CREATE INDEX card_progress_card_id_idx ON public.card_progress(card_id);
CREATE INDEX card_progress_next_review_idx ON public.card_progress(user_id, status, next_review);

-- Indeksy dla tabeli card_personalizations
CREATE INDEX card_personalizations_user_id_idx ON public.card_personalizations(user_id);
CREATE INDEX card_personalizations_card_id_idx ON public.card_personalizations(card_id);

-- Indeks dla tabeli generation_logs
CREATE INDEX generation_logs_user_id_idx ON public.generation_logs(user_id);
```

## 4. Polityki bezpieczeństwa na poziomie wierszy (RLS)

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards_to_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_personalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- Polityki dla profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Polityki dla card_sets
CREATE POLICY "Users can view own card sets" 
ON public.card_sets FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own card sets" 
ON public.card_sets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own card sets" 
ON public.card_sets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own card sets" 
ON public.card_sets FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla cards
CREATE POLICY "Users can view own cards" 
ON public.cards FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own cards" 
ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" 
ON public.cards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" 
ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla cards_to_sets
CREATE POLICY "Users can view own cards_to_sets" 
ON public.cards_to_sets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cards 
    WHERE id = cards_to_sets.card_id AND user_id = auth.uid() AND is_deleted = false
  )
);

CREATE POLICY "Users can manage own cards_to_sets" 
ON public.cards_to_sets FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cards 
    WHERE id = cards_to_sets.card_id AND user_id = auth.uid() AND is_deleted = false
  ) AND 
  EXISTS (
    SELECT 1 FROM public.card_sets 
    WHERE id = cards_to_sets.set_id AND user_id = auth.uid() AND is_deleted = false
  )
);

CREATE POLICY "Users can delete own cards_to_sets" 
ON public.cards_to_sets FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.cards 
    WHERE id = cards_to_sets.card_id AND user_id = auth.uid() AND is_deleted = false
  )
);

-- Polityki dla card_progress
CREATE POLICY "Users can view own card progress" 
ON public.card_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card progress" 
ON public.card_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own card progress" 
ON public.card_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own card progress" 
ON public.card_progress FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla card_personalizations
CREATE POLICY "Users can view own personalizations" 
ON public.card_personalizations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personalizations" 
ON public.card_personalizations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalizations" 
ON public.card_personalizations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personalizations" 
ON public.card_personalizations FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla generation_logs
CREATE POLICY "Users can view own generation logs" 
ON public.generation_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation logs" 
ON public.generation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 5. Dodatkowe uwagi i decyzje projektowe

### 5.1. Mechanizm soft delete
Wszystkie główne tabele (profiles, card_sets, cards) wykorzystują mechanizm soft delete poprzez pola `is_deleted` i `deleted_at`. Zapytania domyślnie filtrują usunięte rekordy dzięki indeksom częściowym i odpowiednim politkom RLS.

### 5.2. UUID jako klucze główne
Użycie UUID jako kluczy głównych zamiast sekwencyjnych identyfikatorów zapewnia:
- Większe bezpieczeństwo (trudniejsze do zgadnięcia)
- Łatwiejszą federację danych w przyszłości
- Możliwość generowania ID po stronie klienta (bez konieczności odwoływania się do bazy)

### 5.3. Relacja wiele-do-wielu dla fiszek i zestawów
Mimo że początkowe UI może wspierać tylko przypisanie fiszki do jednego zestawu, schemat implementuje relację wiele-do-wielu, co pozwala na:
- Łatwiejsze rozszerzenie funkcjonalności w przyszłości
- Unikanie duplikacji danych, gdy fiszka powinna należeć do wielu zestawów
- Bardziej elastyczne zarządzanie zestawami

### 5.4. Algorytm powtórek
Tabela `card_progress` została zaprojektowana do obsługi podstawowych algorytmów spaced repetition, zawierając pola:
- `status` - obecny stan fiszki (new, learning, review, mastered)
- `ease_factor` - współczynnik łatwości (wpływa na interwał powtórek)
- `interval` - liczba dni do następnej powtórki
- `next_review` - data następnej powtórki
- `review_count` - liczba wykonanych powtórek

### 5.5. Ocena czytelności (FOG)
Wskaźnik FOG będzie obliczany po stronie aplikacji i przechowywany w tabeli cards jako pole `readability_score`.

### 5.6. Typy enum
Zastosowanie typów enum dla `source_type` i `knowledge_status` zapewnia spójność danych i ogranicza możliwe wartości do predefiniowanego zestawu.

### 5.7. Bezpieczeństwo danych
Kompleksowe RLS dla wszystkich tabel zapewnia, że użytkownicy mają dostęp tylko do własnych danych. Każda polityka została dokładnie przemyślana, aby zapewnić odpowiedni poziom bezpieczeństwa.
