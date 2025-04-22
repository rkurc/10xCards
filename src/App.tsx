import { RootLayout } from "@/components/layout/RootLayout";
import type { PropsWithChildren } from "react";

function App({ children }: PropsWithChildren) {
  return <RootLayout>{children}</RootLayout>;
}

export default App;
