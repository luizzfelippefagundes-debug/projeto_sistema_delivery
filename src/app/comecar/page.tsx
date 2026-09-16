import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ComecarForm from "@/components/ComecarForm";
import { getFuncionarioByClerkId } from "@/db/queries/funcionarios";

export default async function ComecarPage() {
  const { userId } = await auth();
  if (!userId) redirect("/entrar/dono");

  const existente = await getFuncionarioByClerkId(userId);
  if (existente) redirect(existente.papel === "dono" ? "/dono" : "/sem-acesso");

  const user = await currentUser();
  const nomeSugerido = user?.firstName ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ComecarForm nomeSugerido={nomeSugerido} />
    </div>
  );
}
