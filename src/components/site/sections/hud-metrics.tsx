"use client";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

interface HUDMetricsProps {
  activeVectors: { label: string; value: string }[];
  vectorLabel: string;
  vectorBadge: string;
}

export function HUDMetrics({ activeVectors, vectorLabel, vectorBadge }: HUDMetricsProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <GlassCard className="p-8 md:p-12">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_2fr]">
            <div>
              <span className="inline-block rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-cyan-400">
                {vectorBadge}
              </span>
              <h2 className="mt-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
                {vectorLabel}
              </h2>
              <p className="mt-6 text-slate-400">
                A live representation of the core tracks shaping the platform&apos;s current direction.
              </p>
            </div>
            
            <div className="space-y-8">
              {activeVectors.map((vector, index) => (
                <div key={vector.label} className="relative">
                  <div className="flex items-center justify-between mb-3 font-mono text-xs uppercase tracking-widest">
                    <span className="text-slate-300">{vector.label}</span>
                    <span className="text-cyan-400">{vector.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: vector.value }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
}
