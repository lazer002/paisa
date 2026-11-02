import { Plus, X } from 'lucide-react'

/** One editable rubric row (points kept as typed text). */
export interface RubricRow {
  criterion: string
  maxPoints: string
  description: string
}

const cls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black'

/** Criteria the assignment is graded on; the assignment is then out of their total. */
export default function RubricEditor({ rows, onChange }: { rows: RubricRow[]; onChange: (rows: RubricRow[]) => void }) {
  const set = (index: number, patch: Partial<RubricRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const total = rows.reduce((sum, r) => sum + (Number(r.maxPoints) || 0), 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Grading rubric (optional)</label>
        {rows.length > 0 && <span className="text-xs text-gray-500">Total {total} points</span>}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_5.5rem_auto] gap-2">
          <div className="space-y-1">
            <input
              className={cls}
              placeholder="Criterion, e.g. Accuracy"
              value={row.criterion}
              onChange={(e) => set(i, { criterion: e.target.value })}
            />
            <input
              className={`${cls} text-xs`}
              placeholder="What earns full marks (optional)"
              value={row.description}
              onChange={(e) => set(i, { description: e.target.value })}
            />
          </div>
          <input
            className={cls}
            type="number"
            min={0}
            step="any"
            placeholder="Points"
            aria-label="Points"
            value={row.maxPoints}
            onChange={(e) => set(i, { maxPoints: e.target.value })}
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="self-start rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Remove criterion"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { criterion: '', maxPoints: '', description: '' }])}
        className="inline-flex items-center gap-1 text-sm text-gray-600 underline hover:text-black"
      >
        <Plus size={13} /> Add criterion
      </button>
    </div>
  )
}
