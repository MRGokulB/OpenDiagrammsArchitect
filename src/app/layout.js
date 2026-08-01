import "./globals.css";

export const metadata = {
  title: "AI Mermaid Live Editor",
  description: "A proper local Mermaid live editor powered by Groq AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
