/**
 * پشتهٔ لایه‌ها برای کلید Escape.
 *
 * وقتی چند لایه (پنل شناور، دیالوگ تأیید) روی هم باز می‌شوند، فقط لایهٔ رویی
 * باید با Escape بسته شود؛ وگرنه هر دو با هم بسته می‌شوند و لایه‌ها روی هم
 * انباشته می‌مانند.
 */
export interface EscapeLayer {
  onEscape: () => void
}

const stack: EscapeLayer[] = []
let listening = false

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  const top = stack[stack.length - 1]
  if (!top) return
  event.preventDefault()
  event.stopPropagation()
  top.onEscape()
}

/** لایه را روی پشته می‌گذارد و تابع برداشتن آن را برمی‌گرداند */
export function pushEscapeLayer(layer: EscapeLayer): () => void {
  stack.push(layer)
  if (!listening) {
    document.addEventListener('keydown', handleKeyDown, true)
    listening = true
  }

  return () => {
    const index = stack.indexOf(layer)
    if (index >= 0) stack.splice(index, 1)
    if (stack.length === 0 && listening) {
      document.removeEventListener('keydown', handleKeyDown, true)
      listening = false
    }
  }
}
