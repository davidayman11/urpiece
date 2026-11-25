import PageSections from "@/components/store/sections/PageSections";
import DefaultRecommended from "@/components/store/sections/DefaultRecommended";

/** Sections the admin added for the cart page, plus the built-in "Recommended for you" row, go below the cart. */
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DefaultRecommended page="cart" />
      <PageSections page="cart" position="bottom" />
    </>
  );
}
