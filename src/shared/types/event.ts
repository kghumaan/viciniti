export type EventCategory =
  | 'Sports & Recreation'
  | 'Arts & Creative'
  | 'Food & Drink'
  | 'Professional & Learning'
  | 'Entertainment & Social'
  | 'Outdoor Adventure'
  | 'Wellness & Mindfulness'
  | 'Cultural & Community';

export type EventSubcategory = {
  'Sports & Recreation':
    | 'Golf'
    | 'Tennis'
    | 'Basketball'
    | 'Soccer/Football'
    | 'Running/Jogging'
    | 'Hiking'
    | 'Cycling'
    | 'Volleyball'
    | 'Rock Climbing'
    | 'Swimming'
    | 'Yoga'
    | 'Fitness Classes';
  'Arts & Creative':
    | 'Painting'
    | 'Photography'
    | 'Drawing'
    | 'Crafts'
    | 'Music Making'
    | 'Creative Writing'
    | 'Dance'
    | 'Pottery/Ceramics';
  'Food & Drink':
    | 'Restaurant Dining'
    | 'Coffee Meetups'
    | 'Wine Tasting'
    | 'Cooking Classes'
    | 'Food Tours'
    | 'Brewery Tours'
    | 'Brunch Groups'
    | 'Cultural Cuisine';
  'Professional & Learning':
    | 'Networking'
    | 'Language Exchange'
    | 'Tech Talks'
    | 'Business Meetups'
    | 'Skill Sharing'
    | 'Study Groups'
    | 'Career Development'
    | 'Public Speaking';
  'Entertainment & Social':
    | 'Board Games'
    | 'Video Games'
    | 'Movie Watching'
    | 'Trivia Nights'
    | 'Karaoke'
    | 'Book Clubs'
    | 'Concert Going'
    | 'Comedy Shows';
  'Outdoor Adventure':
    | 'Camping'
    | 'Fishing'
    | 'Kayaking'
    | 'Surfing'
    | 'Skiing/Snowboarding'
    | 'Beach Activities'
    | 'Bird Watching'
    | 'Nature Photography';
  'Wellness & Mindfulness':
    | 'Meditation'
    | 'Group Therapy'
    | 'Life Coaching'
    | 'Mental Health Support'
    | 'Spiritual Groups'
    | 'Alternative Healing';
  'Cultural & Community':
    | 'Language Groups'
    | 'Cultural Festivals'
    | 'Volunteer Work'
    | 'Heritage Celebrations'
    | 'Museum Visits'
    | 'Local History Tours';
};

export type Event = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  subcategory: EventSubcategory[EventCategory];
  date: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdBy: string;
  attendees: string[];
  maxAttendees?: number;
  eventImage?: string | null;
  viewingRadius?: number;
}; 