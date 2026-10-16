"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";

type GNode = {
  id: string;
  type: string;
  content: Record<string, unknown>;
  is_human_authored?: boolean;
};
type GEdge = {
  id: string;
  source_id: string;
  target_id: string;
  relationship: string;
};

const STYLE: Record<string, { label: string; color: string }> = {
  feedback: { label: "Feedback", color: "#a78bfa" },
  evidence: { label: "Evidence", color: "#38bdf8" },
  problem: { label: "Problem", color: "#f87171" },
  assumption: { label: "Assumption", color: "#fbbf24" },
  alternative: { label: "Alternative", color: "#fb923c" },
  decision: { label: "Decision", color: "#34d399" },
  prototype: { label: "Prototype", color: "#22d3ee" },
  verification: { label: "Verification", color: "#818cf8" },
};

function summary(n: GNode): string {
  const c = n.content as Record<string, string>;
  const text = c.title ?? c.text ?? c.quote ?? "";
  return text.length > 70 ? text.slice(0, 70) + "…" : text;
}

function IntentNode({ data }: NodeProps) {
  const s = STYLE[data.kind as string] ?? STYLE.feedback;
  const isAI = !data.human;
  return (
    <div
      className="w-[200px] rounded-lg bg-[#0e1530] p-2 text-left"
      style={{
        border: `1.5px ${isAI ? "dashed" : "solid"} ${s.color}`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <p
        className="text-[10px] font-semibold uppercase"
        style={{ color: s.color }}
      >
        {s.label}
        {isAI ? " · AI" : ""}
      </p>
      <p className="mt-1 text-xs leading-snug text-slate-200">
        {data.label as string}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  );
}

const nodeTypes = { intent: IntentNode };

// Simple layered layout by node type
const LAYER: Record<string, number> = {
  feedback: 0,
  evidence: 1,
  assumption: 1,
  problem: 2,
  alternative: 3,
  decision: 4,
  prototype: 5,
  verification: 6,
};

export function IntentGraph({
  nodes,
  edges,
}: {
  nodes: GNode[];
  edges: GEdge[];
}) {
  const [selected, setSelected] = useState<GNode | null>(null);

  const { rfNodes, rfEdges } = useMemo(() => {
    const byLayer = new Map<number, GNode[]>();
    nodes.forEach((n) => {
      const l = LAYER[n.type] ?? 0;
      byLayer.set(l, [...(byLayer.get(l) ?? []), n]);
    });

    const rfNodes: Node[] = [];
    byLayer.forEach((list, layer) => {
      list.forEach((n, i) => {
        const offset = (i - (list.length - 1) / 2) * 240;
        rfNodes.push({
          id: n.id,
          type: "intent",
          position: { x: 400 + offset, y: layer * 150 },
          data: {
            kind: n.type,
            label: summary(n),
            human: n.is_human_authored,
          },
        });
      });
    });

    const rfEdges: Edge[] = edges.map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      label: e.relationship.replace("_", " "),
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      style: { stroke: "#64748b" },
      labelStyle: { fill: "#94a3b8", fontSize: 10 },
      labelBgStyle: { fill: "#0e1530" },
    }));

    return { rfNodes, rfEdges };
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
        Add feedback and run the AI analysis to build the graph.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[460px] rounded-lg border border-white/10 bg-[#070b17]">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          nodesDraggable
          onNodeClick={(_, node) =>
            setSelected(nodes.find((n) => n.id === node.id) ?? null)
          }
          onPaneClick={() => setSelected(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {selected && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
          <p
            className="font-semibold uppercase"
            style={{ color: STYLE[selected.type]?.color }}
          >
            {STYLE[selected.type]?.label}
            {selected.is_human_authored ? " · Human" : " · AI hypothesis"}
          </p>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-slate-300">
            {JSON.stringify(selected.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}