"use client";

import { useEffect, useId, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function renderDiagram() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "dark",
        });

        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${id.replace(/[:]/g, "")}`,
          chart,
        );

        if (active) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (renderError) {
        if (active) {
          setSvg(null);
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Unable to render Mermaid diagram.",
          );
        }
      }
    }

    void renderDiagram();

    return () => {
      active = false;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="mermaid-shell">
        <p className="text-sm font-medium text-amber-200">Mermaid diagram error</p>
        <p className="mt-2 text-sm text-slate-300">{error}</p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-100">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-shell">
        <p className="text-sm text-slate-300">Rendering diagram...</p>
      </div>
    );
  }

  return (
    <div
      className="mermaid-shell"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
