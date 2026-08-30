import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Khata | सुरक्षित हिसाब व्यवस्थापन",
  description: "व्यक्तिगत तथा व्यवसायिक हिसाब व्यवस्थापनका लागि सुरक्षित Smart Khata।",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>;
}
