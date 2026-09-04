export default function ImportReport({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{report.totalProcessed}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Processed</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/40">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{report.successCount}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Success</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/40">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{report.failedCount}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Failed</p>
        </div>
      </div>

      {report.failed?.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-red-700 dark:text-red-400">Failed Records</h4>
          <div className="max-h-48 overflow-y-auto rounded-lg border dark:border-slate-700">
            <table className="w-full text-xs">
              <thead className="panel-head">
                <tr>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.failed.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{f.row}</td>
                    <td className="px-3 py-2 text-red-600 dark:text-red-400">{f.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.successful?.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-green-700 dark:text-green-400">Imported Successfully</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{report.successCount} record(s) saved to database.</p>
        </div>
      )}

      {onClose && (
        <button onClick={onClose} className="w-full rounded-lg bg-primary-600 py-2 text-white">
          Close
        </button>
      )}
    </div>
  );
}
