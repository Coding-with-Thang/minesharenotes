import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";

export const instant = false;

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-muted p-8">Loading…</p>}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  const user = await getOptionalUser();
  redirect(user ? "/notes" : "/login");
  return null;
}
