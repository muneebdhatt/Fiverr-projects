import { AppFrame } from '@/shell/AppFrame';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
