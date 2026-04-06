import React from "react";

const Avatar = ({ name, size = 10 }) => {
  const initials = (name || "??").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hue      = ((name?.charCodeAt(0) ?? 0) * 15) % 360;
  const px       = size * 4;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
      style={{ width: px, height: px, minWidth: px, minHeight: px,
        background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,35%)`,
        border: `2px solid hsl(${hue},45%,78%)` }}
    >
      {initials}
    </div>
  );
};

export default Avatar;