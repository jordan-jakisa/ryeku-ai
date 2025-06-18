"use client";

import { useEffect } from "react";
import { useResearchStore } from "@/lib/store";
// @ts-ignore – generated file may lack types initially
import MarkdownRenderer from "./MarkdownRenderer";
import { useReportContext, Heading } from "./ReportContext";
import SourcePreviewModal from "./SourcePreviewModal";

export default function ContentPane() {
  // Pull the generated report (if any) from global store
  const { report } = useResearchStore();

  // Fallback placeholder while the real content is loading
  const placeholder = `# Report Content\n\n## Section 1\nLorem ipsum dolor sit amet.\n\n### Sub A\nConsectetur adipiscing elit.\n\n## Section 2\nSed do eiusmod tempor.\n`;

  const markdown = report?.content ?? placeholder;

  return <ContentInner markdown={markdown} />;
}

function ContentInner({ markdown }: { markdown: string }) {
  const { setHeadings, setActiveHeadingId, contentRef } = useReportContext();

  // Extract headings from markdown when it changes
  useEffect(() => {
    const regex = /^(#{1,6})\s+(.*)$/gm;
    const lines = markdown.split("\n");
    const headings: Heading[] = [];
    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
        headings.push({ id, text, level });
      }
    });
    setHeadings(headings);
  }, [markdown, setHeadings]);

  // Observe headings to update active state
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const headingEls = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6")
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { root: container, rootMargin: "0px 0px -80% 0px", threshold: 0 }
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [contentRef, setActiveHeadingId]);

  return (
    <div
      ref={contentRef}
      className="p-6 overflow-y-auto h-full prose prose-invert max-w-none"
    >
      <MarkdownRenderer markdown={markdown} />
      <SourcePreviewModal />
    </div>
  );
}
