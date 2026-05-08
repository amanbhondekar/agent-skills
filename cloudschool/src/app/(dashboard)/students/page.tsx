import type { Metadata } from 'next';
import { StudentsClient } from './StudentsClient';

export const metadata: Metadata = { title: 'Students' };

export default async function StudentsPage() {
  return <StudentsClient />;
}
