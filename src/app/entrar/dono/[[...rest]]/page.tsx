import { SignIn } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function EntrarDonoPage() {
  return (
    <AuthDoorShell titulo="Painel da dona" descricao="Acesse a gestão completa da Dashi Sushi.">
      <SignIn path="/entrar/dono" routing="path" signUpUrl="/cadastro/dono" fallbackRedirectUrl="/dono" />
    </AuthDoorShell>
  );
}
