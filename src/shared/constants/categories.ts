import { BeaconCategory, BeaconSubcategory } from '../types/beacon';

// Categories
export const CATEGORIES: BeaconCategory[] = [
  'Sports & Recreation',
  'Arts & Creative',
  'Food & Drink',
  'Professional & Learning',
  'Entertainment & Social',
  'Outdoor Adventure',
  'Wellness & Mindfulness',
  'Cultural & Community',
];

// Subcategories
export const SUBCATEGORIES: { [key in BeaconCategory]: string[] } = {
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

// Category Emojis
export const CATEGORY_EMOJIS: { [key: string]: string } = {
  'Sports & Recreation': '🏃‍♂️',
  'Arts & Creative': '🎨',
  'Food & Drink': '🍽️',
  'Professional & Learning': '💼',
  'Entertainment & Social': '🎭',
  'Outdoor Adventure': '🏕️',
  'Wellness & Mindfulness': '🧘‍♀️',
  'Cultural & Community': '🌎'
};

export const CATEGORY_COLORS: { [key: string]: string } = {
  'Sports & Recreation': '#e74c3c',
  'Arts & Creative': '#9b59b6',
  'Food & Drink': '#f39c12',
  'Professional & Learning': '#3498db',
  'Entertainment & Social': '#2ecc71',
  'Outdoor Adventure': '#1abc9c',
  'Wellness & Mindfulness': '#e67e22',
  'Cultural & Community': '#34495e'
};

// Subcategory Emojis
export const SUBCATEGORY_EMOJIS: { [key in BeaconCategory]: { [key: string]: string } } = {
  'Sports & Recreation': {
    'Golf': '⛳',
    'Tennis': '🎾',
    'Basketball': '🏀',
    'Soccer/Football': '⚽',
    'Running/Jogging': '🏃‍♂️',
    'Hiking': '🥾',
    'Cycling': '🚴‍♀️',
    'Volleyball': '🏐',
    'Rock Climbing': '🧗‍♀️',
    'Swimming': '🏊‍♀️',
    'Yoga': '🧘‍♀️',
    'Fitness Classes': '💪'
  },
  'Arts & Creative': {
    'Painting': '🎨',
    'Photography': '📸',
    'Drawing': '✏️',
    'Crafts': '🧶',
    'Music Making': '🎵',
    'Creative Writing': '✍️',
    'Dance': '💃',
    'Pottery/Ceramics': '🏺'
  },
  'Food & Drink': {
    'Restaurant Dining': '🍽️',
    'Coffee Meetups': '☕',
    'Wine Tasting': '🍷',
    'Cooking Classes': '👨‍🍳',
    'Food Tours': '🍔',
    'Brewery Tours': '🍺',
    'Brunch Groups': '🥞',
    'Cultural Cuisine': '🌮'
  },
  'Professional & Learning': {
    'Networking': '🤝',
    'Language Exchange': '🗣️',
    'Tech Talks': '💻',
    'Business Meetups': '📊',
    'Skill Sharing': '🧠',
    'Study Groups': '📚',
    'Career Development': '📈',
    'Public Speaking': '🎤'
  },
  'Entertainment & Social': {
    'Board Games': '🎲',
    'Video Games': '🎮',
    'Movie Watching': '🎬',
    'Trivia Nights': '❓',
    'Karaoke': '🎤',
    'Book Clubs': '📚',
    'Concert Going': '🎵',
    'Comedy Shows': '😂'
  },
  'Outdoor Adventure': {
    'Camping': '⛺',
    'Fishing': '🎣',
    'Kayaking': '🚣‍♀️',
    'Surfing': '🏄‍♀️',
    'Skiing/Snowboarding': '🏂',
    'Beach Activities': '🏖️',
    'Bird Watching': '🦅',
    'Nature Photography': '📸'
  },
  'Wellness & Mindfulness': {
    'Meditation': '🧘‍♀️',
    'Group Therapy': '👥',
    'Life Coaching': '🧠',
    'Mental Health Support': '💭',
    'Spiritual Groups': '✨',
    'Alternative Healing': '🔮'
  },
  'Cultural & Community': {
    'Language Groups': '🗣️',
    'Cultural Festivals': '🎭',
    'Volunteer Work': '🤲',
    'Heritage Celebrations': '🏛️',
    'Museum Visits': '🏛️',
    'Local History Tours': '🗿'
  }
}; 