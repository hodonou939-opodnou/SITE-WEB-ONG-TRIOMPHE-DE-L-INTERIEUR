"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function Reveal({
  children,
  delay = 0,
  className = "",
  y = 20,
  scale = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  scale?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: scale ? 0.98 : 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
