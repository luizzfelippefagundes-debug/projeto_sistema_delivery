import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getConviteFuncionarioPorEmail,
  getFuncionarioByClerkId,
  vincularClerkIdAoFuncionario,
} from "../db/queries/funcionarios";
import type { papelFuncionarioEnum } from "../db/schema";

type Papel = (typeof papelFuncionarioEnum.enumValues)[number];
type FuncionarioComAcesso = { papel: Papel; acessosExtras: Papel[] };

/** A dona enxerga tudo — além do próprio painel, ela pode entrar em
 * qualquer estação (comanda, cozinha, motoboy) pra cobrir ou supervisionar.
 * Os outros papéis só acessam a própria área, a menos que a dona tenha
 * liberado um acesso extra pra essa pessoa (permissão granular por área). */
function temAcesso(funcionario: FuncionarioComAcesso, papelEsperado: Papel) {
  return (
    funcionario.papel === papelEsperado ||
    funcionario.papel === "dono" ||
    funcionario.acessosExtras.includes(papelEsperado)
  );
}

/** Garante que quem está acessando a área tem o papel esperado (ou é a
 * dona, que acessa tudo). Cada papel tem sua própria porta de entrada
 * (`/entrar/<papel>`) — um atendente nunca vê nada da cozinha ou do
 * motoboy, e vice-versa. Se a conta ainda não está ligada mas existe um
 * convite pendente (cadastrado pela dona) com o mesmo e-mail, liga
 * automaticamente no primeiro login. */
export async function requireFuncionarioAccess(papelEsperado: Papel) {
  const { userId } = await auth();
  if (!userId) redirect(`/entrar/${papelEsperado}`);

  let funcionario = await getFuncionarioByClerkId(userId);

  if (!funcionario) {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (email) {
      const convite = await getConviteFuncionarioPorEmail(email);
      if (convite) funcionario = await vincularClerkIdAoFuncionario(convite.id, userId);
    }
  }

  if (!funcionario) {
    // Ninguém convidou essa pessoa ainda. Se ela está tentando entrar como
    // dona, deixa criar o próprio restaurante (self-service). Os outros
    // papéis sempre dependem de convite de uma dona já existente.
    redirect(papelEsperado === "dono" ? "/comecar" : "/sem-acesso");
  }
  if (!funcionario.ativo) redirect("/sem-acesso");
  if (!temAcesso(funcionario, papelEsperado)) redirect("/sem-acesso");
  return funcionario;
}

/** Pra telas que qualquer funcionário pode acessar, de qualquer papel —
 * hoje só a impressão de comanda, que tanto atendente quanto cozinha (e a
 * dona) podem disparar. Não faz sentido restringir por papel específico
 * aqui, só confirma que a pessoa é funcionária ativa de algum restaurante. */
export async function requireQualquerFuncionario() {
  const { userId } = await auth();
  if (!userId) redirect("/entrar");
  const funcionario = await getFuncionarioByClerkId(userId);
  if (!funcionario || !funcionario.ativo) redirect("/sem-acesso");
  return funcionario;
}

/** Usado dentro de Server Actions de qualquer área da equipe — elas são
 * endpoints públicos, então cada uma precisa revalidar autenticação e papel
 * por conta própria, sem depender só do layout que a chamou. */
export async function assertFuncionario(papelEsperado: Papel) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const funcionario = await getFuncionarioByClerkId(userId);
  if (!funcionario || !funcionario.ativo || !temAcesso(funcionario, papelEsperado)) {
    throw new Error("Sem acesso a essa área");
  }
  return funcionario;
}

/** Mesma ideia de requireQualquerFuncionario, mas lançando erro em vez de
 * redirecionar — pra Server Actions chamadas por qualquer área da equipe
 * (ex: inscrição de notificação push, que não é específica de um papel). */
export async function assertQualquerFuncionario() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const funcionario = await getFuncionarioByClerkId(userId);
  if (!funcionario || !funcionario.ativo) throw new Error("Sem acesso a essa área");
  return funcionario;
}
