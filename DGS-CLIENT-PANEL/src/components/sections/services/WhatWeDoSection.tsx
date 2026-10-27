"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, CircleX, ClipboardCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { WhatWeDoItem } from "@/types/what-we-do";

interface Props {
  items: WhatWeDoItem[];
  error?: string;
}

export default function WhatWeDoSection({ items, error }: Props) {
  const availableItems = items
    .filter((item) => item.is_available)
    .filter((item) => item.category.trim().length > 0);
  const categories = [
    ...new Set(availableItems.map((item) => item.category.trim())),
  ];
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const [isPhone, setIsPhone] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  useEffect(() => {
    const phoneViewport = window.matchMedia("(max-width: 639px)");
    const updateViewport = () => setIsPhone(phoneViewport.matches);

    updateViewport();
    phoneViewport.addEventListener("change", updateViewport);
    return () => phoneViewport.removeEventListener("change", updateViewport);
  }, []);
  const selectedCategory = categories.includes(activeCategory)
    ? activeCategory
    : (categories[0] ?? "");
  const categoryItems = availableItems
    .filter((item) => item.category.trim() === selectedCategory)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  return (
    <section
      id="what-we-do"
      aria-labelledby="what-we-do-title"
      className="w-full bg-[#e8f1f5] py-14 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl space-y-2">
          <h2
            id="what-we-do-title"
            className="text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-[#102a35] sm:text-5xl"
          >
            Challenges meet engineered solutions.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[#34525d] sm:text-lg">
            Explore practical solutions across DGS service areas.
          </p>
        </header>

        {error ? (
          <p
            role="alert"
            className="bg-white px-5 py-4 text-base text-slate-800"
          >
            We could not load this section. Please try again later.
          </p>
        ) : categories.length === 0 ? (
          <p className="bg-white px-5 py-4 text-base text-slate-800">
            Challenge and solution details will appear here soon.
          </p>
        ) : (
          <>
            <div
              role="group"
              aria-label="Choose a challenge and solution category"
              tabIndex={0}
              className="flex w-full snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00668a] sm:flex-wrap sm:overflow-visible"
            >
              {categories.map((category, index) => (
                <motion.button
                  key={category}
                  type="button"
                  aria-pressed={selectedCategory === category}
                  onClick={() => setActiveCategory(category)}
                  initial={{
                    opacity: shouldReduceMotion ? 1 : 0,
                    scale: shouldReduceMotion ? 1 : 0.96,
                  }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.3,
                    delay: shouldReduceMotion ? 0 : 0.05 * index,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className={`min-h-10 shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00668a] sm:min-h-11 cursor-pointer  sm:px-4 sm:text-sm ${
                    selectedCategory === category
                      ? "bg-[#123d4a] text-white"
                      : "bg-white/70 text-[#183641] hover:bg-white"
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>

            <motion.div aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: isPhone ? 0.2 : 0.8 }}
                  exit={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : -4,
                  }}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: shouldReduceMotion ? 0 : 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: shouldReduceMotion ? 0 : 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    },
                  }}
                  className="overflow-hidden bg-white rounded-2xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    <div className="bg-[#f8e9e5] px-5 py-4 sm:px-7">
                      <h3 className="text-lg font-bold text-[#422b29]">
                        The challenge
                      </h3>
                      <p className="mt-1 text-sm text-[#704b45]">
                        What conventional setups can leave unresolved
                      </p>
                    </div>
                    <div className="bg-[#dcefe8] px-5 py-4 sm:px-7">
                      <h3 className="text-lg font-bold text-[#173b32]">
                        The DGS solution
                      </h3>
                      <p className="mt-1 text-sm text-[#315e50]">
                        A considered, engineered response
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3 p-3 sm:space-y-0 sm:p-0">
                    {categoryItems.map((item, index) => (
                      <motion.li
                        key={item.id}
                        variants={{
                          hidden: {
                            opacity: 0,
                            y: shouldReduceMotion ? 0 : 8,
                          },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: shouldReduceMotion ? 0 : 0.3,
                              delay: shouldReduceMotion ? 0 : index * 0.055,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2"
                      >
                        <div className="flex items-start gap-3 bg-[#fbf6f4] px-4 py-4 sm:bg-white sm:px-7 sm:py-6">
                          <CircleX
                            aria-hidden="true"
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#a34c3e]"
                          />
                          <div className="min-w-0 space-y-1">
                            <h4 className="font-semibold leading-snug text-[#182f38]">
                              {item.problem}
                            </h4>
                            <p className="text-sm leading-relaxed text-[#3b535c]">
                              {item.problem_desc}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-[#f0f8f4] px-4 py-4 sm:px-7 sm:py-6">
                          <CircleCheck
                            aria-hidden="true"
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#287454]"
                          />
                          <div className="min-w-0 space-y-1">
                            <h4 className="font-semibold leading-snug text-[#182f38]">
                              {item.solution}
                            </h4>
                            <p className="text-sm leading-relaxed text-[#3b535c]">
                              {item.solution_desc}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.aside 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true , amount: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-4 bg-[#123d4a] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7 rounded-2xl">
              <div className="flex items-center gap-3">
                <ClipboardCheck
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 text-[#a8d7c3]"
                />
                <div>
                  <h3 className="font-semibold text-white">
                    Planning a project or solving a site challenge?
                  </h3>
                  <p className="text-sm leading-relaxed text-[#d7e7e8]">
                    Talk with our team about a solution suited to your needs.
                  </p>
                </div>
              </div>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#f95700] px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#d94c00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:shrink-0"
              >
                Talk to our team
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </motion.aside>
          </>
        )}
      </div>
    </section>
  );
}
