"use client";
import { motion } from "framer-motion";

export function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-blue-700/20 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-purple-700/20 blur-[100px]"
      />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] [mask-image:linear-gradient(180deg,white,transparent)]" />
    </div>
  );
}
