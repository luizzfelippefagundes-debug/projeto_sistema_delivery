"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface QrDeMesa {
  mesa: number;
  dataUrl: string;
  url: string;
}

/** Grade de QR codes, um por mesa, pronta pra imprimir e plastificar/colar
 * em cada mesa — o cliente escaneia, cai direto no cardápio daquela mesa e
 * o pedido vai pra cozinha sem passar por ninguém. */
export default function MesasQrCodes({ qrs }: { qrs: QrDeMesa[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Imprime e coloca um em cada mesa — o cliente escaneia e pede direto pela cozinha.
        </p>
        <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
          <Printer /> Imprimir todos
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-2 print:gap-8">
        {qrs.map((qr) => (
          <Card key={qr.mesa} className="break-inside-avoid gap-2 py-4 print:border-2 print:shadow-none">
            <CardContent className="flex flex-col items-center gap-2 px-4 text-center">
              <p className="font-heading text-lg font-semibold">Mesa {qr.mesa}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.dataUrl} alt={`QR code da Mesa ${qr.mesa}`} className="size-40" />
              <p className="text-xs break-all text-muted-foreground">{qr.url}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
