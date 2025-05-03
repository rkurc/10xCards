/**
 * Dane testowe dla testów E2E
 */

export const users = {
  standard: {
    email: "test@example.com",
    password: "password123",
    name: "Test User",
  },
  new: {
    email: "new@example.com",
    password: "newpassword123",
    name: "New User",
  },
};

export const sampleTexts = {
  short: "To jest krótki tekst do generowania fiszek.",
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
    kolejnymi powtórkami.`,
};

export const sampleCard = {
  front: "Co to jest spaced repetition?",
  back: "Technika uczenia się polegająca na powtarzaniu informacji w optymalnych odstępach czasu.",
};

export const TEST_DATA = {
  // Sample text for flash card generation
  sampleText: `
    The process of photosynthesis is essential for life on Earth. It is the process by which plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy in the form of glucose or other sugars. This energy can later be released to fuel the organism's activities.

    Photosynthesis takes place in the chloroplasts, specifically using the chlorophyll pigments. The overall chemical equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This means that the reactants are carbon dioxide, water, and light energy, while the products are glucose and oxygen.

    During photosynthesis, plants capture light energy which excites electrons that are then used to split water molecules. This process is called photolysis and it produces oxygen as a byproduct. The hydrogen ions and high-energy electrons from water are used to convert carbon dioxide into glucose.

    Photosynthesis has two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). The light-dependent reactions take place in the thylakoid membrane and convert light energy into chemical energy in the form of ATP and NADPH. The Calvin cycle takes place in the stroma and uses the ATP and NADPH from the light-dependent reactions to produce glucose from carbon dioxide.
  `,

  // Sample card responses
  cardResponses: [
    {
      accept: true,
      edit: false,
    },
    {
      accept: true,
      edit: true,
      frontContent: "What are the two main stages of photosynthesis?",
      backContent:
        "The two main stages are the light-dependent reactions and the Calvin cycle (light-independent reactions).",
    },
    {
      accept: false,
    },
    {
      accept: true,
      edit: false,
    },
  ],

  // Set details for finalizing generation
  setDetails: {
    name: "Photosynthesis Basics",
    description: "Key concepts about photosynthesis process",
  },
};
