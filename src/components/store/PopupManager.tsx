"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/components/store/TextsProvider";

interface PopupData {
  id: string;
  heading?: string;
  body?: string;
  buttonText?: string;
  buttonUrl?: string;
  image?: string;
  frequency: string;
}

export default function PopupManager() {
  const t = useT();
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/popups/active");
        if (!res.ok) return;
        const data: PopupData = await res.json();
        if (!data) return;

        const storageKey = `popup-seen-${data.id}`;
        if (data.frequency === "ONCE_EVER" && localStorage.getItem(storageKey)) return;
        if (data.frequency === "ONCE_PER_SESSION" && sessionStorage.getItem(storageKey)) return;

        setTimeout(() => {
          setPopup(data);
          setVisible(true);
          fetch(`/api/popups/${data.id}/view`, { method: "POST" }).catch(() => {});
        }, 1500);

        if (data.frequency === "ONCE_PER_SESSION") sessionStorage.setItem(storageKey, "1");
        if (data.frequency === "ONCE_EVER") localStorage.setItem(storageKey, "1");
      } catch {}
    }
    load();
  }, []);

  if (!visible || !popup) return null;

  const dismiss = () => setVisible(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={dismiss}>
      <div className="absolute inset-0 bg-[#1C1711]/50 backdrop-blur-sm" />
      <div
        className="relative bg-[#F5EFE2] max-w-sm w-full shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label={t("popup.close")}
          className="absolute top-3 right-3 z-10 p-1.5 text-[#8A7E6E] hover:text-[#1C1711] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {popup.image && (
          <div className="relative aspect-video">
            <Image src={popup.image} alt={t("popup.imageAlt")} fill className="object-cover" />
          </div>
        )}

        <div className="p-8 text-center">
          {popup.heading && (
            <h2 className="font-serif text-3xl font-light text-[#1C1711] mb-3">{popup.heading}</h2>
          )}
          {popup.body && (
            <p className="text-sm text-[#5A5040] leading-relaxed mb-6">{popup.body}</p>
          )}
          {popup.buttonText && popup.buttonUrl && (
            <Link
              href={popup.buttonUrl}
              onClick={() => {
                fetch(`/api/popups/${popup.id}/click`, { method: "POST" }).catch(() => {});
                dismiss();
              }}
              className="inline-flex items-center gap-2 bg-[#A8975E] text-[#F5EFE2] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
            >
              {popup.buttonText}
            </Link>
          )}
          <button
            onClick={dismiss}
            className="mt-4 block w-full text-xs text-[#8A7E6E] hover:text-[#5A5040] tracking-wider"
          >
            {t("popup.noThanks")}
          </button>
        </div>
      </div>
    </div>
  );
}
