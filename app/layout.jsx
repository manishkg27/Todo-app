import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Todo App",
  description: "A premium modern Todo Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

