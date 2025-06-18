"use client";

import OutlineTree from "./OutlineTree";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export default function OutlinePane({ className }: Props) {
  return (
    <div className={cn("p-4 overflow-y-auto h-full", className)}>
      <OutlineTree />
    </div>
  );
}
