/**
 * کپی متن در کلیپ‌بورد با یک روش جایگزین برای مرورگرهایی که Clipboard API
 * را در دسترس نمی‌گذارند. مقدار boolean برگشتی یعنی کپی واقعاً انجام شد.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* می‌رویم سراغ روش جایگزین */
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
