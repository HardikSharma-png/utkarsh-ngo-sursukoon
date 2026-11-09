/**
 * In-Memory Data Store
 * Used as fallback when MongoDB is not available.
 * All data persists for the lifetime of the Node.js process.
 */

const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => Date.now().toString(36) + Math.random().toString(36).slice(2) };

const mongoose = require('mongoose');

// Check if MongoDB is ready
const isDbReady = () => mongoose.connection.readyState === 1;

// ---- In-memory collections ----
const store = {
  programmes: [],
  joinSubmissions: [],
  ssEvents: [],
  performerRegs: [],
  audienceRegs: [],
  media: [],
  settings: {
    whatsappNumber: '919829344949',
    upiId: 'sursukoon2812@upi',
    upiQrUrl: '',
    bankName: 'State Bank of India',
    accountName: 'Utkarsh Samajik Seva Sansthan',
    accountNumber: 'XXXXXXXXXXXX',
    ifscCode: 'SBIN0XXXXXX',
    maintenanceMode: false,
    impactNumbers: { cities: 13, founded: 2005, volunteers: 50, programmes: 8 },
    socialLinks: {
      facebook: '#',
      instagram: 'https://www.instagram.com/sursukoon_music/',
      youtube: 'https://www.youtube.com/@utkarshsursukoon',
      twitter: '#'
    }
  },
  pageContent: [],
  testimonials: [],
};

// Seed default programmes if empty
function ensureProgrammes() {
  if (store.programmes.length === 0) {
    store.programmes = [
      { _id: uid(), title: 'Jal Bachao Abhiyan', description: 'Water conservation campaign across 13 cities of Rajasthan. Launched by Chief Minister Ashok Gehlot on 11 May 2010 with Dainik Bhaskar as media partner.', fullDescription: 'A state-wide water conservation initiative covering Jaipur, Ajmer, Bhilwara, Udaipur, Kota, Baran, Bundi, Tonk, Jodhpur, Alwar, Bharatpur, Dausa, and Sawai Madhopur.', category: 'environment', status: 'active', isJoinable: true, order: 1, createdAt: new Date() },
      { _id: uid(), title: 'Swasthya evam Parivar Kalyan', description: 'Population control, disease prevention, and family planning awareness through video screenings, nukkad natak, and poster exhibitions.', fullDescription: 'Comprehensive health outreach programme focusing on population control, disease prevention, and family planning awareness.', category: 'health', status: 'active', isJoinable: true, order: 2, createdAt: new Date() },
      { _id: uid(), title: 'AIDS Awareness Campaign', description: 'AIDS awareness in partnership with Rajasthan AIDS Control Society.', fullDescription: 'Partnered with Rajasthan AIDS Control Society to conduct AIDS awareness campaigns.', category: 'health', status: 'active', isJoinable: true, order: 3, createdAt: new Date() },
      { _id: uid(), title: 'Raktdan Hastakshar Abhiyan', description: 'World Blood Donor Day event on 14 June 2009. State-level event at OTS Jaipur with Health Minister A.A. Khan.', fullDescription: 'State-level blood donation awareness campaign on World Blood Donor Day (14 June 2009) at OTS Jaipur.', category: 'health', status: 'active', isJoinable: true, order: 4, createdAt: new Date() },
      { _id: uid(), title: 'Women and Youth Empowerment', description: 'Livelihood training for women in various trades. Social support for widows, divorcees, and elderly.', fullDescription: 'Comprehensive women and youth empowerment programme providing livelihood training and vocational skills.', category: 'empowerment', status: 'active', isJoinable: true, order: 5, createdAt: new Date() },
      { _id: uid(), title: 'Pollution Prevention Programme', description: 'Eco-system balance and hazardous pollution control awareness.', fullDescription: 'Educational campaigns and community workshops to promote environmental responsibility.', category: 'environment', status: 'active', isJoinable: true, order: 6, createdAt: new Date() },
      { _id: uid(), title: 'Consumer Care and Counselling', description: 'Consumer Care and Counseling Centre offering consumer awareness seminars.', fullDescription: 'Essential services to consumers including awareness seminars, legal guidance, and consumer-supportive pleadings.', category: 'education', status: 'active', isJoinable: true, order: 7, createdAt: new Date() },
      { _id: uid(), title: 'Education and Research', description: 'Development research, management seminars, entrepreneurship programmes.', fullDescription: 'Education and research initiative with placement support and pre-examination training camps for underprivileged youth.', category: 'education', status: 'active', isJoinable: true, order: 8, createdAt: new Date() },
    ];
  }
}

function ensureSSEvents() {
  if (store.ssEvents.length === 0) {
    store.ssEvents = [
      {
        _id: uid(),
        eventName: 'Sur-Sukoon — Season 5',
        date: new Date('2025-12-15'),
        time: '6:00 PM onwards',
        venue: 'Ravindra Manch, Jaipur, Rajasthan',
        performerSeats: 20,
        availableSeats: 20,
        registrationFee: 500,
        lastRegistrationDate: new Date('2025-12-01'),
        status: 'upcoming',
        registrationOpen: true,
        description: 'A celebration of music, culture, and voices.',
        promoVideoUrl: '',
        createdAt: new Date()
      }
    ];
  }
}

function ensureMedia() {
  if (store.media.length === 0) {
    store.media = [
      { _id: uid(), type: 'press', title: 'Utkarsh NGO launches Jal Bachao Abhiyan across 13 Rajasthan cities', source: 'Dainik Bhaskar', url: '', articleLink: '', date: new Date('2010-05-11'), category: 'campaigns', order: 1, createdAt: new Date() },
      { _id: uid(), type: 'press', title: 'Blood Donation Drive on World Blood Donor Day at OTS Jaipur', source: 'Rajasthan Patrika', url: '', articleLink: '', date: new Date('2009-06-14'), category: 'campaigns', order: 2, createdAt: new Date() },
      { _id: uid(), type: 'press', title: 'Sur-Sukoon: A Musical Evening that Touched Hearts', source: 'Times of India', url: '', articleLink: '', date: new Date('2024-01-20'), category: 'sursukoon', order: 3, createdAt: new Date() },
    ];
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = { store, isDbReady, uid, ensureProgrammes, ensureSSEvents, ensureMedia };
