import type { Metadata } from "next";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import PopupManager from "@/components/store/PopupManager";

export const metadata: Metadata = {
  title: { default: "UrPiece — Your Glow, Your Piece", template: "%s | UrPiece" },
  description: "Premium jewelry and accessories. Your Glow, Your Piece.",
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <PopupManager />
    </>
  );
}
