import React from "react";

export function LoadingSpinner({ size = "medium", text = "Loading..." }) {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}
      ></div>
      {text && <p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>}
    </div>
  );
}

export function LoadingPage({ text = "Loading..." }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="large" text={text} />
    </div>
  );
}
