import { AuditForm } from '@/components/AuditForm';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Shopify Store Audit
        </h1>
        <p className="text-lg text-gray-600 max-w-md">
          Enter a Shopify store URL to get an automated CRO audit with
          actionable findings in under 30 seconds.
        </p>
      </div>
      <AuditForm />
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">5</p>
          <p className="text-sm text-gray-500">Rules Checked</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">&lt;30s</p>
          <p className="text-sm text-gray-500">Audit Time</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">AI</p>
          <p className="text-sm text-gray-500">Outreach Generation</p>
        </div>
      </div>
    </main>
  );
}
