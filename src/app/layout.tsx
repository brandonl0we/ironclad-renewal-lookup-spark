import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Ironclad Renewal Lookup",
  description: "Find renewal contract details from an ActiveCampaign account host.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
