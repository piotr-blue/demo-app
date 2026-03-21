import { AppFrame } from "@/components/demo/app-frame";
import { DemoProvider } from "@/components/demo/demo-provider";

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DemoProvider>
      <AppFrame>{children}</AppFrame>
    </DemoProvider>
  );
}
