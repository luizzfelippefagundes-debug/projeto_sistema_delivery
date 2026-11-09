export default function RodapeMarca() {
  return (
    <div className="mx-auto mb-44 sm:mb-48 flex w-fit flex-col items-center gap-2 px-4 pt-4 pb-2 text-center">
      <a
        href="https://www.instagram.com/noroestesistemas/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1.5 opacity-70 transition-opacity hover:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/noroeste-food-logo.png"
          alt="Noroeste Food"
          className="h-6 w-auto dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/noroeste-food-logo-branco.png"
          alt="Noroeste Food"
          className="hidden h-6 w-auto dark:block"
        />
        <span className="text-[11px] text-muted-foreground">
          Desenvolvido pela Noroeste Sistemas
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          @noroestesistemas
        </span>
      </a>

      <a
        href="https://wa.me/5527997506203?text=Ol%C3%A1!%20Vi%20o%20Noroeste%20Food%20e%20quero%20saber%20mais%20para%20a%20minha%20loja."
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1 rounded-xl border border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <span>Quer que seu estabelecimento tenha um sistema como esse?</span>
        <span className="flex items-center gap-1 font-semibold text-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-3.5 text-emerald-500"
            aria-hidden="true"
          >
            <path d="M12.04 2a9.93 9.93 0 0 0-8.5 15.05L2 22l5.1-1.5A9.94 9.94 0 1 0 12.04 2Zm0 18.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.03.89.9-2.95-.2-.31a8.1 8.1 0 1 1 6.76 3.68Zm4.45-6.06c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06a6.6 6.6 0 0 1-1.94-1.2 7.3 7.3 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
          </svg>
          Fala com a gente: (27) 99750-6203
        </span>
      </a>
    </div>
  );
}
