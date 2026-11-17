export default function LoadError({ what, message }: { what: string; message: string }) {
  const missingTable = /relation .* does not exist|could not find the table/i.test(message);
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-semibold">Could not load {what}.</p>
      <p className="mt-1">{message}</p>
      {missingTable && (
        <p className="mt-2">
          The table is missing — run <code className="rounded bg-red-100 px-1">npm run db:apply</code> to apply the
          latest migrations.
        </p>
      )}
    </div>
  );
}
