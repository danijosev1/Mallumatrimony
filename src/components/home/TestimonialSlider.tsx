import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { QuoteIcon } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';

const testimonials = [
  {
    id: 1,
    quote: "Mallu Matrimony helped us find each other despite living in different states. Their cultural understanding of Kerala traditions made all the difference.",
    author: "Anoop & Lakshmi",
    location: "Kochi",
    image: "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: 2,
    quote: "We were both looking for someone who valued our Malayali heritage while embracing modern values. Thanks to Mallu Matrimony, we found our perfect match!",
    author: "Sreejith & Divya",
    location: "Thrissur",
    image: "https://images.pexels.com/photos/5552789/pexels-photo-5552789.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: 3,
    quote: "The detailed profiles helped us connect on shared interests and cultural values. Our families were thrilled with how smoothly the process went.",
    author: "Rahul & Meera",
    location: "Kozhikode",
    image: "https://images.pexels.com/photos/5559985/pexels-photo-5559985.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  }
];

const TestimonialSlider: React.FC = () => {
  return (
    <Swiper
      modules={[Pagination, Autoplay]}
      spaceBetween={30}
      slidesPerView={1}
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      className="testimonial-slider"
    >
      {testimonials.map((testimonial) => (
        <SwiperSlide key={testimonial.id}>
          <div className="kerala-border p-8 md:p-12 bg-white">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/3">
                <div className="relative">
                  <div className="aspect-square rounded-full overflow-hidden border-4 border-secondary/30">
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <QuoteIcon
                    size={40}
                    className="absolute -top-4 -left-4 text-secondary bg-white p-2 rounded-full"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-2/3">
                <p className="text-lg md:text-xl italic mb-6 text-text/80">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="text-xl font-semibold text-primary">{testimonial.author}</p>
                  <p className="text-text/70">{testimonial.location}</p>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default TestimonialSlider;