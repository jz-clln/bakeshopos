// File: app/src/components/ui/AnimatedNumber.tsx
//
// Same primitive-component pattern as Switch/Dropdown/Stepper — a
// small, reusable building block rather than one-off logic inlined
// into a screen. Renders a MotionValue directly as a <motion.span>'s
// children (Framer Motion's own documented pattern for animated
// counters) — it subscribes internally and updates the DOM text on
// every frame WITHOUT triggering a React re-render, which is what
// makes a fast-changing number stay smooth instead of janky.

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  // Same springiness family as the rest of the shell (NavBar, Sidebar)
  // rather than a bespoke tween — this is what makes a number "settle"
  // feel like the same app as everything around it.
  const spring = useSpring(motionValue, { stiffness: 260, damping: 30, mass: 0.9 });
  const rounded = useTransform(spring, (latest) => Math.round(latest));
  const display = useTransform(rounded, (latest) => (format ? format(latest) : String(latest)));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}