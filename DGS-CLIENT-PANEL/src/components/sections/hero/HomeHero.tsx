import Image from "next/image";
import Link from "next/link";
import type { Service } from "@/types/service";

interface HomeHeroProps {
  service: Service | null;
  hasInstallations: boolean;
}

export default function HomeHero({
  service,
  hasInstallations,
}: HomeHeroProps) {
  const features = (service?.features ?? [])
    .filter((feature) => feature.title.trim())
    .slice(0, 3);

  return (
    <section
      id="home"
      aria-labelledby="home-title"
      className="bg-[#0c1a30] pt-16 text-white"
    >
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1
            id="home-title"
            className="max-w-[12ch] text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Gas systems for buildings and industry
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
            Design and installation of LPG reticulation, industrial piping,
            AutoGas and fire-protection systems across Bangladesh.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#00668a] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#004c69] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Discuss your project
            </Link>
            <Link
              href={hasInstallations ? "#installations" : "/services"}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/45 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {hasInstallations ? "View gas installations" : "Explore services"}
            </Link>
          </div>
        </div>

        {service?.image_url ? (
          <figure className="relative min-h-[280px] overflow-hidden bg-[#16283d] sm:aspect-[4/3] lg:aspect-[0.95] lg:min-h-[500px]">
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-[#0c1a30]/90 px-5 py-4 text-sm font-semibold text-white">
              {service.name}
            </figcaption>
          </figure>
        ) : features.length > 0 ? (
          <ul className="divide-y divide-white/15 border-y border-white/15">
            {features.map((feature) => (
              <li key={feature.title} className="py-5">
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                {feature.description && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {feature.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
