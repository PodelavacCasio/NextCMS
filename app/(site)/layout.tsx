import { getSettings } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <>
      <Header siteName={settings.siteName} />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
