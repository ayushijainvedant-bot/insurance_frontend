import { alsoBuy } from "@/data/also-buy";

const TAG_COLOR: Record<string, string> = {
  violet: "text-violet",
  coral: "text-coral",
  brand: "text-brand",
};

export default function AlsoBuy() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <span className="mb-4 block font-mono text-xs font-bold uppercase tracking-wide text-brand">
          Also buy
        </span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alsoBuy.map((item) => (
            <a
              key={item.name}
              href="#"
              className="rounded-xl border border-line bg-paper px-4 py-3 transition-colors hover:border-brand/40 hover:bg-brand/5"
            >
              <span className={`block text-[0.7rem] font-bold ${TAG_COLOR[item.tagColor]}`}>
                • {item.tag}
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-ink">{item.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
