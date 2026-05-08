import type { Metadata } from 'next';
import { FeesClient } from './FeesClient';

export const metadata: Metadata = { title: 'Fees' };

export default function FeesPage() {
  return <FeesClient />;
}
