# CrudSheet — App Sheet Convention

All user-facing side-panel sheets in this project **must** use the `CrudSheet*` component system from `@/components/ui/crud-sheet`. Never use raw `SheetContent` / `SheetHeader` / `SheetTitle` directly in feature sheets.

---

## Why

- Consistent padding, max-width, blur, and border across all sheets
- Unified header with ping indicator, pin button, and close button
- Proper flex layout: header (fixed) → scrollable body → sticky actions footer
- Pin button lets users keep the sheet open without it closing on backdrop click

---

## Component Map

```
@/components/ui/crud-sheet
├── CrudSheetContent   — replaces <SheetContent>
├── CrudSheetHeader    — replaces <SheetHeader> + <SheetTitle>
├── CrudSheetBody      — scrollable content area
├── CrudSheetSection   — card-style section inside body
└── CrudSheetActions   — sticky footer with action buttons
```

---

## Template

```tsx
import {
  CrudSheetActions,
  CrudSheetBody,
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'

export function MyThingSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent pinnable>                     {/* pinnable = show pin button */}
        <CrudSheetHeader
          title="Sheet Title"
          description="Optional subtitle"            {/* shown on sm+ screens, truncated */}
          onClose={() => onOpenChange(false)}
          showPing                                    {/* show network latency indicator */}
        />

        <form id="my-form" onSubmit={...}>
          <CrudSheetBody>
            <CrudSheetSection>
              {/* form fields here */}
            </CrudSheetSection>
          </CrudSheetBody>
        </form>

        <CrudSheetActions>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button form="my-form" type="submit" disabled={isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </CrudSheetActions>
      </CrudSheetContent>
    </Sheet>
  )
}
```

---

## Props Reference

### `<CrudSheetContent>`

| Prop        | Type      | Default | Description                                                                         |
| ----------- | --------- | ------- | ----------------------------------------------------------------------------------- |
| `pinnable`  | `boolean` | `false` | Show the pin button. When pinned, backdrop click and Escape do not close the sheet. |
| `className` | `string`  | —       | Extra classes forwarded to the underlying `SheetContent`.                           |

### `<CrudSheetHeader>`

| Prop          | Type         | Default  | Description                                                       |
| ------------- | ------------ | -------- | ----------------------------------------------------------------- |
| `title`       | `ReactNode`  | required | Sheet title.                                                      |
| `description` | `ReactNode`  | —        | Muted subtitle (truncated on small screens).                      |
| `onClose`     | `() => void` | required | Called when × is clicked.                                         |
| `actionsSlot` | `ReactNode`  | —        | Extra icon buttons placed before the pin/close buttons.           |
| `showPing`    | `boolean`    | `true`   | Show the green/red latency chip. Set to `false` for simple forms. |

---

## Rules

1. **Never** wrap a `<form>` around the entire `CrudSheetContent`. The form must live only around `CrudSheetBody` so that `CrudSheetActions` stays outside the form — then reference `form={id}` on the submit button.
2. Use `showPing={false}` for simple single-entity forms (add/edit transaction, quick create). Keep `showPing` (default true) for complex sheets that users spend more time in.
3. `CrudSheetActions` always renders **two** buttons: secondary action (left) + primary action (right). The grid is `grid-cols-2`.
4. Group related fields inside `CrudSheetSection` cards. Multiple sections can exist inside one `CrudSheetBody`.
5. Do **not** add `p-*` or `mt-*` inside `CrudSheetBody` — spacing is already handled by the component.
6. Navigation sidebars (`AppSidebar`, `Topbar` mobile menu) correctly use raw `SheetContent` and are **exempt** from this rule.

---

## Pin Behaviour

When `pinnable` is set on `CrudSheetContent`:

- A `Pin` icon button appears in the header (between `actionsSlot` and the × button).
- Click it to **pin**: backdrop clicks and Escape no longer close the sheet. The pin button turns blue with a filled icon.
- Click again to **unpin**: normal dismiss behaviour resumes.
- Pin state is local to the component instance and resets when the sheet is closed.

---

## File Locations

| File                               | Purpose                                      |
| ---------------------------------- | -------------------------------------------- |
| `src/components/ui/crud-sheet.tsx` | Component implementation                     |
| `src/components/ui/sheet.tsx`      | Radix Dialog-based primitive (do not modify) |
