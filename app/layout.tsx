import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Lumen - Private Group Chat & Planning",
  description: "A lightweight private hangout + study planning web app for small groups of friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#171717',
              border: '1px solid #e5e5e5',
            },
          }}
        />
      </body>
    </html>
  );
}
