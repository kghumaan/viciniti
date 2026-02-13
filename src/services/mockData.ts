import { Beacon, BeaconCategory } from '../shared/types/beacon';
import { beaconService } from './firebase';
import { CATEGORIES, SUBCATEGORIES } from '../shared/constants/categories';

/**
 * Generate a random latitude/longitude within a radius of a center point
 */
function getRandomLocation(centerLat: number, centerLng: number, radiusKm: number) {
  // Earth's radius in kilometers
  const earthRadius = 6371;
  
  // Convert radius from kilometers to radians
  const radiusInRadian = radiusKm / earthRadius;
  
  // Convert latitude and longitude to radians
  const centerLatRadian = centerLat * (Math.PI / 180);
  const centerLngRadian = centerLng * (Math.PI / 180);
  
  // Random angle
  const randomAngle = Math.random() * Math.PI * 2;
  
  // Random radius (using square root to have uniform distribution)
  const randomRadius = Math.sqrt(Math.random()) * radiusInRadian;
  
  // Calculate new position
  const newLatRadian = Math.asin(
    Math.sin(centerLatRadian) * Math.cos(randomRadius) +
    Math.cos(centerLatRadian) * Math.sin(randomRadius) * Math.cos(randomAngle)
  );
  
  const newLngRadian = centerLngRadian + Math.atan2(
    Math.sin(randomAngle) * Math.sin(randomRadius) * Math.cos(centerLatRadian),
    Math.cos(randomRadius) - Math.sin(centerLatRadian) * Math.sin(newLatRadian)
  );
  
  // Convert back to degrees
  const newLat = newLatRadian * (180 / Math.PI);
  const newLng = newLngRadian * (180 / Math.PI);
  
  return { latitude: newLat, longitude: newLng };
}

/**
 * Generate a random date between start and end dates
 */
function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate random addresses in Los Angeles area
 */
const laBuildingNumbers = [
  '1', '5', '10', '20', '100', '200', '300', '400', '500', '900', '1000', '2000', '3000', '3400', '3500'
];

const laStreets = [
  'S Sepulveda Blvd', 'Pico Blvd', 'Olympic Blvd', 'Westwood Blvd', 'Overland Ave',
  'National Blvd', 'Palms Blvd', 'Motor Ave', 'Manning Ave', 'Veteran Ave',
  'Century Park East', 'Avenue of the Stars', 'Santa Monica Blvd', 'Wilshire Blvd', 'Venice Blvd'
];

function getRandomAddress() {
  const buildingNum = laBuildingNumbers[Math.floor(Math.random() * laBuildingNumbers.length)];
  const street = laStreets[Math.floor(Math.random() * laStreets.length)];
  return `${buildingNum} ${street}, Los Angeles, CA`;
}

/**
 * Generate random beacon titles based on category
 */
const beaconTitlesByCategory: Record<BeaconCategory, string[]> = {
  'Sports & Recreation': [
    'Weekend Basketball Game', 'Tennis Meetup', 'Weekly Running Group',
    'Beginner Yoga Class', 'Pickup Soccer Match', 'Hiking Adventure',
    'Cycling Group Ride', 'Rock Climbing Session'
  ],
  'Arts & Creative': [
    'Watercolor Painting Workshop', 'Photography Walk', 'Pottery Class',
    'Creative Writing Circle', 'Life Drawing Session', 'DIY Craft Night',
    'Music Jam Session', 'Dance Class'
  ],
  'Food & Drink': [
    'Wine Tasting Night', 'Cooking Class: Italian Cuisine', 'Coffee Enthusiasts Meetup',
    'Craft Beer Tasting', 'Foodie Restaurant Adventure', 'Vegan Cooking Workshop',
    'Chocolate Tasting Beacon', 'BBQ Masterclass', 'Farmers Market Tour',
    'International Food Night'
  ],
  'Professional & Learning': [
    'Networking Happy Hour', 'Tech Talk: AI Basics', 'Financial Literacy Workshop',
    'Public Speaking Practice', 'Career Development Workshop', 'Coding Bootcamp',
    'Language Exchange Meetup', 'Entrepreneurship Discussion'
  ],
  'Entertainment & Social': [
    'Board Game Night', 'Movie Marathon', 'Book Club Meeting',
    'Trivia Night Challenge', 'Karaoke Party', 'Video Game Tournament',
    'Live Music Showcase', 'Speed Friending Beacon', 'Mystery Dinner Theater'
  ],
  'Outdoor Adventure': [
    'Beach Cleanup Day', 'Camping Weekend', 'Sunrise Hike',
    'Kayaking Expedition', 'Mountain Biking Trip', 'Bird Watching Tour',
    'Fishing Trip', 'Stargazing Night'
  ],
  'Wellness & Mindfulness': [
    'Meditation Session', 'Mindfulness Workshop', 'Yoga in the Park',
    'Wellness Retreat Day', 'Self-Care Workshop', 'Sound Bath Experience',
    'Breathwork Circle', 'Stress Management Class'
  ],
  'Cultural & Community': [
    'Cultural Food Festival', 'Community Garden Day', 'Art Gallery Tour',
    'Historical Walking Tour', 'Language Learning Group', 'Community Service Day',
    'Cultural Dance Workshop', 'Museum Exhibition Visit'
  ]
};

/**
 * Generate random beacon descriptions
 */
