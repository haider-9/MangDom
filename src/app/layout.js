import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const robot_mono = Roboto_Mono({
  subsets: ["latin"]
})

export const metadata = {
  title: "Mangadom",
  description: "Welcome to Mangadom - Your Ultimate Manga Destination. Discover a vast collection of manga series, from classic favorites to the latest releases. Immerse yourself in captivating storylines, stunning artwork, and diverse genres. Stay updated with new chapters, explore author profiles, and connect with fellow manga enthusiasts. Your journey into the world of manga starts here!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${robot_mono.className} bg-background text-foreground`}>
        <Navbar />
        <div className="mt-16">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
