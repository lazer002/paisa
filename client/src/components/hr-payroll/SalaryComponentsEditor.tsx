import { Plus, Trash2 } from 'lucide-react'

import type { SalaryComponent } from '@/features/platform/platformApi'
import Button from '@/components/ui/button'
import { inputCls } from '@/components/ui/kit'

const FORMULA_HELP =
  'Formula variables: BASIC, GROSS, CTC, WORKING_DAYS, PAID_DAYS, LOP_DAYS, HOURS_PER_DAY and the code of any component above. ' +
  'Operators + - * / %, comparisons, cond ? a : b, and min, max, round, floor, ceil, abs. Example: min(BASIC * 0.12, 1800)'

interface Props {
  value: SalaryComponent[]
  onChange: (next: SalaryComponent[]) => void
}

/** Edits the common fields of a structure's components; other fields on a row are kept as they are. */
export default function SalaryComponentsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<SalaryComponent>) =>
    onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  const setCalc = (i: number, calculationType: string) =>
    update(i, {
      calculationType,
      percentageBase: calculationType === 'percentage' ? (value[i].percentageBase ?? 'basic') : value[i].percentageBase,
    })

  const add = () =>
    onChange([...value, { code: '', name: '', type: 'earning', category: 'other', calculationType: 'fixed', amount: 0, proratable: true }])

  return (
    <div className="space-y-2">
      {value.map((c, i) => {
        const calc = c.calculationType ?? 'fixed'
        return (
          <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-lg bg-gray-50 p-2">
            <input className={`${inputCls} col-span-2`} placeholder="CODE" value={c.code}
              onChange={(e) => update(i, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} />
            <input className={`${inputCls} col-span-3`} placeholder="Name" value={c.name}
              onChange={(e) => update(i, { name: e.target.value })} />
            <select className={`${inputCls} col-span-2`} value={c.type} onChange={(e) => update(i, { type: e.target.value })}>
              <option value="earning">earning</option>
              <option value="deduction">deduction</option>
            </select>
            <select className={`${inputCls} col-span-2`} value={calc} onChange={(e) => setCalc(i, e.target.value)}>
              <option value="fixed">fixed ₹</option>
              <option value="percentage">% of basic</option>
              <option value="formula">formula</option>
            </select>
            {calc === 'formula' ? (
              <input className={`${inputCls} col-span-2 font-mono text-xs`} placeholder="BASIC * 0.4" value={c.formula ?? ''}
                onChange={(e) => update(i, { formula: e.target.value })} />
            ) : calc === 'percentage' ? (
              <input type="number" className={`${inputCls} col-span-2`} placeholder="%" value={c.percentage ?? ''}
                onChange={(e) => update(i, { percentage: e.target.value === '' ? null : Number(e.target.value) })} />
            ) : (
              <input type="number" className={`${inputCls} col-span-2`} placeholder="₹" value={c.amount ?? ''}
                onChange={(e) => update(i, { amount: Number(e.target.value) || 0 })} />
            )}
            <button type="button" className="col-span-1 justify-self-center text-gray-400 hover:text-red-600"
              aria-label="Remove component" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Trash2 size={15} />
            </button>
            {c.type === 'earning' && (
              <label className="col-span-12 flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={c.proratable !== false} onChange={(e) => update(i, { proratable: e.target.checked })} />
                Prorated for loss of pay and mid-month joining/leaving
              </label>
            )}
          </div>
        )
      })}
      <Button variant="secondary" onClick={add}><Plus size={15} /> Component</Button>
      <p className="text-xs text-gray-500">{FORMULA_HELP}</p>
    </div>
  )
}
