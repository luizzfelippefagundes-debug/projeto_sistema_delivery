import { SignIn } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function EntrarAtendentePage() {
  return (
    <AuthDoorShell titulo="Comanda digital" descricao="Acesse pra lançar os pedidos das mesas.">
      <SignIn path="/entrar/atendente" routing="path" signUpUrl="/cadastro/atendente" fallbackRedirectUrl="/atendente" />
    </AuthDoorShell>
  );
}
