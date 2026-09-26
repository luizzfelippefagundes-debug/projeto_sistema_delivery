import QRCode from "qrcode";

/** Gera o QR code de uma URL como data URL PNG, pronto pra colocar num
 * <img>. Gerado no servidor (página do dono) — nada de lib client-side. */
export async function gerarQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 400 });
}
