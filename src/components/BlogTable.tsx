import type { BlogTable as BlogTableContent } from "@/content/blogTables";

type BlogTableProps = {
  table: BlogTableContent;
};

export default function BlogTable({ table }: BlogTableProps) {
  return (
    <section className="blog-post-table" aria-labelledby={`${table.id}-title`}>
      <h3 id={`${table.id}-title`} className="blog-post-h3">
        {table.title}
      </h3>
      {table.intro ? <p className="blog-post-p">{table.intro}</p> : null}
      <div
        className="table-scroll"
        role="region"
        aria-label={table.ariaLabel}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.id}-${rowIndex}`}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th key={cellIndex} scope="row">{cell}</th>
                  ) : (
                    <td key={cellIndex}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
