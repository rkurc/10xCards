import { RootLayout } from "@/components/layout/RootLayout";
import type { PropsWithChildren } from "react";
import { DialogProvider } from "@/components/DialogProvider";

function App({ children }: PropsWithChildren) {
  return (
    <RootLayout>
      <DialogProvider>{children}</DialogProvider>
    </RootLayout>
  );
}

export default App;
