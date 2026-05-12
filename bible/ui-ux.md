# UI/UX Bible - Welpco Design System

> **Foundation**: Radix UI Themes 3.2.1
> **Principle**: Use Radix props exclusively. No custom CSS.
> **Goal**: Consistent, accessible, developer-friendly design system.

## Platform context

- **Audience**: Customers (book local services) and Welpers (offer services). Interfaces must feel trustworthy, clear, and helpful.
- **Tone**: Warm and professional. Copy should be concise and action-oriented (e.g. "Get started", "Save profile", "Complete").
- **Differentiation**: Forms and flows should feel intentional and tailored to onboarding, profile, and account management. Use Welpco-specific labels and descriptions.

---

## 1. Spacing Rules

### Radix UI Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `gap="1"` | 4px | Tight spacing (icon + text) |
| `gap="2"` | 8px | Compact groups (checkbox + label) |
| `gap="3"` | 12px | Related items (form fields in row) |
| `gap="4"` | 16px | Standard spacing (form sections) |
| `gap="5"` | 20px | **Form vertical rhythm** (Label -> Input -> Error) |
| `gap="6"` | 24px | Section spacing (card sections) |
| `gap="7"` | 32px | Major sections (form groups) |
| `gap="8"` | 40px | Page-level spacing |
| `gap="9"` | 48px | Large page sections |

### Form Vertical Rhythm (CRITICAL)

**Standard Form Field Structure:**
Each form field MUST be wrapped in a `Box` component to separate elements and provide consistent spacing.

```
[Box mb="3"]     <- Wraps entire field (12px margin-bottom)
  [Label]        <- mb="1" (4px) - spacing below label
  [Input/Field]  <- size="2" (default)
  [Error Text]   <- mt="2" (8px) - only when error exists
  [Helper Text]  <- mt="1" (4px) - optional, below error
[/Box]
```

**Form Container Spacing:**
- Each field: `Box mb="3"` (12px margin-bottom between fields)
- Label to input: `mb="1"` (4px spacing)
- Card content: `gap="5"` (20px between major sections)
- Button spacing: `mt="3"` (12px above submit button)

**Example:**
```tsx
<form>
  <Box mb="3">
    <Text as="label" size="2" weight="bold" htmlFor="email" mb="1">
      Email
    </Text>
    <TextField.Root id="email" size="2" />
    {error && (
      <Text size="1" color="red" mt="2">
        {error.message}
      </Text>
    )}
  </Box>

  <Box mb="3">
    <Text as="label" size="2" weight="bold" htmlFor="password" mb="1">
      Password
    </Text>
    <TextField.Root id="password" type="password" size="2" />
  </Box>

  <Button type="submit" mt="3">Submit</Button>
</form>
```

**Why Box Wrapper?**
- Separates form elements visually and structurally
- Provides consistent spacing between fields
- Makes form structure clearer and easier to maintain
- Do NOT use gap on the form element - spacing comes from Box margins

### Layout Spacing

- **Cards**: `size="4"` (padding), `gap="5"` (internal spacing)
- **Modals/Dialogs**: `gap="5"` (content sections)
- **Sections**: `gap="6"` (between major content blocks)
- **Page containers**: `gap="7"` (between top-level sections)

---

## 2. Typography Rules

### Heading Hierarchy

| Component | Size | Use Case | Weight | Spacing |
|-----------|------|----------|--------|---------|
| `Heading size="9"` | 36px | Page titles | Bold | `mb="4"` |
| `Heading size="8"` | 32px | Section titles | Bold | `mb="4"` |
| `Heading size="7"` | 28px | **Card/Form titles** | Bold | `mb="2"` |
| `Heading size="6"` | 24px | Subsection titles | Bold | `mb="3"` |
| `Heading size="5"` | 20px | Small section titles | Medium | `mb="2"` |
| `Heading size="4"` | 18px | Default heading | Medium | `mb="2"` |

**Card/Form Title Pattern:**
```tsx
<Box>
  <Heading size="7" trim="start" mb="2">
    Welcome back
  </Heading>
  <Text size="2" color="gray">
    Sign in to continue.
  </Text>
</Box>
```

### Labels

- **Form Labels**: `Text as="label" size="2" weight="bold"`
- **Required Indicator**: `Text as="span" color="red" ml="1">*</Text>`
- **Label Spacing**: `mb="1"` (4px below label, above input).

