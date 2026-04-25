import { z } from 'zod'
import type { LotteryResult } from './types'

const sixDigits = z.string().regex(/^\d{6}$/, 'must be 6 digits')
const threeDigits = z.string().regex(/^\d{3}$/, 'must be 3 digits')
const twoDigits = z.string().regex(/^\d{2}$/, 'must be 2 digits')

export const lotteryResultSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
  drawDateThai: z.string().min(1),
  first: sixDigits,
  second: z.array(sixDigits).length(5),
  third: z.array(sixDigits).length(10),
  fourth: z.array(sixDigits).length(50),
  fifth: z.array(sixDigits).length(100),
  front3: z.array(threeDigits).length(2),
  back3: z.array(threeDigits).length(2),
  back2: z.array(twoDigits).length(1),
})

export type LotteryResultSchema = z.infer<typeof lotteryResultSchema>

const _typeCheck: LotteryResultSchema extends LotteryResult ? true : never = true
void _typeCheck

export function parseLotteryResult(raw: unknown): LotteryResult | null {
  const result = lotteryResultSchema.safeParse(raw)
  if (!result.success) {
    console.error('[lottery-schema] validation failed:', result.error.flatten())
    return null
  }
  return result.data
}
