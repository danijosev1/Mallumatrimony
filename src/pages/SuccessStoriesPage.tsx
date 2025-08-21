import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, MapPin, Quote, Star, Users, Camera } from 'lucide-react';

interface SuccessStory {
  id: number;
  couple: {
    bride: string;
    groom: string;
  };
  location: string;
  marriageDate: string;
  story: string;
  quote: string;
  image: string;
  timeline: string;
  tags: string[];
}

const successStories: SuccessStory[] = [
  {
    id: 1,
    couple: {
      bride: "Priya Nair",
      groom: "Arjun Menon"
    },
    location: "Kochi, Kerala",
    marriageDate: "December 2024",
    timeline: "Found each other in 3 months",
    story: "Priya and Arjun's love story began when they connected over their shared passion for classical music and travel. Both working professionals in Kochi, they discovered they had grown up just a few kilometers apart but had never met. Their first conversation lasted four hours, discussing everything from Carnatic music to their dreams of exploring Kerala's backwaters together. What started as a simple 'hello' on Mallu Matrimony blossomed into a beautiful relationship built on mutual respect, shared values, and endless laughter.",
    quote: "We knew we were meant for each other when we realized we both dreamed of the same future - a life filled with music, travel, and family traditions. Mallu Matrimony didn't just help us find a life partner, it helped us find our best friend.",
    image: "https://danijosev.github.io/Mallu-images/image%20(30).png",
    tags: ["Love Marriage", "Same City", "Music Lovers"]
  },
  {
    id: 2,
    couple: {
      bride: "Anjali Thomas",
      groom: "Rohit Sebastian"
    },
    location: "Thiruvananthapuram, Kerala",
    marriageDate: "March 2024",
    timeline: "Long distance for 8 months",
    story: "Anjali, a doctor in Thiruvananthapuram, and Rohit, a software engineer in Bangalore, proved that love knows no boundaries. Their connection was instant despite the 500km distance between them. They spent months getting to know each other through video calls, sharing their daily routines, family traditions, and future aspirations. Rohit would surprise Anjali by ordering her favorite payasam from a local sweet shop, while Anjali would send him handwritten letters. Their families were initially concerned about the distance, but seeing their genuine love and commitment, they wholeheartedly supported the union.",
    quote: "Distance was just a number for us. Every video call, every message brought us closer. When we finally met in person, it felt like we had known each other for years. Our families say we're made for each other, and we couldn't agree more.",
    image: "https://danijosev.github.io/Mallu-images/blurred.png",
    tags: ["Long Distance", "Doctor & Engineer", "Family Approved"]
  },
  {
    id: 3,
    couple: {
      bride: "Meera Krishnan",
      groom: "Vikram Pillai"
    },
    location: "Kozhikode, Kerala",
    marriageDate: "August 2024",
    timeline: "Childhood friends reconnected",
    story: "Sometimes the best love stories are the ones that come full circle. Meera and Vikram were childhood friends who lost touch when their families moved to different cities for work. Twenty years later, Vikram's sister spotted Meera's profile on Mallu Matrimony and immediately called her brother. 'Isn't this your friend from school?' she asked. What followed was a beautiful reunion that rekindled not just friendship, but a love that had been waiting to bloom. Their wedding was a celebration of not just their union, but of destiny bringing two souls back together.",
    quote: "We used to play together as children, never knowing that we were meant to be together as adults. Mallu Matrimony helped us find our way back to each other after two decades. Some connections are just meant to be eternal.",
    image: "https://danijosev.github.io/Mallu-images/blurred.png",
    tags: ["Childhood Friends", "Destiny", "Second Chances"]
  },
  {
    id: 4,
    couple: {
      bride: "Lakshmi Warrier",
      groom: "Arun Kumar"
    },
    location: "Thrissur, Kerala",
    marriageDate: "January 2024",
    timeline: "Found love after 35",
    story: "Lakshmi, a successful entrepreneur at 36, and Arun, a bank manager at 38, had almost given up on finding love. Both had focused on their careers and felt it might be too late for marriage. Their families encouraged them to try Mallu Matrimony one more time. When they connected, they realized that waiting had been worth it - they were both mature, established, and knew exactly what they wanted in a partner. Their courtship was refreshingly honest and straightforward, leading to a beautiful wedding that proved love has no expiry date.",
    quote: "Age is just a number when you find the right person. We're grateful we waited because we found each other at the perfect time in our lives. We're not just husband and wife, we're equal partners in every sense.",
    image: "https://danijosev.github.io/Mallu-images/blurred.png",
    tags: ["Mature Love", "Career Focused", "Perfect Timing"]
  },
  {
    id: 5,
    couple: {
      bride: "Divya Menon",
      groom: "Suresh Nair"
    },
    location: "Kottayam, Kerala",
    marriageDate: "November 2024",
    timeline: "Intercaste marriage with family blessings",
    story: "Divya (Menon community) and Suresh (Nair community) showed that love transcends traditional boundaries. Initially worried about family acceptance, they were pleasantly surprised when both families embraced their relationship wholeheartedly. Their parents said that seeing their children's happiness was more important than caste differences. The wedding was a beautiful blend of both communities' traditions, creating new memories while honoring old customs. Their story inspired many other couples on the platform to follow their hearts.",
    quote: "Love doesn't see caste, creed, or community - it only sees the heart. Our families taught us that happiness and compatibility matter more than traditional barriers. We're building a future based on love and mutual respect.",
    image: "https://danijosev.github.io/Mallu-images/blurred.png",
    tags: ["Intercaste", "Progressive Families", "Breaking Barriers"]
  },
  {
    id: 6,
    couple: {
      bride: "Riya Joseph",
      groom: "Mathew Thomas"
    },
    location: "Ernakulam, Kerala",
    marriageDate: "June 2024",
    timeline: "Found love in shared values",
    story: "Both Riya and Mathew were actively involved in social work and community service. When they connected on Mallu Matrimony, they discovered they had volunteered for the same NGO at different times. Their first date was actually a visit to an orphanage where they both used to volunteer. Watching each other interact with the children, they knew they had found their soulmate. Their wedding was a simple affair with donations made to charity instead of expensive decorations, reflecting their shared values of giving back to society.",
    quote: "We fell in love not just with each other, but with each other's values and dreams. Finding someone who shares your passion for making the world a better place is truly a blessing. Together, we're stronger in our mission to help others.",
    image: "https://danijosev.github.io/Mallu-images/blurred.png",
    tags: ["Social Workers", "Shared Values", "Community Service"]
  }
];

