/**
 * Marca do Lambe: duas folhas coladas torta uma sobre a outra, como um
 * lambe-lambe de rua. A de trás é só contorno, a da frente leva o recorte de
 * foto — sol e morro, o mínimo que ainda lê como fotografia a 18 px.
 *
 * As cores saem dos tokens do tema, então a marca acompanha claro e escuro.
 */
export function Logo({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* folha de trás */}
      <g transform="rotate(-10 9 13)">
        <rect
          x="3.2"
          y="6.4"
          width="11"
          height="13.2"
          rx="1.4"
          className="fill-painel stroke-suave"
          strokeWidth="1.5"
        />
      </g>

      {/* folha da frente, colada por cima */}
      <g transform="rotate(8 15 11)">
        <rect x="9.6" y="4.4" width="11.2" height="13.2" rx="1.4" className="fill-realce" />
        <circle cx="13.1" cy="8.6" r="1.25" className="fill-painel" />
        <path
          d="M10.8 15.4 L13.4 12.1 L15.4 14.3 L17.1 12.7 L19.8 15.7"
          className="stroke-painel"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
