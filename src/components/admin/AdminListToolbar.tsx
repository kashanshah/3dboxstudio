"use client";

type FilterField = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

type HiddenField = {
  name: string;
  value: string;
};

type AdminListToolbarProps = {
  action: string;
  search?: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  filters?: FilterField[];
  hidden?: HiddenField[];
  clearHref?: string | null;
};

export default function AdminListToolbar({
  action,
  search,
  searchPlaceholder,
  searchAriaLabel,
  filters = [],
  hidden = [],
  clearHref,
}: AdminListToolbarProps) {
  return (
    <form className="admin-toolbar" method="get" action={action}>
      {hidden.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input
        type="search"
        name="search"
        placeholder={searchPlaceholder}
        defaultValue={search ?? ""}
        aria-label={searchAriaLabel}
      />
      {filters.map((filter) => (
        <label key={filter.name} className="admin-filter-select">
          <span className="visually-hidden">{filter.label}</span>
          <select
            name={filter.name}
            defaultValue={filter.value}
            aria-label={filter.label}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button className="admin-btn" type="submit">
        Search
      </button>
      {clearHref ? (
        <a className="admin-clear-link" href={clearHref}>
          Clear
        </a>
      ) : null}
    </form>
  );
}