const SuccessStoriesPage: React.FC = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="pt-20 bg-background min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="container-custom">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Love Stories That Inspire
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Real couples, real love stories, real happiness. Discover how Mallu Matrimony 
              has helped thousands of Malayali hearts find their perfect match.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-secondary">2,500+</div>
                <div className="text-white/80">Happy Couples</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">98%</div>
                <div className="text-white/80">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">50+</div>
                <div className="text-white/80">Cities Connected</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Success Stories Grid */}
      <section className="py-20">
        <div className="container-custom">
          <div className="space-y-16">
            {successStories.map((story, index) => (
              <motion.div
                key={story.id}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
              >
                {/* Image Section */}
                <div className="w-full lg:w-1/2">
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                      <img
                        src={story.image}
                        alt={`${story.couple.bride} and ${story.couple.groom}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-full shadow-lg">
                      <Heart className="text-red-500 fill-red-500" size={24} />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-primary mb-2">
                      {story.couple.bride} & {story.couple.groom}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-text/70 mb-4">
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-1 text-primary" />
                        {story.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1 text-primary" />
                        Married {story.marriageDate}
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="mr-1 text-primary" />
                        {story.timeline}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {story.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-text/80 leading-relaxed">
                      {story.story}
                    </p>
                    
                    <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                      <Quote className="text-primary mb-3" size={24} />
                      <p className="text-text italic text-lg leading-relaxed">
                        "{story.quote}"
                      </p>
                      <div className="flex items-center mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="text-secondary fill-secondary" size={16} />
                        ))}
                        <span className="ml-2 text-text/70 text-sm">
                          - {story.couple.bride} & {story.couple.groom}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary/5">
        <div className="container-custom">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Your Love Story Awaits
            </h2>
            <p className="text-lg text-text/80 mb-8">
              Join thousands of happy couples who found their perfect match through Mallu Matrimony. 
              Your success story could be next!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Create Your Profile
              </button>
              <button className="btn-outline">
                Browse Profiles
              </button>
            </div>
            
            <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-primary mb-4">Share Your Success Story</h3>
              <p className="text-text/70 mb-4">
                Found love through Mallu Matrimony? We'd love to feature your story and inspire others!
              </p>
              <button className="btn-secondary">
                <Camera size={18} className="mr-2" />
                Submit Your Story
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SuccessStoriesPage;