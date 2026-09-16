import { SignUp } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function CadastroAtendentePage() {
  return (
    <AuthDoorShell titulo="Comanda digital" descricao="Crie sua conta com o e-mail que a dona cadastrou pro seu convite.">
      <SignUp path="/cadastro/atendente" routing="path" signInUrl="/entrar/atendente" fallbackRedirectUrl="/atendente" />
    </AuthDoorShell>
  );
}
