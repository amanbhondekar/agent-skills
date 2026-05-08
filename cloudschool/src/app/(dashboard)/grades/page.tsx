import type { Metadata } from 'next';
import { GradesClient } from './GradesClient';

export const metadata: Metadata = { title: 'Grades' };

export default function GradesPage() {
  return <GradesClient />;
}
