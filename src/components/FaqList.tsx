import type { FaqItem } from "../content/faq";
import { getCategoryLabel } from "../content/faq";

type FaqListProps = {
  items: FaqItem[];
  openFirst?: boolean;
  showCategory?: boolean;
};

export default function FaqList({
  items,
  openFirst = false,
  showCategory = false,
}: FaqListProps) {
  return (
    <div className="landing-faq">
      {items.map((item, index) => (
        <details key={item.id} open={openFirst && index === 0}>
          <summary>
            {showCategory ? (
              <span className="faq-item-heading">
                <span className="faq-item-category">
                  {getCategoryLabel(item.category)}
                </span>
                <span className="faq-item-question">{item.question}</span>
              </span>
            ) : (
              item.question
            )}
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
