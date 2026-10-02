import "./globals.css";

export const metadata = {
  title: "ሚዛን (Mizan) AI Assistant",
  description: "ሚዛን (Mizan) AI Assistant multi-language supported.",
  icons: { icon: "/mizan.png",},
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}