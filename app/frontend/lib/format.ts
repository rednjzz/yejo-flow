export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount)
}

export function formatBillion(amount: number): string {
  const billion = amount / 100_000_000
  if (billion === Math.floor(billion)) {
    return `${Math.floor(billion)}억`
  }
  return `${billion.toFixed(1)}억`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}.${m}.${d}`
}
