'use client';

export default function Loading() {
  return (
    <div className="flex items-start justify-center min-h-screen mt-26">
      {/* Spinner */}
      <div className="w-16 h-16 border-4 border-t-blue-500 border-solid rounded-full animate-spin"></div>
    </div>
  );
}
