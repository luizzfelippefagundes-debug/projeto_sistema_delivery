"use client";

import { useEffect, useRef } from "react";

/** Toca dois bipes curtos (Web Audio, sem depender de arquivo de som) quando
 * um id novo aparece na lista em relação à última checagem — usado pra
 * avisar de pedido novo enquanto a pessoa está de mãos ocupadas na cozinha
 * e não fica olhando a tela o tempo todo. Não apita no carregamento inicial,
 * só quando um id que não existia antes aparece depois. */
export function useAlertaPedidoNovo(ids: string[]) {
  const vistosRef = useRef<Set<string> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    function desbloquear() {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      audioCtxRef.current.resume().catch(() => {});
    }
    window.addEventListener("pointerdown", desbloquear, { once: true });
    return () => window.removeEventListener("pointerdown", desbloquear);
  }, []);

  useEffect(() => {
    const atual = new Set(ids);
    const anterior = vistosRef.current;
    if (anterior && ids.some((id) => !anterior.has(id))) {
      tocarBipes(audioCtxRef.current);
    }
    vistosRef.current = atual;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);
}

function tocarBipes(ctx: AudioContext | null) {
  if (!ctx) return;
  tocarBipe(ctx, 880, 0);
  tocarBipe(ctx, 1046.5, 0.2);
}

function tocarBipe(ctx: AudioContext, frequencia: number, atraso: number) {
  const inicio = ctx.currentTime + atraso;
  const osc = ctx.createOscillator();
  const ganho = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequencia;
  ganho.gain.setValueAtTime(0.0001, inicio);
  ganho.gain.exponentialRampToValueAtTime(0.3, inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.35);
  osc.connect(ganho).connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + 0.4);
}
