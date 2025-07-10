import "@fontsource-variable/inter";
import "@fontsource-variable/roboto";
import "@fontsource-variable/open-sans";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Bygden Video Scheduler",
  description: "Simple video hosting and scheduling for restaurants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
