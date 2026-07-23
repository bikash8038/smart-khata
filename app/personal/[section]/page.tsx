import { SmartKhataRoot } from "../../../features/app/components/SmartKhataRoot";

export default async function PersonalPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SmartKhataRoot initialPage={section} />;
}
