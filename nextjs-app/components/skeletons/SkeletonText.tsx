import React from "react";

interface SkeletonTextProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  className = "", 
  width = "100%", 
  height = "1rem", 
  rounded = "rounded" 
}) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
};

export default SkeletonText;
