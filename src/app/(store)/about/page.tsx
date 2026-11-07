export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-3">Our Story</p>
        <h1 className="font-serif text-5xl font-light text-[#1C1711] mb-8">About UrPiece</h1>
        <div className="space-y-6 text-sm text-[#5A5040] leading-relaxed">
          <p>
            UrPiece was born from a belief that every woman deserves pieces that reflect her inner radiance.
            We curate premium jewelry and accessories designed to celebrate the woman who knows her worth.
          </p>
          <p>
            Each piece in our collection is chosen with care — for quality, craftsmanship, and the feeling
            it gives when you wear it. We believe accessories aren't just ornaments; they're expressions.
          </p>
          <p className="font-serif text-2xl text-[#A8975E] italic">"Your Glow, Your Piece."</p>
          <p>
            We're committed to making premium pieces accessible, with a personal shopping experience
            and careful attention to every order.
          </p>
        </div>
      </div>
    </div>
  );
}
