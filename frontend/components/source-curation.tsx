"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Source, ResearchTopic } from "@/lib/types";
import { useResearchStore } from "@/lib/store";
import { ShieldCheck, ShieldX } from "lucide-react";

/**
 * SourceCuration implements a dual-column drag-and-drop board where the user can
 * move sources between "Trusted" and "Other" buckets. It fulfils Task 19.
 */
export default function SourceCuration() {
  const { researchTopic, sources, generateReport, setSources } =
    useResearchStore();

  // initialise buckets – pre-select authoritative sources as trusted
  const [trusted, setTrusted] = useState<Source[]>([]);
  const [other, setOther] = useState<Source[]>([]);

  useEffect(() => {
    // Place sources with credibility >=80 into trusted bucket by default unless user selection already exists
    const initialTrusted = sources.filter(
      (s: Source) => s.selected ?? s.credibilityScore >= 80
    );
    const initialOther = sources.filter(
      (s: Source) => !(s.selected ?? s.credibilityScore >= 80)
    );
    setTrusted(initialTrusted);
    setOther(initialOther);
  }, [sources]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return; // dropped outside

    // Moving within same list
    if (source.droppableId === destination.droppableId) {
      const items = Array.from(
        source.droppableId === "trusted" ? trusted : other
      );
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      source.droppableId === "trusted" ? setTrusted(items) : setOther(items);
      return;
    }

    // Moving across lists
    const sourceList = source.droppableId === "trusted" ? trusted : other;
    const destList = destination.droppableId === "trusted" ? trusted : other;

    const sourceClone = Array.from(sourceList);
    const destClone = Array.from(destList);

    const [moved] = sourceClone.splice(source.index, 1);
    destClone.splice(destination.index, 0, moved);

    if (source.droppableId === "trusted") {
      setTrusted(sourceClone);
      setOther(destClone);
    } else {
      setOther(sourceClone);
      setTrusted(destClone);
    }
  };

  const handleConfirm = () => {
    const selectedSources = trusted.map((s) => ({ ...s, selected: true }));
    const unselectedSources = other.map((s) => ({ ...s, selected: false }));
    setSources([...selectedSources, ...unselectedSources]);
    generateReport(selectedSources);
  };

  const toggleSource = (source: Source, toTrusted: boolean) => {
    if (toTrusted) {
      // move to trusted
      setOther((prev) => prev.filter((s) => s.id !== source.id));
      setTrusted((prev) => [...prev, source]);
    } else {
      // move to other
      setTrusted((prev) => prev.filter((s) => s.id !== source.id));
      setOther((prev) => [...prev, source]);
    }
  };

  if (!researchTopic) {
    return (
      <div className="text-center text-white">Loading research topic...</div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">
          Curate Sources for “{researchTopic.topic}”
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Drag sources between buckets to mark them as <strong>Trusted</strong>{" "}
          or <strong>Other</strong> before generating the final report.
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trusted column */}
          <SourceColumn
            id="trusted"
            title="Trusted Sources"
            icon={<ShieldCheck className="w-4 h-4" />}
            items={trusted}
            onToggle={toggleSource}
          />

          {/* Other column */}
          <SourceColumn
            id="other"
            title="Other Sources"
            icon={<ShieldX className="w-4 h-4" />}
            items={other}
            onToggle={toggleSource}
          />
        </div>
      </DragDropContext>

      <div className="flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={trusted.length === 0}
          className="bg-gradient-to-r from-white to-gray-300 text-black"
        >
          Generate Report with {trusted.length} Trusted Source
          {trusted.length !== 1 && "s"}
        </Button>
      </div>
    </div>
  );
}

interface SourceColumnProps {
  id: "trusted" | "other";
  title: string;
  icon: React.ReactNode;
  items: Source[];
  onToggle: (source: Source, toTrusted: boolean) => void;
}

function SourceColumn({ id, title, icon, items, onToggle }: SourceColumnProps) {
  return (
    <Droppable droppableId={id}>
      {(provided: DroppableProvided) => (
        <Card
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-white/5 glass-effect border-white/10 min-h-[300px]"
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              {icon}
              <span>
                {title} ({items.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {items.map((source, index) => (
              <Draggable key={source.id} draggableId={source.id} index={index}>
                {(
                  drag: DraggableProvided,
                  snapshot: { isDragging: boolean }
                ) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    {...drag.dragHandleProps}
                    tabIndex={0}
                    role="option"
                    aria-grabbed={snapshot.isDragging}
                    aria-roledescription="Draggable source item"
                    className={`p-3 rounded border border-white/20 text-white text-sm flex justify-between items-center cursor-move transition-colors duration-200 select-none focus:outline-none focus:ring-2 focus:ring-white/40  ${
                      snapshot.isDragging
                        ? "bg-white/30 scale-105 shadow-lg"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={id === "trusted"}
                        onCheckedChange={(checked) =>
                          onToggle(source, Boolean(checked))
                        }
                        className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-black"
                        aria-label="Mark as trusted"
                      />
                      <div>
                        <p className="font-medium leading-snug truncate max-w-[200px] md:max-w-none">
                          {source.title}
                        </p>
                        <p className="text-xs text-white/60 truncate max-w-[200px] md:max-w-none">
                          {source.domain}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/40">
                      {source.credibilityScore}/100
                    </Badge>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </CardContent>
        </Card>
      )}
    </Droppable>
  );
}
