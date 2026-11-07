export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-lg mx-auto px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-3">Get in Touch</p>
        <h1 className="font-serif text-5xl font-light text-[#1C1711] mb-10">Contact Us</h1>
        <div className="space-y-6 text-sm text-[#5A5040]">
          <div className="bg-[#EDE6D4] p-6">
            <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-3">Order Support</p>
            <p className="leading-relaxed">For order inquiries, tracking, or returns, email us at:</p>
            <a href="mailto:hello@urpiece.com" className="text-[#A8975E] hover:underline font-medium mt-2 block">
              hello@urpiece.com
            </a>
          </div>
          <div className="bg-[#EDE6D4] p-6">
            <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-3">Payment</p>
            <p className="leading-relaxed">We accept payment via InstaPay. After placing your order, you'll receive instructions to complete your transfer.</p>
          </div>
          <div className="bg-[#EDE6D4] p-6">
            <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-3">Shipping</p>
            <p className="leading-relaxed">Orders are shipped within 2–5 business days. Delivery times vary by location.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
