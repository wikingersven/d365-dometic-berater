import { getContext } from "@microsoft/power-apps/app";
import { useEffect, type ReactNode } from "react";

interface PowerProviderProps {
  children: ReactNode;
}

// Root-Wrapper der Code App: stellt den Power-Platform-Kontext her.
export default function PowerProvider({ children }: PowerProviderProps) {
  useEffect(() => {
    const initApp = async () => {
      try {
        await getContext();
        console.log("Power Platform SDK initialisiert.");
      } catch (error) {
        console.error("Power Platform SDK konnte nicht initialisiert werden:", error);
      }
    };

    void initApp();
  }, []);

  return <>{children}</>;
}
