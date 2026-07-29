"use client";

export default function CreateProjectPage() {
  // Tally form ID
  const TALLY_FORM_ID = "J9dvoY";

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Header */}
        <h1 className="text-6xl md:text-7xl font-black uppercase mb-6 tracking-tight">
          CREATE<br />PROJECT
        </h1>

        {/* Tally Embedded Form */}
        <div className="w-full">
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