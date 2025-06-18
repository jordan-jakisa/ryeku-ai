"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface ReportContextValue {
  headings: Heading[];
  setHeadings: (h: Heading[]) => void;
  activeHeadingId: string | null;
  setActiveHeadingId: (id: string | null) => void;
  scrollToHeading: (id: string) => void;
  contentRef: React.RefObject<HTMLDivElement>;
  activeCitationId: string | null;
  setActiveCitationId: (id: string | null) => void;
}

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToHeading = useCallback((id: string) => {
    const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <ReportContext.Provider
      value={{
        headings,
        setHeadings,
        activeHeadingId,
        setActiveHeadingId,
        scrollToHeading,
        contentRef,
        activeCitationId,
        setActiveCitationId,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReportContext = () => {
  const ctx = useContext(ReportContext);
  if (!ctx)
    throw new Error("useReportContext must be used within ReportProvider");
  return ctx;
};
