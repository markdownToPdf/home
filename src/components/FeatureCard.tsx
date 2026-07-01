"use client";

import { useEffect, useState } from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

export default function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
