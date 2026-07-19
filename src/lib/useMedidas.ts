import { useEffect, useRef, useState } from 'react'

/**
 * Mede um elemento e reage a redimensionamento. A área da colagem usa isso
 * para ocupar todo o espaço livre — a colagem não tem tamanho fixo.
 */
export function useMedidas<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [medidas, setMedidas] = useState({ largura: 0, altura: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect
      setMedidas({ largura: width, altura: height })
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return { ref, ...medidas }
}
