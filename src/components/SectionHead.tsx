interface Props {
  mark: string; // the CJK character that labels the section
  title: string;
  sub?: string;
}

/** Section header that frames the language's own character in a 田字格 grid. */
export function SectionHead({ mark, title, sub }: Props) {
  return (
    <div className="sec-head">
      <div className="tian sec-tian"><span className="ch">{mark}</span></div>
      <div>
        <h2 className="sec-h2">{title}</h2>
        {sub && <div className="sec-sub">{sub}</div>}
      </div>
    </div>
  );
}
