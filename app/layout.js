import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Admin — Buy Treasure Coast",
  description: "Admin panel for Buy Treasure Coast Property",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-50 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
