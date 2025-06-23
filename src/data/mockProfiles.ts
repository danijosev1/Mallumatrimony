import { ProfileType } from '../types/profile';

export const featuredProfiles: ProfileType[] = [
  {
    id: '1',
    name: 'Arun Kumar',
    age: 29,
    gender: 'Male',
    religion: 'Hindu',
    caste: 'Nair',
    height: "5'11\"",
    maritalStatus: 'Never Married',
    education: 'M.Tech in Computer Science',
    profession: 'Software Engineer',
    income: '20-25 LPA',
    location: 'Kochi, Kerala',
    images: [
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    shortBio: 'Tech enthusiast working with a multinational company, passionate about innovation and travel.',
    about: 'I am a software engineer working with a leading tech company in Kochi. I enjoy solving complex problems and building applications that make a difference. In my free time, I love traveling, photography, and exploring different cuisines. I am looking for someone who shares similar interests and values family.',
    familyDetails: {
      fatherOccupation: 'Retired Government Officer',
      motherOccupation: 'Homemaker',
      siblings: '1 sister (married)',
      familyType: 'Nuclear',
      familyValues: 'Moderate'
    },
    preferences: {
      ageRange: '24-28',
      education: 'Bachelor\'s or Master\'s degree',
      profession: 'Any',
      location: 'Kerala or willing to relocate',
      religion: 'Hindu',
      caste: 'Any'
    },
    contactInfo: {
      email: 'arun.kumar@example.com'
    },
    keyDetails: ['Hindu', 'Software Engineer', 'Kochi'],
    horoscope: 'Provides on request',
    isPremium: true,
    createdAt: '2023-10-15'
  },
  {
    id: '2',
    name: 'Divya Menon',
    age: 27,
    gender: 'Female',
    religion: 'Hindu',
    caste: 'Menon',
    height: "5'5\"",
    maritalStatus: 'Never Married',
    education: 'MBBS, MD',
    profession: 'Doctor',
    income: '15-20 LPA',
    location: 'Thiruvananthapuram, Kerala',
    images: [
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    shortBio: 'Doctor with a passion for healthcare and helping others, enjoys classical dance in free time.',
    about: 'I am a dedicated physician currently working at a government hospital in Thiruvananthapuram. I am passionate about healthcare and making a positive impact in people\'s lives. I am a trained Bharatanatyam dancer and enjoy reading Malayalam literature. Looking for someone who respects my career and shares similar values.',
    familyDetails: {
      fatherOccupation: 'Doctor',
      motherOccupation: 'Teacher',
      siblings: '1 brother (working abroad)',
      familyType: 'Nuclear',
      familyValues: 'Traditional with modern outlook'
    },
    preferences: {
      ageRange: '27-32',
      education: 'Professional degree',
      profession: 'Doctor, Engineer, or similar profession',
      location: 'Kerala preferred',
      religion: 'Hindu',
      caste: 'No preference'
    },
    contactInfo: {
      email: 'divya.menon@example.com'
    },
    keyDetails: ['Doctor', 'Bharatanatyam Dancer', 'Thiruvananthapuram'],
    horoscope: 'Available',
    isPremium: false,
    createdAt: '2023-11-05'
  },
  {
    id: '3',
    name: 'Jacob Thomas',
    age: 30,
    gender: 'Male',
    religion: 'Christian',
    caste: 'Syrian Catholic',
    height: "5'10\"",
    maritalStatus: 'Never Married',
    education: 'MBA Finance',
    profession: 'Bank Manager',
    income: '15-18 LPA',
    location: 'Kottayam, Kerala',
    images: [
      'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    shortBio: 'Banking professional with a love for music, church activities, and community service.',
    about: 'I work as a manager at a leading private bank in Kottayam. I am actively involved in my church activities and community service. I play the guitar and am part of a local music band. I value family, faith, and maintaining a healthy work-life balance. Looking for a life partner who shares my faith and values.',
    familyDetails: {
      fatherOccupation: 'Retired Bank Employee',
      motherOccupation: 'School Principal',
      siblings: '2 brothers (both married)',
      familyType: 'Joint Family',
      familyValues: 'Traditional'
    },
    preferences: {
      ageRange: '25-29',
      education: 'Graduate or above',
      profession: 'Any',
      location: 'Kerala',
      religion: 'Christian',
      caste: 'Preferably Syrian Catholic'
    },
    contactInfo: {
      email: 'jacob.thomas@example.com'
    },
    keyDetails: ['Christian', 'Bank Manager', 'Kottayam'],
    isPremium: true,
    createdAt: '2023-09-20'
  },
  {
    id: '4',
    name: 'Fathima Zahra',
    age: 26,
    gender: 'Female',
    religion: 'Muslim',
    caste: 'Sunni',
    height: "5'4\"",
    maritalStatus: 'Never Married',
    education: 'B.Tech in Electronics',
    profession: 'IT Professional',
    income: '10-15 LPA',
    location: 'Kozhikode, Kerala',
    images: [
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    shortBio: 'Tech professional balancing modern career with traditional values, enjoys cooking and travel.',
    about: 'I work in the IT sector and am passionate about technology. I believe in balancing my career with traditional values. I enjoy cooking, especially traditional Malabar cuisine, and love to travel and explore new places. I am looking for someone who respects both tradition and modernity.',
    familyDetails: {
      fatherOccupation: 'Business Owner',
      motherOccupation: 'Homemaker',
      siblings: '1 sister, 1 brother (both studying)',
      familyType: 'Nuclear',
      familyValues: 'Religious, Modern outlook'
    },
    preferences: {
      ageRange: '26-32',
      education: 'Graduate or above',
      profession: 'Professional job',
      location: 'Kerala or Gulf',
      religion: 'Muslim',
      caste: 'Sunni preferred'
    },
    contactInfo: {
      email: 'fathima.zahra@example.com'
    },
    keyDetails: ['Muslim', 'IT Professional', 'Kozhikode'],
    horoscope: 'Not applicable',
    isPremium: false,
    createdAt: '2023-12-10'
  }
];

// More profiles can be added for search results page
export const allProfiles: ProfileType[] = [
  ...featuredProfiles,
  // Additional profiles would be added here
];