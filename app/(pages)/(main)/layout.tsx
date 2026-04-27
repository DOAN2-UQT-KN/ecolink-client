import Header from '@/components/client/layout/Header';
import Footer from '@/components/client/layout/Footer';
import ClickSpark from '@/components/ui/ClickSpark';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <ClickSpark
        sparkColor="#665814"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <main className="py-[92px] px-[20px] lg:px-[160px]">{children}</main>
      </ClickSpark>
      <Footer />
    </>
  );
}