```tsx
<Text as="label" size="2" weight="bold" htmlFor="email" mb="1">
  Email
  {required && <Text as="span" color="red" ml="1">*</Text>}
</Text>
```

### Body Text

| Size | Use Case | Color |
|------|----------|-------|
| `size="1"` | **Error messages**, helper text, captions | `color="red"` (errors), `color="gray"` (helpers) |
| `size="2"` | **Default body**, descriptions, labels | `color="gray"` (subtle), default (primary) |
| `size="3"` | Emphasized body text | default |
| `size="4"` | Large body text | default |

**Error Text Pattern:**
```tsx
{error && (
  <Text size="1" color="red" mt="2">
    {error.message}
  </Text>
)}
```

**Helper Text Pattern:**
```tsx
<Text size="1" color="gray" mt="2">
  We'll send a verification email to confirm your new address.
</Text>
```

### Contrast & WCAG Compliance

- **Text on surface**: Default Radix colors meet WCAG AA
- **Error text**: `color="red"` (Radix red meets contrast)
- **Helper text**: `color="gray"` (Radix gray meets contrast)
- **Links**: Use `Link` component (meets contrast requirements)

---

## 3. Colors & State Mapping

### Semantic Color Usage

| Color | Use Case | Variant |
|-------|----------|---------|
| `color="blue"` | Primary actions, links | `variant="solid"` (buttons) |
| `color="green"` | **Success actions** (submit, confirm) | `variant="solid"` |
| `color="red"` | **Errors**, destructive actions | `variant="solid"` (buttons), `variant="surface"` (callouts) |
| `color="amber"` | Warnings | `variant="surface"` (callouts) |
| `color="gray"` | Subtle text, disabled states | Default for helper text |

### Button Colors

- **Primary Submit**: `color="green"` (forms, confirmations)
- **Secondary**: `color="blue"` (default actions)
- **Destructive**: `color="red"` (delete, remove)
- **Neutral**: `color="gray"` (cancel, skip)

### State Indicators

| State | Component | Props |
|-------|-----------|-------|
| Error | `Callout.Root` | `color="red" variant="surface"` |
| Success | `Callout.Root` | `color="green" variant="surface"` |
| Warning | `Callout.Root` | `color="amber" variant="surface"` |
| Info | `Callout.Root` | `color="blue" variant="surface"` |
| Disabled | Input/Button | `disabled={true}` |

### Form Field States

- **Default**: No additional props
- **Error**: Show error text below field (`Text size="1" color="red" mt="2"`)
- **Disabled**: `disabled={loading}` (use loading prop pattern)
- **Focus**: Handled by Radix (automatic focus ring)

---

## 4. Sizing & Components

### Input Sizes

- **Default**: `size="2"` (all form inputs)
- **Large**: `size="3"` (search bars, prominent inputs)
- **Small**: `size="1"` (compact forms, tables)

**Rule**: Always use `size="2"` unless explicitly designing for compact/large contexts.

### Button Sizes

- **Default**: `size="2"` (forms, standard actions)
- **Large**: `size="3"` (primary CTAs, hero sections)
- **Small**: `size="1"` (toolbars, compact spaces)

**Minimum Touch Target**: Radix buttons meet 44px minimum (size="2" = 32px height + padding).

### Container Max Widths

