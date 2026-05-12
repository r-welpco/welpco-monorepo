/**
 * Field — labeled form input or textarea.
 *
 * Faithful port of `.design-reference/project/components/pages.jsx` `Field`.
 */

interface FieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  name?: string;
  required?: boolean;
  autoComplete?: string;
}

export function Field({
  label,
  placeholder,
  type = "text",
  textarea,
  name,
  required,
  autoComplete,
}: FieldProps) {
  const sharedStyle = {
    padding: "14px 16px",
    background: "var(--bg-soft)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    fontFamily: "var(--font-body)",
    fontSize: 15,
    color: "var(--fg)",
    outline: "none",
    resize: textarea ? ("vertical" as const) : ("none" as const),
    width: "100%",
  };
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span className="eyebrow">
        {label}
        {required ? (
          <span aria-hidden="true" style={{ color: "var(--wine)", marginLeft: 4 }}>
            *
          </span>
        ) : null}
      </span>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={5}
          required={required}
          aria-required={required ? "true" : undefined}
          autoComplete={autoComplete}
          style={sharedStyle}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          aria-required={required ? "true" : undefined}
          autoComplete={autoComplete}
          style={sharedStyle}
        />
      )}
    </label>
  );
}
