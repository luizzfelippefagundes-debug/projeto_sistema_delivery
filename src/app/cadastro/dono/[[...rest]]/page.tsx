import { SignUp } from "@clerk/nextjs";
import AuthDoorShell from "@/components/AuthDoorShell";

export default function CadastroDonoPage() {
  return (
    <AuthDoorShell titulo="Criar meu restaurante" descricao="Cadastre sua conta pra montar o cardápio e começar a vender.">
      <SignUp path="/cadastro/dono" routing="path" signInUrl="/entrar/dono" fallbackRedirectUrl="/dono" />
    </AuthDoorShell>
  );
}
