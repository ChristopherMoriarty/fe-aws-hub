const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function formatMinutes(seconds: number) {
  return Math.max(1, Math.round(seconds / 60))
}

export function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function optionLetter(index: number) {
  return letters[index] ?? String(index + 1)
}

export function optionText(body: string, index: number) {
  const letter = optionLetter(index)
  return body.replace(new RegExp(`^${letter}[.)]\\s+`), '')
}
