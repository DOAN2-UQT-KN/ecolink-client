import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="py-[92px] px-[20px] lg:px-[160px]">{children}</main>
      <Footer />
    </>
  );
}
