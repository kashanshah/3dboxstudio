type AdminPageHeaderProps = {
  title: string;
  description: string;
  count?: number;
  itemName: string;
  itemNamePlural?: string;
  filtered?: boolean;
};

function countLabel(count: number, singular: string, plural: string, filtered: boolean): string {
  const noun = count === 1 ? singular : plural;
  return filtered ? `matching ${noun}` : noun;
}

export default function AdminPageHeader({
  title,
  description,
  count,
  itemName,
  itemNamePlural,
  filtered = false,
}: AdminPageHeaderProps) {
  const plural = itemNamePlural ?? `${itemName}s`;

  return (
    <header className="admin-page-header">
      <div className="admin-page-header-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {count != null ? (
        <p className="admin-page-count">
          <span className="admin-page-count-value">{count.toLocaleString()}</span>
          <span className="admin-page-count-label">{countLabel(count, itemName, plural, filtered)}</span>
        </p>
      ) : null}
    </header>
  );
}
