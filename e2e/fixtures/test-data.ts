/**
 * Dane testowe dla testów E2E
 */

export const users = {
  standard: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  new: {
    email: 'new@example.com',
    password: 'newpassword123',
    name: 'New User'
  }
};

export const sampleTexts = {
  short: 'To jest krótki tekst do generowania fiszek.',
  medium: `Platforma 10xCards wykorzystuje algorytmy sztucznej inteligencji 
    do generowania fiszek edukacyjnych. Fiszki tworzone są na podstawie 
    dostarczonego przez użytkownika tekstu. System analizuje tekst, 
    identyfikuje kluczowe koncepcje i tworzy pytania oraz odpowiedzi.`,
  long: `Algorytm powtórek (spaced repetition) to technika uczenia się, 
    która pomaga w zapamiętywaniu informacji poprzez powtarzanie ich 
    w optymalnych odstępach czasu. Badania pokazują, że ludzie lepiej 
    zapamiętują informacje, gdy są one przypominane tuż przed momentem 
    ich zapomnienia. Algorytm SM-2 (SuperMemo 2) jest jednym z pierwszych
    algorytmów używanych w oprogramowaniu do nauki z powtórkami. Został 
    opracowany przez Piotra Woźniaka w latach 80. XX wieku. Algorytm ten
    wykorzystuje samodzielną ocenę trudności przypomnienia sobie danej 
    informacji przez uczącego się, aby dostosować odstępy czasowe między 
    kolejnymi powtórkami.`
};

export const sampleCard = {
  front: 'Co to jest spaced repetition?',
  back: 'Technika uczenia się polegająca na powtarzaniu informacji w optymalnych odstępach czasu.'
};
