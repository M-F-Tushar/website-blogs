import Image from "next/image";

interface ArticleCoverProps {
  src: string;
  alt: string;
  captionLabel: string;
  captionText: string;
  metaPills?: string[];
  priority?: boolean;
}

export function ArticleCover({
  src,
  alt,
  captionLabel,
  captionText,
  metaPills = [],
  priority = false,
}: ArticleCoverProps) {
  return (
    <figure className="relative mx-auto mt-14 max-w-[82rem]">
      <div
        aria-hidden
        className="absolute inset-x-10 -inset-y-8 -z-10 overflow-hidden rounded-[3rem] opacity-35 blur-3xl"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative overflow-hidden rounded-[2.8rem] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 88vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.2)_50%,rgba(2,6,23,0.74))]" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 md:p-7">
            <div className="max-w-xl">
              <p className="detail-eyebrow text-sky-200/80">{captionLabel}</p>
              <p className="mt-2 text-[0.92rem] leading-7 text-slate-100/92 md:text-base">
                {captionText}
              </p>
            </div>
            {metaPills.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-2">
                {metaPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/12 bg-slate-950/40 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-slate-200"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </figure>
  );
}
