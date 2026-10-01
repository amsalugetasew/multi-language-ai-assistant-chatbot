import "./globals.css";

export const metadata = {
  title: "Multi-Language AI Assistant",
  description:
    "An intelligent multi-language AI assistant chatbot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}