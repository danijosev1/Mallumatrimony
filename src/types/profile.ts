export type ProfileType = {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  religion: string;
  caste?: string;
  height: string;
  maritalStatus: string;
  education: string;
  profession: string;
  income?: string;
  location: string;
  images: string[];
  shortBio: string;
  about: string;
  familyDetails: {
    fatherOccupation?: string;
    motherOccupation?: string;
    siblings?: string;
    familyType?: string;
    familyValues?: string;
  };
  preferences: {
    ageRange: string;
    height?: string;
    education?: string;
    profession?: string;
    location?: string;
    religion?: string;
    caste?: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
  };
  keyDetails: string[];
  horoscope?: string;
  isPremium: boolean;
  createdAt: string;
};