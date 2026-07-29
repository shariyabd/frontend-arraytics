import type { PaginationMeta } from '../../api/types'
import { Button } from './Button'
import { IconChevronLeft, IconChevronRight } from '../Icon'

const PER_PAGE_OPTIONS = [15, 25, 50, 100]

interface Props {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  busy?: boolean
}

export function Pagination({
  meta,
  onPageChange,
  onPerPageChange,
  busy,
}: Props) {
  const { current_page, per_page, total, last_page } = meta
  const from = total === 0 ? 0 : (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)

  return (
    <div className="pagination">
      <div className="pagination__info">
        Showing <b>{from}</b>–<b>{to}</b> of <b>{total}</b>{' '}
        {total === 1 ? 'contact' : 'contacts'}
      </div>

      <div className="pagination__nav">
        <label className="per-page">
          Per page
          <select
            className="select"
            value={per_page}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            disabled={busy}
            aria-label="Results per page"
          >

            {(PER_PAGE_OPTIONS.includes(per_page)
              ? PER_PAGE_OPTIONS
              : [per_page, ...PER_PAGE_OPTIONS]
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <Button
          size="icon"
          onClick={() => onPageChange(current_page - 1)}
          disabled={busy || current_page <= 1}
          aria-label="Previous page"
        >
          <IconChevronLeft size={16} />
        </Button>
        <span className="pagination__pages" aria-live="polite">
          Page <b>{current_page}</b> of {last_page || 1}
        </span>
        <Button
          size="icon"
          onClick={() => onPageChange(current_page + 1)}
          disabled={busy || current_page >= last_page}
          aria-label="Next page"
        >
          <IconChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