function getRandomDescription(category: BeaconCategory, title: string) {
  const descriptions = [
    `Join us for this amazing ${category.toLowerCase()} beacon! ${title} is perfect for all skill levels and ages.`,
    `Looking to connect with others who share your passion for ${category.toLowerCase()}? This is the beacon for you!`,
    `Come to our ${title} beacon and meet new friends while enjoying ${category.toLowerCase()} activities.`,
    `Experience the joy of ${category.toLowerCase()} with like-minded people at our ${title} beacon. No prior experience necessary!`,
    `${title} - a beacon designed to bring together enthusiasts of ${category.toLowerCase()} in a fun, relaxed atmosphere.`,
    `Discover the fun of ${category.toLowerCase()} at our ${title} beacon. All levels welcome!`,
    `Connect, learn, and enjoy at our ${title} beacon. This is a great opportunity to explore ${category.toLowerCase()}.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Generate a batch of mock beacons
 */
export async function generateMockBeacons(count: number = 5) {
  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);
  
  const mockBeacons = [];
  
  for (let i = 0; i < count; i++) {
    // Random category
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)] as BeaconCategory;
    
    // Random location
    const location = getRandomLocation(34.0522, -118.2437, 5);
    
    // Random date between now and 60 days from now
    const beaconDate = getRandomDate(now, sixtyDaysFromNow);
    
    // Random max attendees between 5 and 30
    const maxAttendees = Math.floor(Math.random() * 26) + 5;
    
    // Random viewing radius between 1 and 10 miles
    const viewingRadius = Math.floor(Math.random() * 10) + 1;
    
    // Random title based on category
    const titles = beaconTitlesByCategory[category];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    // Random token cost/reward settings
    // 40% chance of having a fee, 30% chance of giving a reward, 30% chance of no token interaction
    const hasTokens = Math.random();
    let tokenCost: number | null = null;
    
    if (hasTokens < 0.4) {
      // This beacon charges a fee (positive tokenCost)
      tokenCost = Math.floor(Math.random() * 20) + 5; // Fee between 5-25 tokens
    } else if (hasTokens < 0.7) {
      // This beacon provides a reward (negative tokenCost)
      tokenCost = -(Math.floor(Math.random() * 15) + 1); // Reward between 1-15 tokens
    }
    // else null (no token interaction)
    
    // Create mock beacon
    const mockBeacon: Omit<Beacon, 'id'> = {
      title,
      description: getRandomDescription(category, title),
      category,
      subcategory: getRandomSubcategory(category),
      date: beaconDate.toISOString(), // Keep date for backward compatibility
      startTime: beaconDate.toISOString(), // New field name
      endTime: new Date(beaconDate.getTime() + (2 * 60 * 60 * 1000)).toISOString(), // 2 hours after start time
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: getRandomAddress()
      },
      createdBy: 'mock-user',
      attendees: [],
      joinRequests: [],
      maxAttendees,
      viewingRadius,
      beaconImage: undefined, // No image for mock data
      tokenCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockBeacons.push(mockBeacon);
  }
  
  // Add beacons to database
  return Promise.all(
    mockBeacons.map(beacon => beaconService.addBeacon(beacon))
  );
}

/**
 * Generate a large batch of mock beacons (up to 20)
 */
export async function generateInitialMockData() {
  // Generate 20 mock beacons
  return generateMockBeacons(20);
}

// Helper function to get random subcategory from a category
function getRandomSubcategory(category: BeaconCategory) {
  type SubcategoryType = {
    [K in BeaconCategory]: string[];
  };
  
  const subcategories: SubcategoryType = {
    'Sports & Recreation': [
      'Golf', 'Tennis', 'Basketball', 'Soccer/Football', 'Running/Jogging',
      'Hiking', 'Cycling', 'Volleyball', 'Rock Climbing', 'Swimming',
      'Yoga', 'Fitness Classes'
    ],
    'Arts & Creative': [
      'Painting', 'Photography', 'Drawing', 'Crafts', 'Music Making',
      'Creative Writing', 'Dance', 'Pottery/Ceramics'
    ],
    'Food & Drink': [
      'Restaurant Dining', 'Coffee Meetups', 'Wine Tasting', 'Cooking Classes',
      'Food Tours', 'Brewery Tours', 'Brunch Groups', 'Cultural Cuisine'
    ],
    'Professional & Learning': [
      'Networking', 'Language Exchange', 'Tech Talks', 'Business Meetups',
      'Skill Sharing', 'Study Groups', 'Career Development', 'Public Speaking'
    ],
    'Entertainment & Social': [
      'Board Games', 'Video Games', 'Movie Watching', 'Trivia Nights',
      'Karaoke', 'Book Clubs', 'Concert Going', 'Comedy Shows'
    ],
    'Outdoor Adventure': [
      'Camping', 'Fishing', 'Kayaking', 'Surfing', 'Skiing/Snowboarding',
      'Beach Activities', 'Bird Watching', 'Nature Photography'
    ],
    'Wellness & Mindfulness': [
      'Meditation', 'Group Therapy', 'Life Coaching', 'Mental Health Support',
      'Spiritual Groups', 'Alternative Healing'
    ],
    'Cultural & Community': [
      'Language Groups', 'Cultural Festivals', 'Volunteer Work',
      'Heritage Celebrations', 'Museum Visits', 'Local History Tours'
    ]
  };
  
  const options = subcategories[category];
  const randomSubcategory = options[Math.floor(Math.random() * options.length)];
  return randomSubcategory as any; // Type assertion to handle the complex typing
} 