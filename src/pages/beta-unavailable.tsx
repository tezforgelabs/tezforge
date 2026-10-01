import { Link } from "react-router-dom";

export default function BetaUnavailable() {
  return (
    <main className="min-h-screen bg-[#F7F3EE] px-4 py-20 text-[#1A1A2E]">
      <div className="mx-auto max-w-2xl border-4 border-[#1A1A2E] bg-white p-8 shadow-[6px_6px_0_#1A1A2E]">
        <h1 className="mb-4 text-4xl font-black uppercase">Coming soon</h1>
        <p className="mb-8 text-lg">
          This feature is not available yet.
        </p>
        <Link
          to="/dashboard/create"
          className="inline-block bg-[#0F59FF] px-5 py-3 font-black uppercase text-white"
        >
          Open create hub
        </Link>
      </div>
    </main>
  );
}
