import type { Metadata } from 'next';
import { FacultyClient } from './FacultyClient';

export const metadata: Metadata = { title: 'Faculty' };

export default function FacultyPage() {
  return <FacultyClient />;
}
