import { useEffect, useState } from 'react'

/**
 * Abaixo disto as quatro colunas fixas (fotos, lâminas, colagem, painel) não
 * cabem: elas sozinhas somam ~690 px e não sobra colagem para editar. Aí o app
 * troca para o layout compacto, com a colagem ocupando a tela e os painéis
 * numa gaveta embaixo.
 */
const LIMITE = 1024

export function useCompacto(): boolean {
  const [compacto, setCompacto] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < LIMITE,
  )

  useEffect(() => {
    const consulta = window.matchMedia(`(max-width: ${LIMITE - 1}px)`)
    const aoMudar = () => setCompacto(consulta.matches)
    aoMudar()
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  return compacto
}