Use inline styles for max-width (Radix doesn't provide this prop):

- **Forms**: `style={{ maxWidth: "480px" }}` (login, registration)
- **Wide Forms**: `style={{ maxWidth: "560px" }}` (multi-field forms)
- **Full Width**: `style={{ maxWidth: "100%" }}` (settings pages)

### Card Sizing

- **Padding**: `size="4"` (standard card padding)
- **Variant**: `variant="surface"` (default for forms)

---

## 5. Forms Best Practices

### Label Placement & Alignment

**Standard Pattern:**
Each field MUST be wrapped in a Box with `mb="3"`. Label uses `mb="1"`.

```tsx
<Box mb="3">
  <Text as="label" size="2" weight="bold" htmlFor="field-id" mb="1">
    Field Label
    {required && <Text as="span" color="red" ml="1">*</Text>}
  </Text>
  <TextField.Root
    id="field-id"
    size="2"
    placeholder="Placeholder text"
    {...form.register("fieldName")}
  />
  {form.formState.errors.fieldName && (
    <Text size="1" color="red" mt="2">
      {form.formState.errors.fieldName.message}
    </Text>
  )}
</Box>
```

### Required Field Indication

- **Always show asterisk**: `<Text as="span" color="red" ml="1">*</Text>`
- **Place after label text**: `ml="1"` (4px spacing)
- **Use `required` prop** on input for HTML5 validation

### Error Display Rules

1. **Position**: Always below input, `mt="2"` (8px spacing)
2. **Style**: `Text size="1" color="red"`
3. **Source**: Use `form.formState.errors.fieldName?.message`
4. **Conditional**: Only render when error exists

### Placeholder vs Helper Text

- **Placeholder**: Use for example values (`placeholder="you@example.com"`)
- **Helper Text**: Use `Text size="1" color="gray" mt="2"` for instructions
- **Never rely on placeholder alone** for critical information

### Form Structure

**Standard Form Layout:**
Each field is wrapped in `Box mb="3"`. Form does NOT use gap prop - spacing comes from Box margins.

```tsx
<Card size="4" variant="surface" style={{ width: "100%", maxWidth: "480px" }}>
  <Flex direction="column" gap="5">
    {/* Header */}
    <Box>
      <Heading size="7" trim="start" mb="2">
        Form Title
      </Heading>
      <Text size="2" color="gray">
        Form description.
      </Text>
    </Box>

    {/* Error Callout */}
    {error && (
      <Callout.Root color="red" variant="surface">
        <Callout.Text>{error}</Callout.Text>
      </Callout.Root>
    )}

    {/* Form Fields */}
    <form onSubmit={handleSubmit}>
      <Box mb="3">
        <Text as="label" size="2" weight="bold" htmlFor="field-1" mb="1">
          Field Label
        </Text>
        <TextField.Root id="field-1" size="2" {...form.register("field1")} />
        {form.formState.errors.field1 && (
          <Text size="1" color="red" mt="2">
            {form.formState.errors.field1.message}
          </Text>
        )}
      </Box>

      <Box mb="3">
        <Text as="label" size="2" weight="bold" htmlFor="field-2" mb="1">
          Another Field
        </Text>
        <TextField.Root id="field-2" size="2" {...form.register("field2")} />
      </Box>

      <Button type="submit" size="2" color="green" disabled={loading} mt="3">
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  </Flex>
</Card>
```

---

## 6. Accessibility Requirements

### Keyboard Navigation

- **All interactive elements**: Focusable by default (Radix handles this)
- **Focus rings**: Automatic via Radix (meets WCAG)
- **Tab order**: Logical (follow DOM order)

### ARIA Usage

**Error Messages:**
```tsx
<TextField.Root
  id="email"
  aria-invalid={!!form.formState.errors.email}
  aria-describedby={form.formState.errors.email ? "email-error" : undefined}
  {...form.register("email")}
/>
{form.formState.errors.email && (
  <Text id="email-error" size="1" color="red" mt="2">
    {form.formState.errors.email.message}
  </Text>
)}
```

**Labels:**
- Always use `htmlFor` on label matching input `id`
- Use `Text as="label"` or `Label` component

**Required Fields:**
- Use `required` prop on input
- Show visual indicator (`*`)
- Screen readers will announce "required"

### Screen Reader Support

- **Form errors**: Use `aria-describedby` linking to error text
- **Loading states**: Use `aria-busy="true"` on form during submission
- **Button loading**: Change text to indicate state ("Submitting..." vs "Submit")

---

## 7. Component-Specific Rules

### Buttons

- **Submit buttons**: `color="green"` (success actions)
- **Loading state**: Change text, keep `disabled={loading}`
- **Spacing**: `mt="3"` (12px above button in forms)

```tsx
<Button type="submit" size="2" color="green" disabled={loading} mt="3">
  {loading ? "Submitting..." : "Submit"}
</Button>
```

### Checkboxes & Switches

- **Label alignment**: `Flex align="center" gap="3"`
- **Size**: `size="2"` (default)

```tsx
<Flex align="center" gap="3">
  <Checkbox id="remember" size="2" />
  <Text as="label" size="2" htmlFor="remember">
    Remember me
  </Text>
</Flex>
```

### Select/Dropdown

- **Label**: Same pattern as text inputs
- **Size**: `size="2"` (default)
- **Error handling**: Same as text inputs

### Callouts (Alerts)

- **Error**: `color="red" variant="surface"`
- **Success**: `color="green" variant="surface"`
- **Position**: Top of form, after header, before fields

---

## 8. Quick Reference Checklist

### Every Form Field Must Have:
- [ ] Wrapped in `Box mb="3"` (separates fields, provides 12px spacing)
- [ ] Label with `htmlFor` matching input `id`
- [ ] Label: `size="2" weight="bold" mb="1"` (4px spacing)
- [ ] Input: `size="2"` (default)
- [ ] Error text: `size="1" color="red" mt="2"` (conditional)
- [ ] Required indicator: `*` with `color="red" ml="1"` (if required)

### Every Form Must Have:
- [ ] Card wrapper: `size="4" variant="surface"`
- [ ] Container: `Flex direction="column" gap="5"`
- [ ] Header: `Heading size="7" mb="2"` + `Text size="2" color="gray"`
- [ ] Error callout: `Callout.Root color="red"` (conditional)
- [ ] Form: No gap prop - spacing from `Box mb="3"` on each field
- [ ] Submit button: `color="green" size="2" mt="3"`

### Spacing Consistency:
- [ ] Form fields: `Box mb="3"` (12px between fields)
- [ ] Label to input: `mb="1"` (4px)
- [ ] Input to error: `mt="2"` (8px)
- [ ] Button spacing: `mt="3"` (12px)

---

## 9. Enforcement Strategy

### Code Review Checklist

Before merging, verify:
1. All spacing uses Radix tokens (no arbitrary values)
2. Form fields follow vertical rhythm pattern
3. Error messages use `size="1" color="red" mt="2"`
4. Labels use `size="2" weight="bold" mb="1"`
5. Submit buttons use `color="green"`
6. Required fields show `*` indicator
7. No inline CSS except `maxWidth` and form `gap`

---

## 10. Mobile-first & Responsive

All flows must work well on small screens. Stay within Radix props where possible; use minimal inline styles only when needed for layout.

### Layout

- **Cards/containers**: Use `style={{ width: "100%", maxWidth: "...px" }}` so content doesn't overflow on narrow viewports.
- **Form rows**: Use Radix responsive `direction` so fields stack on small screens:
  ```tsx
  <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
    <Box style={{ flex: 1 }}>...</Box>
    <Box style={{ flex: 1 }}>...</Box>
  </Flex>
  ```
- **Button groups**: On mobile, stack vertically and give full width:
  ```tsx
  <Flex gap="3" mt="3" direction={{ initial: "column", sm: "row" }}>
    <Button style={{ width: "100%", flex: 1 }}>...</Button>
  </Flex>
  ```

### Touch targets

- **Buttons**: Use `size="2"` or `size="3"` for primary actions (height >= 44px with padding).
- **Links and icon buttons**: Use `IconButton` or padded `Button` rather than bare icons.

### Allowed style exceptions for mobile

- `width: "100%"`, `maxWidth`, `minWidth: 0` on containers.
- `flex: 1` for equal-width columns in responsive Flex.
- `direction={{ initial: "column", sm: "row" }}` for stacking vs row.
- Progress bars and similar UI that need dimensions/transitions where Radix has no prop.

---

## 11. Design Alignment

Within this package we stay **Radix-only** for implementation, but we support the design vision by:

### Intentional hierarchy
- **Card/Form title**: `Heading size="7" trim="start" mb="2"` - the one thing the user reads first.
- **Subsection**: `Heading size="5"` or `size="6"` for clear sectioning.
- **Description**: Always pair titles with `Text size="2" color="gray"`.

### Cohesive color
- **Primary / success**: `color="green"` for submit, confirm, and positive states.
- **Errors / destructive**: `color="red"` for errors, delete, and warnings.
- **Neutral / secondary**: `color="gray"` for cancel, skip, helper text.
- **Info / links**: `color="blue"` for secondary actions and info callouts.

### Restraint
- **No custom fonts, gradients, or one-off colors** in the UI package; those belong in the app theme.
- **Allowed style exceptions**: `width`, `maxWidth`, `minWidth: 0`, `flex: 1` for layout; progress/transition where Radix has no prop.

---

**Single source of truth. Do not duplicate this file.**

**Last Updated**: 2026-03
**Version**: 2.0.0
**Maintained By**: Design System Team
