import { SignIn } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function EntrarDonoPage() {
  return (
    <AuthDoorShell titulo="Painel da dona" descricao="Acesse o painel de gestão do seu restaurante.">
      <SignIn path="/entrar/dono" routing="path" signUpUrl="/cadastro/dono" fallbackRedirectUrl="/dono" />
    </AuthDoorShell>
  );
}
