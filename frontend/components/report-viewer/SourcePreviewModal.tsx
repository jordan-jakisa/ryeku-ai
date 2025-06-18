"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { useReportContext } from "./ReportContext";
import { useResearchStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function SourcePreviewModal() {
  const { activeCitationId, setActiveCitationId } = useReportContext();
  const sources = useResearchStore((s) => s.sources);

  const sourceIndex = activeCitationId
    ? parseInt(activeCitationId, 10) - 1
    : -1;
  const source =
    sourceIndex >= 0 && sourceIndex < sources.length
      ? sources[sourceIndex]
      : null;

  const open = Boolean(activeCitationId && source);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !val && setActiveCitationId(null)}
    >
      <DialogContent className="max-w-lg">
        {source ? (
          <>
            <DialogHeader>
              <DialogTitle>{source.title}</DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                {source.domain}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-relaxed mb-4 text-foreground/80">
              {source.description}
            </p>
            <div className="flex justify-end">
              <Button asChild variant="secondary">
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  View Source <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </>
        ) : (
          <p>Source not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
