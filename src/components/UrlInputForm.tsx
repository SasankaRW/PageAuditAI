type UrlInputFormProps = {
  url: string;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function UrlInputForm({
  url,
  loading,
  onUrlChange,
  onSubmit,
}: UrlInputFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Website URL
      </label>
      <div className="flex flex-col gap-2.5 lg:flex-row">
        <div className="flex-1 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm">
          <input
            type="url"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border-0 bg-transparent px-3 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-slate-900 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 lg:min-w-36"
        >
          {loading ? "Running Audit..." : "Run Audit"}
        </button>
      </div>
    </form>
  );
}
