"use client";

import { motion } from "framer-motion";

interface SystemsMapProps {
  recentPostsCount: number;
  recentAcademicCount: number;
  recentRecommendationsCount: number;
}

export function SystemsMap({
  recentPostsCount,
  recentAcademicCount,
  recentRecommendationsCount,
}: SystemsMapProps) {
  const totalSignals = recentPostsCount + recentAcademicCount + recentRecommendationsCount;

  return (
    <div className="relative mx-auto hidden w-full max-w-[36rem] lg:block">
      <motion.div
        className="systems-map"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.span
          className="systems-map-line"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
        <span className="systems-map-line" />
        <span className="systems-map-line" />
        <span className="systems-map-line" />

        <motion.span
          className="systems-map-node left-[2%] top-[20%]"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Writing
        </motion.span>
        <motion.span
          className="systems-map-node right-[1%] top-[22%]"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          Research
        </motion.span>
        <motion.span
          className="systems-map-node bottom-[16%] left-[8%]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Builds
        </motion.span>
        <motion.span
          className="systems-map-node bottom-[14%] right-[3%]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          MLOps
        </motion.span>

        <motion.div
          className="systems-map-core"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
        >
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.28em] text-sky-200/80">
            Public record
          </p>
          <motion.p
            className="mt-3 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.05em] text-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {totalSignals}
          </motion.p>
          <p className="mt-2 text-sm text-slate-400">visible signals</p>
        </motion.div>
      </motion.div>

      <div className="absolute -bottom-5 left-8 right-8 grid grid-cols-3 gap-3">
        <motion.div
          className="rounded-[1.15rem] border border-white/8 bg-slate-950/70 px-4 py-3 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-slate-500">
            Posts
          </p>
          <p className="mt-1 font-display text-2xl text-white">{recentPostsCount}</p>
        </motion.div>
        <motion.div
          className="rounded-[1.15rem] border border-white/8 bg-slate-950/70 px-4 py-3 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-slate-500">
            Study
          </p>
          <p className="mt-1 font-display text-2xl text-white">{recentAcademicCount}</p>
        </motion.div>
        <motion.div
          className="rounded-[1.15rem] border border-white/8 bg-slate-950/70 px-4 py-3 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-slate-500">
            Curated
          </p>
          <p className="mt-1 font-display text-2xl text-white">{recentRecommendationsCount}</p>
        </motion.div>
      </div>
    </div>
  );
}
