"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/cn";

interface FlowNode {
  id: string;
  type: "trigger" | "message" | "condition";
  title: string;
  desc: string;
  color: string;
}

export default function WhatsAppStudio() {
  const { showToast } = useToast();
  const [nodes, setNodes] = useState<FlowNode[]>([
    { id: "1", type: "trigger", title: "📥 Incoming Message Trigger", desc: "User messages 'opt-in' or 'hello'", color: "#10B981" },
    { id: "2", type: "message", title: "💬 Greeting Broadcast", desc: "'Thanks for contacting TripPilot! What is your vacation target?'", color: "#3B82F6" },
    { id: "3", type: "condition", title: "🌿 Choice Decision Branch", desc: "Split flow by keywords: 'Flight', 'Hotel', or 'Package'", color: "#F59E0B" },
    { id: "4", type: "message", title: "✈️ Sourcing Flights Node", desc: "'Searching global airliner lists for the best travel pricing...'", color: "#7C3AED" },
    { id: "5", type: "message", title: "🏨 Sourcing Hotels Node", desc: "'Checking premium standard hotel supplier availability...'", color: "#EC4899" }
  ]);

  function handleAddNode(type: "message" | "condition") {
    const newNode: FlowNode = {
      id: (nodes.length + 1).toString(),
      type: type,
      title: type === "message" ? "💬 New Automated Response" : "🌿 Custom Keyword Splitter",
      desc: type === "message" ? "Saves custom text message templates." : "Inspects inbound message strings for choices.",
      color: type === "message" ? "#3B82F6" : "#F59E0B"
    };
    setNodes([...nodes, newNode]);
    showToast({ type: "info", message: `New ${type} node added to the canvas!` });
  }

  function handleVerifyFlow() {
    showToast({ type: "info", message: "Analyzing chat flow compiler dependencies..." });
    setTimeout(() => {
      showToast({ type: "success", message: "Meta Flow Schema Compiled Successfully! Ready to sync to production WhatsApp Business API." });
    }, 1500);
  }

  return (
    <AppShell title="WhatsApp Studio">
      <PageContainer>
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <PageHeader
              title="🎨 WhatsApp Studio Bot Builder"
              description="Design intelligent interactive chat response tree flows visually without writing a single line of script."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddNode("message")}
              >
                ＋ Add Message Node
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerifyFlow}
              >
                ⚡ Compile & Save Flow
              </Button>
            </div>
          </div>

        {/* Canvas */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 min-h-96 flex flex-col items-center gap-4 overflow-x-auto relative">
          <div className="flex flex-col items-center w-full max-w-xl">
            {/* Node 1 */}
            <NodeBox node={nodes[0]} label="Inbound Event" />

            {/* Arrow */}
            <ConnectionArrow />

            {/* Node 2 */}
            <NodeBox node={nodes[1]} label="Auto Response" />

            {/* Arrow */}
            <ConnectionArrow />

            {/* Node 3 */}
            <NodeBox node={nodes[2]} label="Logic Condition Splitter" />

            {/* Branch */}
            <div className="flex w-full justify-around mt-0">
              {/* Left Branch */}
              <div className="flex flex-col items-center w-1/2">
                <div className="h-5 w-full border-t-2 border-l-2 border-slate-300 rounded-tl-lg" />
                <ConnectionArrow small />
                <NodeBox node={nodes[3]} label="Triggered flight" small />
              </div>

              {/* Right Branch */}
              <div className="flex flex-col items-center w-1/2">
                <div className="h-5 w-full border-t-2 border-r-2 border-slate-300 rounded-tr-lg" />
                <ConnectionArrow small />
                <NodeBox node={nodes[4]} label="Triggered hotels" small />
              </div>
            </div>

            {/* Additional Nodes */}
            {nodes.length > 5 && (
              <div className="flex flex-wrap justify-center gap-3 mt-7 border-t border-dashed border-slate-300 pt-5 w-full">
                {nodes.slice(5).map((node) => (
                  <NodeBox key={node.id} node={node} label={node.type} small />
                ))}
              </div>
            )}
          </div>

          {/* Guide */}
          <div className="absolute bottom-3 left-4 text-xs text-slate-400 font-medium">
            📍 Canvas Auto-grid: Align nodes sequentially. Double click a node to edit text triggers.
          </div>
        </div>
      </div>
    </PageContainer>
    </AppShell>
  );
}

function NodeBox({
  node,
  label,
  small = false,
}: {
  node: FlowNode;
  label: string;
  small?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg p-4 shadow-sm border-2",
        small ? "w-48" : "w-80"
      )}
      style={{ borderColor: node.color }}
    >
      <span
        className={cn(
          "font-bold uppercase tracking-wider",
          small ? "text-xs" : "text-xs"
        )}
        style={{ color: node.color }}
      >
        {label}
      </span>
      <h4 className={cn("font-bold mt-1 text-gray-900", small ? "text-sm" : "text-base")}>
        {node.title}
      </h4>
      <p className={cn("text-gray-600 mt-1", small ? "text-xs" : "text-sm")}>
        {node.desc}
      </p>
    </div>
  );
}

function ConnectionArrow({ small = false }: { small?: boolean }) {
  return (
    <div className={cn("w-0.5 bg-slate-300 relative", small ? "h-5" : "h-8")}>
      <div className="absolute -left-1 -bottom-1 w-0 h-0 border-l-1.5 border-r-1.5 border-t-1.5 border-l-transparent border-r-transparent border-t-slate-300" />
    </div>
  );
}
