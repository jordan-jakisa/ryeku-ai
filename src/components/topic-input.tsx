"use client";

import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { useState } from "react";

export type TopicInputProps = {
  onSubmitTopic: (topic: string) => void;
};

const TopicInput = ({ onSubmitTopic }: TopicInputProps) => {
  const [topic, setTopic] = useState("");

  const onHandleSubmit = () => {
    console.log("Submitted topic:", topic);
    onSubmitTopic(topic);
    setTopic("");
  };

  return (
    <>
      <div className="flex flex-col w-full space-y-8 px-12 items-center pt-24">
        <h1 className="text-3xl font-medium text-center">
          Uncover Insights into topics with AI
        </h1>

        <div className="flex space-x-2 w-full px-24">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            type="text"
            placeholder="Enter a topic"
            className="w-full"
          />
          {topic && (
            <Button
              onClick={onHandleSubmit}
              className="cursor-pointer"
              type="submit"
            >
              Generare
            </Button>
          )}
        </div>

        {!topic && (
          <p className="text-sm text-muted-foreground text-center ">
            Enter a topic to begin your research
          </p>
        )}
      </div>
    </>
  );
};

export default TopicInput;
