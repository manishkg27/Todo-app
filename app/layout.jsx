import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Todo App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
