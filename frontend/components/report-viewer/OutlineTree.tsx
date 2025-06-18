"use client";

import { useReportContext } from "./ReportContext";
import clsx from "clsx";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

// ensure list takes available height
const ITEM_HEIGHT = 28;

export default function OutlineTree() {
  const { headings, activeHeadingId, scrollToHeading } = useReportContext();

  if (headings.length === 0) {
    return <p className="text-sm text-center opacity-60">No headings</p>;
  }

  const Row = ({ index, style }: ListChildComponentProps) => {
    const h = headings[index];
    return (
      <div
        style={style}
        onClick={() => scrollToHeading(h.id)}
        className={clsx(
          "cursor-pointer truncate leading-7 px-1",
          activeHeadingId === h.id
            ? "text-white font-semibold"
            : "text-white/70 hover:text-white"
        )}
      >
        <span style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>{h.text}</span>
      </div>
    );
  };

  return (
    <List
      height={Math.min(ITEM_HEIGHT * headings.length, 400)}
      itemCount={headings.length}
      itemSize={ITEM_HEIGHT}
      width="100%"
    >
      {Row}
    </List>
  );
}
