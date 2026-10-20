import { lazy, Suspense } from "react";
import type { SandboxCommands } from "../sandbox/ui/Panel";
import { useSandbox } from "../sandbox/store";

const Panel = lazy(() => import("../sandbox/ui/Panel").then((m) => ({ default: m.Panel })));

export function DebugPanel({ commands }: { commands: SandboxCommands }) {
  const on = useSandbox((s) => s.debugPanel);
  if (!on) return null;
  return (
    <Suspense fallback={null}>
      <Panel commands={commands} />
    </Suspense>
  );
}
