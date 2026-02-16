// app/layout.tsx
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="cs">
        <body>
        <SessionProviderWrapper>
            {children}
        </SessionProviderWrapper>
        </body>
        </html>
    );
}
