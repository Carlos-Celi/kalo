import { parsearMarkdown, tramosEnLinea } from '../../domain/markdown'

function EnLinea({ texto }: { texto: string }) {
  return (
    <>
      {tramosEnLinea(texto).map((tramo, i) => {
        switch (tramo.tipo) {
          case 'negrita':
            return (
              <strong key={i} className="font-extrabold">
                {tramo.texto}
              </strong>
            )
          case 'cursiva':
            return <em key={i}>{tramo.texto}</em>
          case 'codigo':
            return (
              <code key={i} className="rounded bg-banco px-1 py-px text-[0.92em]">
                {tramo.texto}
              </code>
            )
          default:
            return <span key={i}>{tramo.texto}</span>
        }
      })}
    </>
  )
}

/** Respuesta con formato del asistente. Genera elementos de React, nunca HTML en crudo. */
export function Markdown({ texto }: { texto: string }) {
  const bloques = parsearMarkdown(texto)
  return (
    <div className="flex flex-col gap-2.5">
      {bloques.map((bloque, i) => {
        switch (bloque.tipo) {
          case 'titulo':
            return (
              <p
                key={i}
                className={`font-extrabold tracking-[-0.2px] text-hueso ${
                  bloque.nivel === 1 ? 'text-[17px]' : bloque.nivel === 2 ? 'pt-1 text-[15px]' : 'text-sm'
                }`}
              >
                <EnLinea texto={bloque.texto} />
              </p>
            )
          case 'parrafo':
            return (
              <p key={i} className="whitespace-pre-line">
                <EnLinea texto={bloque.texto} />
              </p>
            )
          case 'lista': {
            const Etiqueta = bloque.ordenada ? 'ol' : 'ul'
            return (
              <Etiqueta
                key={i}
                className={`flex flex-col gap-1 pl-5 ${bloque.ordenada ? 'list-decimal' : 'list-disc'} marker:text-llama`}
              >
                {bloque.elementos.map((elemento, j) => (
                  <li key={j} className="pl-0.5">
                    <EnLinea texto={elemento} />
                  </li>
                ))}
              </Etiqueta>
            )
          }
          case 'tabla':
            return (
              <div key={i} className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[260px] border-collapse text-[13px]">
                  <thead>
                    <tr>
                      {bloque.cabecera.map((celda, j) => (
                        <th
                          key={j}
                          scope="col"
                          className="border-b border-filo px-2 py-1.5 text-left font-extrabold whitespace-nowrap"
                        >
                          <EnLinea texto={celda} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bloque.filas.map((fila, j) => (
                      <tr key={j} className="border-b border-divisor last:border-b-0">
                        {fila.map((celda, k) => (
                          <td key={k} className="px-2 py-1.5 align-top">
                            <EnLinea texto={celda} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'separador':
            return <hr key={i} className="border-0 border-t border-filo" />
        }
      })}
    </div>
  )
}
