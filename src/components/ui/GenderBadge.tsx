import type { Gender } from '../../api/types'

const cls: Record<Gender, string> = {
  Male: 'badge--male',
  Female: 'badge--female',
  Other: 'badge--other',
}

export function GenderBadge({ gender }: { gender: Gender }) {
  return <span className={`badge ${cls[gender]}`}>{gender}</span>
}
