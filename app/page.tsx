// app/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();

  const empresaId = cookieStore.get("empresa_id")?.value;

  if (empresaId) {
    redirect("/modulo1/dashboard");
  }

  redirect("/modulo1/");
}