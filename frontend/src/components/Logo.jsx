import { Mountain } from "lucide-react";

export default function Logo({ size = "md" }) {
  const dims = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconDims = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${dims} items-center justify-center rounded-xl`}
        style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 55%, #7c3aed 100%)",
        }}
      >
        <Mountain className={`${iconDims} text-white`} strokeWidth={2.5} />
      </div>
      <span className={`font-semibold tracking-tight text-ink ${textSize}`}>
        SkillGap<span className="text-violet-400">.AI</span>
      </span>
    </div>
  );
}
