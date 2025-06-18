"use client";

// Dynamically import `react-markdown` to keep the heavy markdown renderer in a separate client-only chunk.
// This shaves ~40-50 KB off the initial JS bundle for the Report Viewer pane.
// `ssr: false` ensures the component is only rendered on the client where it is needed.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dynamic from "next/dynamic";

// Dynamically import the markdown renderer and remark plugins.
// We wrap the promise to access the default export when it resolves.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – react-markdown may not have type declarations installed by default
const ReactMarkdown = dynamic(
  () =>
    import("react-markdown").then(
      (m) =>
        // Explicitly cast to any to avoid complex type incompatibilities between react-markdown and Next.js dynamic loader.
        m.default as unknown as React.ComponentType<any>
    ),
  {
    ssr: false,
    // A small fallback keeps layout stable during hydration.
    loading: () => (
      <div className="text-center text-white/60">Rendering markdown…</div>
    ),
  }
);

// remark plugins are light-weight, so we can keep them statically imported.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – missing types
import remarkGfm from "remark-gfm";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – missing types
import remarkSlug from "remark-slug";
import CitationLink from "./CitationLink";
import React from "react";

interface Props {
  markdown: string;
}

interface LinkProps {
  href?: string;
  children?: React.ReactNode;
}

function MarkdownRendererImpl({ markdown }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkSlug]}
      components={{
        // Ensure images in markdown are lazy-loaded to avoid jank on large reports.
        // This is a simple optimisation until we migrate to the Next.js `Image` component.
        img: ({ src, alt }: { src?: string; alt?: string }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src ?? ""}
            alt={alt ?? ""}
            loading="lazy"
            className="max-w-full"
          />
        ),
        a: ({ href, children }: LinkProps) => {
          if (href && href.startsWith("#cite-")) {
            const id = href.replace("#cite-", "");
            return <CitationLink citationId={id}>{children}</CitationLink>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

export default React.memo(MarkdownRendererImpl);
