import React from "react";

export const Logo: React.FC<{ className?: string }> = ({
  className = "w-9 h-9",
}) => {
  return <img src="/exaf-logo-white.png" alt="logo" height={70} width={70} />;
};
