"use client";

export default function CreateProjectPage() {
  const TALLY_FORM_ID = "J9dvoY";

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="border-4 border-[#1A1A2E] bg-[#1A1A2E] p-6 shadow-[4px_4px_0_rgba(26,26,46,1)]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-white">
              Submit<br />Project
            </h1>
            <p className="text-sm text-gray-300 mt-2">
              Submit your project for review and listing on the Tezforge launchpad.
            </p>
          </div>
        </div>

        {/* Tally Embedded Form */}
        <div className="w-full border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)]">
          <iframe
            src={`https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
            width="100%"
            height="1200"
            title="Create Project Form"
            className="border-0"
          />
        </div>
      </div>
    </div>
  );
}