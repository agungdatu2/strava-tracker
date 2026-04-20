"use client";
export default function DashboardError({ error }: { error: Error }) {
  return (
    <div className="p-8 text-red-500">
      <h2 className="font-bold text-xl mb-2">Dashboard Error</h2>
      <pre className="text-sm whitespace-pre-wrap">{error.message}</pre>
      <pre className="text-xs mt-2 text-gray-500">{error.stack}</pre>
    </div>
  );
}
