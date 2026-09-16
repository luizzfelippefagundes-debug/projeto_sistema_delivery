import { SignIn } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function EntrarCozinhaPage() {
  return (
    <AuthDoorShell titulo="Cozinha" descricao="Acesse pra ver a fila de pedidos em preparo.">
      <SignIn path="/entrar/cozinha" routing="path" signUpUrl="/cadastro/cozinha" fallbackRedirectUrl="/cozinha" />
    </AuthDoorShell>
  );
}
