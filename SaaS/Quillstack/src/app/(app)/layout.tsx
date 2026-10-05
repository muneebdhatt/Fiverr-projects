import { AppFrame } from '@/shell/AppFrame';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
