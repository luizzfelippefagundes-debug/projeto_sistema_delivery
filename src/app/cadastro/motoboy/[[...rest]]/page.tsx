import { SignUp } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function CadastroMotoboyPage() {
  return (
    <AuthDoorShell titulo="Painel do motoboy" descricao="Crie sua conta com o e-mail que a dona cadastrou pro seu convite.">
      <SignUp path="/cadastro/motoboy" routing="path" signInUrl="/entrar/motoboy" fallbackRedirectUrl="/motoboy" />
    </AuthDoorShell>
  );
}
