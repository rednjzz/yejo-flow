import { useCallback, useState } from "react"

import { cn } from "@/lib/utils"

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  /** hidden input의 name (서버 전송용) */
  name: string
  /** 숫자 값 */
  value: number | string
  /** 값 변경 콜백 (raw 숫자 문자열 전달) */
  onValueChange: (raw: string) => void
  /** 원 단위 접미사 표시 여부 */
  suffix?: string
}

function formatWithCommas(value: string): string {
  const num = value.replace(/[^0-9-]/g, "")
  if (num === "" || num === "-") return num
  const isNegative = num.startsWith("-")
  const abs = isNegative ? num.slice(1) : num
  const formatted = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return isNegative ? `-${formatted}` : formatted
}

function CurrencyInput({
  name,
  value,
  onValueChange,
  suffix,
  className,
  ...props
}: CurrencyInputProps) {
  const rawStr = value?.toString() ?? ""
  const [displayValue, setDisplayValue] = useState(() =>
    formatWithCommas(rawStr),
  )

  // value prop이 외부에서 변경될 때 동기화
  const currentRaw = displayValue.replace(/[^0-9-]/g, "")
  if (currentRaw !== rawStr && rawStr !== "") {
    // 외부 변경 감지 시 재포맷 (setState는 렌더 중 호출 불가이므로 조건부)
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      const raw = input.replace(/[^0-9-]/g, "")
      setDisplayValue(formatWithCommas(raw))
      onValueChange(raw)
    },
    [onValueChange],
  )

  const handleBlur = useCallback(() => {
    setDisplayValue(formatWithCommas(rawStr))
  }, [rawStr])

  // 외부 value와 동기화
  const displayRaw = displayValue.replace(/[^0-9-]/g, "")
  const effectiveDisplay =
    displayRaw === rawStr ? displayValue : formatWithCommas(rawStr)

  return (
    <div className="relative">
      <input type="hidden" name={name} value={rawStr} />
      <input
        type="text"
        inputMode="numeric"
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base tabular-nums shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          suffix && "pr-8",
          className,
        )}
        value={effectiveDisplay}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
      {suffix && (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
          {suffix}
        </span>
      )}
    </div>
  )
}

export { CurrencyInput, formatWithCommas }
