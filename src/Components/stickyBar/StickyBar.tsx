import React from 'react';
import { t } from "i18next";
import { ReactNode } from "react";

interface specialBtn {
  shouldShow: boolean;
  btn: ReactNode;
}

interface StickyBarProps {
  shouldShowLength?: boolean;
  selectedRowKeys?: (number | string)[] | null;
  actionBtns?: ReactNode[];
  specialBtns?: specialBtn[];
}

export default function StickyBar({
  shouldShowLength = true,
  selectedRowKeys = null,
  actionBtns = [],
  specialBtns = [],
}: StickyBarProps) {
  return (
    <div className="sticky bottom-0 z-[100] py-4 px-2">
      <section
        className={`
          flex items-center justify-between gap-6 p-4 rounded-2xl
          backdrop-blur-[8px] bg-white/30
          shadow-2xl border border-white/30
          ring-2 ring-white/40
          transition-all duration-300
          relative
          before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none
          before:bg-gradient-to-br before:from-white/40 before:to-white/10
          dark:bg-gradient-to-r dark:from-[#23272f]/80 dark:via-[#2c3140]/80 dark:to-[#23272f]/80
          dark:border-[#23272f]/70 dark:ring-[#23272f]/60
          dark:before:bg-gradient-to-br dark:before:from-[#23272f]/40 dark:before:to-[#2c3140]/10
          overflow-hidden
        `}
        style={{
          boxShadow:
            "0 8px 32px 0 rgba(0,0,0,0.25), 0 1.5px 8px 0 rgba(30,64,175,0.15)",
          backdropFilter: "blur(7px) saturate(100%)",
          WebkitBackdropFilter: "blur(7px) saturate(100%)",
        }}
      >
        {/* Action buttons section */}
        <section className="flex items-center gap-3 z-10">
          {actionBtns.map((btn, index) => (
            <div key={index}>{btn}</div>
          ))}
          {specialBtns.map((btn, index) => {
            if (btn.shouldShow) return <div key={index}>{btn.btn}</div>;
            return null;
          })}
        </section>

        {/* Selected items count section */}
        {shouldShowLength && selectedRowKeys && (
          <div
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/40 dark:bg-[#23272f]/70 shadow-inner border border-white/20 dark:border-[#23272f]/40 z-10 glassmorphism"
            style={{
              boxShadow: "0 1.5px 8px 0 rgba(30,64,175,0.10)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-tr from-green-400 via-green-300 to-green-500 animate-pulse shadow-md"></span>
            <p className="text-[22px] font-bold text-gray-900 dark:text-blue-200 drop-shadow-lg tracking-wide">
              {t("selectedElements")}:{" "}
              <span className="text-yellow-500 dark:text-yellow-300 animate-bounce font-extrabold">
                {selectedRowKeys.length}
              </span>
            </p>
          </div>
        )}
        {/* Glass shine effect */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden z-0">
          <svg width="100%" height="100%">
            <defs>
              <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#shine)" />
          </svg>
        </div>
      </section>
    </div>
  );
}