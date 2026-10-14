/** Horário de um dia ("HH:MM"), ou null quando a loja não abre nesse dia. */
export type HorarioDia = { abre: string; fecha: string } | null;
/** Um item por dia da semana, na ordem do `Date.getDay()`: 0 = domingo. */
export type Horarios = HorarioDia[];

export const NOMES_DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;
const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function horaValida(hora: string): boolean {
  return HORA_VALIDA.test(hora);
}

function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** "18:00" → "18h", "18:30" → "18h30". */
export function formatarHora(hora: string): string {
  const [h, m] = hora.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

function agoraEmSaoPaulo(data: Date): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(valor("weekday"));
  return { dia, minutos: Number(valor("hour")) * 60 + Number(valor("minute")) };
}

export type StatusFuncionamento =
  | { aberto: true; fechaAs: string }
  | { aberto: false; abre: { emDias: number; dia: number; hora: string } | null };

export function statusFuncionamento(horarios: Horarios, data: Date = new Date()): StatusFuncionamento {
  const agora = agoraEmSaoPaulo(data);
  const hoje = horarios[agora.dia];
  if (hoje && agora.minutos >= minutos(hoje.abre) && agora.minutos < minutos(hoje.fecha)) {
    return { aberto: true, fechaAs: hoje.fecha };
  }
  if (hoje && agora.minutos < minutos(hoje.abre)) {
    return { aberto: false, abre: { emDias: 0, dia: agora.dia, hora: hoje.abre } };
  }
  for (let emDias = 1; emDias <= 7; emDias++) {
    const dia = (agora.dia + emDias) % 7;
    const horario = horarios[dia];
    if (horario) return { aberto: false, abre: { emDias, dia, hora: horario.abre } };
  }
  return { aberto: false, abre: null };
}

/** "Aberto agora · até 22h" / "Fechado · abre hoje às 18h" / "abre amanhã" / "abre sábado". */
export function textoStatus(status: StatusFuncionamento): string {
  if (status.aberto) return `Aberto agora · até ${formatarHora(status.fechaAs)}`;
  if (!status.abre) return "Fechado";
  const quando =
    status.abre.emDias === 0 ? "hoje" : status.abre.emDias === 1 ? "amanhã" : NOMES_DIAS[status.abre.dia];
  return `Fechado · abre ${quando} às ${formatarHora(status.abre.hora)}`;
}

/** Resumo da semana começando na segunda, juntando dias seguidos com o mesmo
 * horário: "Todos os dias, 18h às 22h" ou "Ter a Dom, 18h às 22h". */
export function resumoHorarios(horarios: Horarios): string {
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const chave = (d: number) => (horarios[d] ? `${horarios[d]!.abre}-${horarios[d]!.fecha}` : "");
  if (ordem.every((d) => horarios[d] && chave(d) === chave(1))) {
    return `Todos os dias, ${formatarHora(horarios[1]!.abre)} às ${formatarHora(horarios[1]!.fecha)}`;
  }
  const grupos: { de: number; ate: number }[] = [];
  for (const d of ordem) {
    if (!horarios[d]) continue;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ordem.indexOf(d) === ordem.indexOf(ultimo.ate) + 1 && chave(d) === chave(ultimo.ate)) {
      ultimo.ate = d;
    } else {
      grupos.push({ de: d, ate: d });
    }
  }
  return grupos
    .map(({ de, ate }) => {
      const dias = de === ate ? DIAS_CURTOS[de] : `${DIAS_CURTOS[de]} a ${DIAS_CURTOS[ate]}`;
      return `${dias}, ${formatarHora(horarios[de]!.abre)} às ${formatarHora(horarios[de]!.fecha)}`;
    })
    .join(" · ");
}
