import { useEffect, useState, type ReactNode } from 'react'
import { CalendarClock, Filter, Plus, PlayCircle, Trash2, Zap } from 'lucide-react'
import type { Automation, AutomationAction, AutomationCondition } from '@/api/types'
import { automationActionLabels, automationTriggerLabels, conditionFieldLabels, conditionOperatorLabels, scheduleLabels } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Button, IconButton } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'

type BuilderPayload = Omit<Automation, 'id' | 'last_run_at' | 'next_run_at' | 'last_result' | 'runs_count'>

const triggers = Object.keys(automationTriggerLabels)
const actionsList = Object.keys(automationActionLabels)
const fields = Object.keys(conditionFieldLabels)
const operators = Object.keys(conditionOperatorLabels)

function Section({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon: typeof Zap
  title: string
  description: string
  children: ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/80">
      <div className="flex items-start justify-between gap-2 border-b border-border/70 bg-muted/25 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[11.5px] font-semibold text-foreground">{title}</p>
            <p className="text-[10px] text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </div>
  )
}

export function RuleBuilderModal({
  open,
  onClose,
  automation,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  automation?: Automation | null
  onSubmit: (payload: BuilderPayload) => void
  loading?: boolean
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState('stock_changed')
  const [schedule, setSchedule] = useState('event')
  const [enabled, setEnabled] = useState(true)
  const [conditions, setConditions] = useState<AutomationCondition[]>([])
  const [actions, setActions] = useState<AutomationAction[]>([{ type: 'send_notification', params: {} }])

  useEffect(() => {
    if (!open) return
    setName(automation?.name ?? '')
    setDescription(automation?.description ?? '')
    setTrigger(automation?.trigger ?? 'stock_changed')
    setSchedule(automation?.schedule ?? 'event')
    setEnabled(automation?.enabled ?? true)
    setConditions(automation?.conditions ?? [])
    setActions(automation?.actions?.length ? automation.actions : [{ type: 'send_notification', params: {} }])
  }, [open, automation])

  useEffect(() => {
    if (trigger !== 'schedule' && schedule !== 'event') setSchedule('event')
    if (trigger === 'schedule' && schedule === 'event') setSchedule('daily_02')
  }, [trigger, schedule])

  const submit = () => {
    if (!name.trim()) {
      toast({ title: 'نام قانون الزامی است', variant: 'warning' })
      return
    }
    if (actions.length === 0) {
      toast({ title: 'حداقل یک اقدام لازم است', variant: 'warning' })
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      trigger,
      conditions: conditions.filter((condition) => condition.field && condition.operator),
      actions,
      schedule,
      enabled,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={automation ? 'ویرایش قانون اتوماسیون' : 'ساخت قانون جدید'}
      description="Trigger، شرایط و اقدام‌ها را تعریف کنید؛ فقط گزینه‌های پشتیبانی‌شده توسط بک‌اند قابل انتخاب هستند."
      size="lg"
      footer={
        <>
          <span className="me-auto text-[10.5px] text-muted-foreground">
            {actions.length} اقدام • {conditions.length} شرط
          </span>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" onClick={submit} loading={loading}>
            {automation ? 'ذخیره تغییرات' : 'ایجاد قانون'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام قانون" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً همگام‌سازی موجودی صفر" />
          </Field>
          <Field label="وضعیت">
            <div className="flex h-9 items-center justify-between rounded-lg border border-border px-3">
              <span className="text-[11.5px] text-muted-foreground">{enabled ? 'فعال' : 'غیرفعال'}</span>
              <Switch checked={enabled} onChange={setEnabled} label="وضعیت قانون" />
            </div>
          </Field>
        </div>
        <Field label="توضیح">
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="این قانون چه کاری انجام می‌دهد؟" />
        </Field>

        <Section icon={Zap} title="Trigger" description="رویدادی که اجرای قانون را شروع می‌کند">
          <Select value={trigger} onChange={(event) => setTrigger(event.target.value)}>
            {triggers.map((value) => (
              <option key={value} value={value}>
                {automationTriggerLabels[value]}
              </option>
            ))}
          </Select>
        </Section>

        <Section
          icon={Filter}
          title="شرایط"
          description="در صورت خالی بودن، قانون برای همهٔ موارد اجرا می‌شود"
          action={
            <Button
              variant="ghost"
              size="sm"
              startIcon={<Plus className="h-3 w-3" />}
              onClick={() => setConditions([...conditions, { field: 'stock', operator: 'lt', value: '' }])}
            >
              افزودن شرط
            </Button>
          }
        >
          {conditions.length === 0 && <p className="py-2 text-center text-[10.5px] text-muted-foreground">شرطی تعریف نشده است.</p>}
          {conditions.map((condition, index) => (
            <div key={index} className="flex flex-wrap items-center gap-1.5">
              <Select
                aria-label="فیلد شرط"
                value={condition.field}
                onChange={(event) => {
                  const next = [...conditions]
                  next[index] = { ...condition, field: event.target.value }
                  setConditions(next)
                }}
                className="h-8 w-auto min-w-[110px] text-[11px]"
              >
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {conditionFieldLabels[field]}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="عملگر"
                value={condition.operator}
                onChange={(event) => {
                  const next = [...conditions]
                  next[index] = { ...condition, operator: event.target.value }
                  setConditions(next)
                }}
                className="h-8 w-auto min-w-[120px] text-[11px]"
              >
                {operators.map((operator) => (
                  <option key={operator} value={operator}>
                    {conditionOperatorLabels[operator]}
                  </option>
                ))}
              </Select>
              <Input
                aria-label="مقدار شرط"
                value={condition.value}
                onChange={(event) => {
                  const next = [...conditions]
                  next[index] = { ...condition, value: event.target.value }
                  setConditions(next)
                }}
                placeholder="مقدار"
                className="h-8 w-24 text-[11px]"
              />
              <IconButton aria-label="حذف شرط" className="h-8 w-8" onClick={() => setConditions(conditions.filter((_, i) => i !== index))}>
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </IconButton>
            </div>
          ))}
        </Section>

        <Section
          icon={PlayCircle}
          title="اقدام‌ها"
          description="فقط اقدام‌های قابل اجرا در بک‌اند"
          action={
            <Button
              variant="ghost"
              size="sm"
              startIcon={<Plus className="h-3 w-3" />}
              onClick={() => setActions([...actions, { type: 'adjust_price', params: {} }])}
            >
              افزودن اقدام
            </Button>
          }
        >
          {actions.map((action, index) => (
            <div key={index} className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-2">
              <div className="flex items-center gap-1.5">
                <Select
                  aria-label="نوع اقدام"
                  value={action.type}
                  onChange={(event) => {
                    const next = [...actions]
                    next[index] = { type: event.target.value, params: {} }
                    setActions(next)
                  }}
                  className="h-8 flex-1 text-[11px]"
                >
                  {actionsList.map((type) => (
                    <option key={type} value={type}>
                      {automationActionLabels[type]}
                    </option>
                  ))}
                </Select>
                <IconButton
                  aria-label="حذف اقدام"
                  className="h-8 w-8"
                  onClick={() => setActions(actions.filter((_, i) => i !== index))}
                  disabled={actions.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </IconButton>
              </div>

              {(action.type === 'adjust_price' || action.type === 'set_stock') && (
                <div className="flex items-center gap-1.5">
                  {action.type === 'adjust_price' && (
                    <Select
                      aria-label="نوع تغییر قیمت"
                      value={action.params.mode ?? 'increase_percent'}
                      onChange={(event) => {
                        const next = [...actions]
                        next[index] = { ...action, params: { ...action.params, mode: event.target.value } }
                        setActions(next)
                      }}
                      className="h-8 w-auto text-[11px]"
                    >
                      <option value="increase_percent">افزایش درصدی</option>
                      <option value="decrease_percent">کاهش درصدی</option>
                      <option value="increase_amount">افزایش مبلغی</option>
                      <option value="decrease_amount">کاهش مبلغی</option>
                      <option value="set">مقدار ثابت</option>
                    </Select>
                  )}
                  <Input
                    aria-label="مقدار اقدام"
                    value={action.params.value ?? ''}
                    onChange={(event) => {
                      const next = [...actions]
                      next[index] = { ...action, params: { ...action.params, value: event.target.value } }
                      setActions(next)
                    }}
                    placeholder={action.type === 'adjust_price' ? 'مثلاً ۵' : 'مقدار موجودی'}
                    className="h-8 flex-1 text-[11px]"
                  />
                </div>
              )}

              {action.type === 'send_notification' && (
                <Input
                  aria-label="متن اعلان"
                  value={action.params.message ?? ''}
                  onChange={(event) => {
                    const next = [...actions]
                    next[index] = { ...action, params: { ...action.params, message: event.target.value } }
                    setActions(next)
                  }}
                  placeholder="متن اعلان"
                  className="h-8 text-[11px]"
                />
              )}

              {action.type === 'set_status' && (
                <Select
                  aria-label="وضعیت مقصد"
                  value={action.params.status ?? 'draft'}
                  onChange={(event) => {
                    const next = [...actions]
                    next[index] = { ...action, params: { ...action.params, status: event.target.value } }
                    setActions(next)
                  }}
                  className="h-8 text-[11px]"
                >
                  <option value="publish">منتشرشده</option>
                  <option value="draft">پیش‌نویس</option>
                  <option value="out_of_stock">ناموجود</option>
                </Select>
              )}
            </div>
          ))}
        </Section>

        <Section icon={CalendarClock} title="زمان‌بندی" description="برای Trigger زمان‌بندی‌شده، بازهٔ اجرا را انتخاب کنید">
          <Select value={schedule} onChange={(event) => setSchedule(event.target.value)} disabled={trigger !== 'schedule'}>
            {Object.entries(scheduleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {trigger !== 'schedule' && <p className="text-[10px] text-muted-foreground">این قانون بر اساس رویداد اجرا می‌شود، نه زمان‌بندی.</p>}
        </Section>

        <div className={cn('rounded-lg bg-info-soft/50 px-3 py-2 text-[10px] leading-5 text-muted-foreground')}>
          تغییرات پس از ذخیره از طریق API به افزونه ارسال می‌شوند. قوانین غیرفعال اجرا نمی‌شوند.
        </div>
      </div>
    </Modal>
  )
}
