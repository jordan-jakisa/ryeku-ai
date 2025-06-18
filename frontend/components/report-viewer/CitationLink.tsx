"use client";

import { useReportContext } from "./ReportContext";

interface CitationLinkProps {
  citationId: string;
  children: React.ReactNode;
}

export default function CitationLink({
  citationId,
  children,
}: CitationLinkProps) {
  const { setActiveCitationId } = useReportContext();

  return (
    <sup
      className="text-blue-400 cursor-pointer hover:underline"
      onClick={(e) => {
        e.preventDefault();
        setActiveCitationId(citationId);
      }}
    >
      {children}
    </sup>
  );
}
