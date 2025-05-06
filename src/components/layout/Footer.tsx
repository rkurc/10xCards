export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">&copy; {currentYear} 10xCards. Wszystkie prawa zastrzeżone.</p>
          </div>

          <nav className="flex space-x-4">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Prywatność
            </a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Warunki użytkowania
            </a>
            <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Kontakt
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
