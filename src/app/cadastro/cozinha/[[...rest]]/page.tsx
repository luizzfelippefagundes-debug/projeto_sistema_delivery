import { SignUp } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function CadastroCozinhaPage() {
  return (
    <AuthDoorShell titulo="Cozinha" descricao="Crie sua conta com o e-mail que a dona cadastrou pro seu convite.">
      <SignUp path="/cadastro/cozinha" routing="path" signInUrl="/entrar/cozinha" fallbackRedirectUrl="/cozinha" />
    </AuthDoorShell>
  );
}
