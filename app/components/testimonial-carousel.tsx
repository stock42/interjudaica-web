"use client"

import { useMemo } from "react"
import Autoplay from "embla-carousel-autoplay"
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
	CarouselDots,
} from "@/components/ui/carousel"
import type { TypeSocialProof } from "@/models/social-proof"

export default function TestimonialCarousel({
	testimonials,
}: {
	testimonials: TypeSocialProof[]
}) {
	const autoplay = useMemo(
		() => Autoplay({ delay: 5000, stopOnInteraction: false }),
		[],
	)

	return (
		<section className="bg-[#080b0d] py-12 text-[#f8f2e8]">
			<div className="mx-auto w-full max-w-[1480px] px-6 sm:px-10 lg:px-16 xl:px-20">
				<div className="mb-8 flex items-center justify-center gap-5 sm:gap-6">
					<span className="hidden h-px max-w-[18rem] flex-1 bg-[var(--line)] sm:block" />
					<h2 className="text-center font-display text-xl font-semibold uppercase tracking-[0.16em] text-[var(--gold)] sm:text-2xl sm:tracking-[0.32em]">
						What Our Students Say
					</h2>
					<span className="hidden h-px max-w-[18rem] flex-1 bg-[var(--line)] sm:block" />
				</div>

				<Carousel
					plugins={[autoplay]}
					opts={{
						align: "start",
						loop: true,
						duration: 30,
						slides: { perView: 1, spacing: 28 },
						breakpoints: {
							"(min-width: 768px)": {
								slides: { perView: 2, spacing: 28 },
							},
							"(min-width: 1024px)": {
								slides: { perView: 3, spacing: 28 },
							},
						},
					}}
					className="group/carousel"
					onMouseEnter={() => autoplay.stop()}
					onMouseLeave={() => autoplay.play()}
				>
					<CarouselContent>
						{testimonials.map((testimonial) => (
							<CarouselItem key={testimonial.uuid ?? testimonial.name}>
								<figure className="flex h-full flex-col rounded-lg border border-[rgba(244,189,51,0.58)] bg-[#080b0d] p-6">
									<p className="font-display text-4xl leading-none text-[var(--gold)]">
										&ldquo;
									</p>
									<blockquote className="mt-1 flex-1 text-base italic leading-7 text-white/86">
										{testimonial.quote}
									</blockquote>
									<figcaption className="mt-5 flex items-center justify-between gap-4 text-sm text-white/78">
										<div>
											<p>- {testimonial.name}</p>
											<p className="text-xs text-white/60">
												{testimonial.detail}
											</p>
										</div>
										<span className="text-base tracking-[0.18em] text-[var(--gold)]">
											*****
										</span>
									</figcaption>
								</figure>
							</CarouselItem>
						))}
					</CarouselContent>

					<div className="mt-6 flex items-center justify-center gap-4">
						<CarouselPrevious className="static translate-y-0" />
						<CarouselDots />
						<CarouselNext className="static translate-y-0" />
					</div>
				</Carousel>
			</div>
		</section>
	)
}
