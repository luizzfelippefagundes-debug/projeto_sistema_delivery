import { SignIn } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function EntrarMotoboyPage() {
  return (
    <AuthDoorShell titulo="Painel do motoboy" descricao="Acesse pra ver as entregas do dia.">
      <SignIn path="/entrar/motoboy" routing="path" signUpUrl="/cadastro/motoboy" fallbackRedirectUrl="/motoboy" />
    </AuthDoorShell>
  );
}
