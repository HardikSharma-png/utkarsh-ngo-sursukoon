const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const NGO_Programme = require('../models/NGO_Programme');
const Sur_Sukoon_Event = require('../models/Sur_Sukoon_Event');
const Media = require('../models/Media');
const Settings = require('../models/Settings');

const seedData = async () => {
  // Skip seeding if MongoDB is not connected
  if (mongoose.connection.readyState !== 1) {
    console.log('⚠️  Skipping seed — MongoDB not connected.');
    return;
  }
  try {
    // Seed default admin
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'sursukoon2812@gmail.com' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'abhimegh18', salt);
      await Admin.create({ email: process.env.ADMIN_EMAIL || 'sursukoon2812@gmail.com', passwordHash });
      console.log('✅ Admin account seeded');
    }

    // Seed default settings
    const defaultSettings = [
      { key: 'whatsappNumber', value: '919829344949' },
      { key: 'upiId', value: 'sursukoon2812@upi' },
      { key: 'upiQrUrl', value: '' },
      { key: 'bankName', value: 'State Bank of India' },
      { key: 'accountName', value: 'Utkarsh Samajik Seva Sansthan' },
      { key: 'accountNumber', value: 'XXXXXXXXXXXX' },
      { key: 'ifscCode', value: 'SBIN0XXXXXX' },
      { key: 'maintenanceMode', value: false },
      { key: 'impactNumbers', value: { cities: 13, founded: 2005, volunteers: 50, programmes: 8 } },
      { key: 'socialLinks', value: { facebook: '#', instagram: 'https://www.instagram.com/sursukoon_music/', youtube: 'https://www.youtube.com/@utkarshsursukoon', twitter: '#' } }
    ];

    for (const setting of defaultSettings) {
      await Settings.findOneAndUpdate({ key: setting.key }, setting, { upsert: true });
    }
    console.log('✅ Default settings seeded');

    // Seed NGO Programmes
    const existingProgrammes = await NGO_Programme.countDocuments();
    if (existingProgrammes === 0) {
      const programmes = [
        {
          title: 'Jal Bachao Abhiyan',
          description: 'Water conservation campaign across 13 cities of Rajasthan. Launched by Chief Minister Ashok Gehlot on 11 May 2010 with Dainik Bhaskar as media partner.',
          fullDescription: 'A state-wide water conservation initiative covering Jaipur, Ajmer, Bhilwara, Udaipur, Kota, Baran, Bundi, Tonk, Jodhpur, Alwar, Bharatpur, Dausa, and Sawai Madhopur. 50 Utkarsh volunteers participated in this landmark campaign launched by CM Ashok Gehlot on 11 May 2010 with Dainik Bhaskar as the official media partner.',
          category: 'environment', status: 'active', isJoinable: true, order: 1
        },
        {
          title: 'Swasthya evam Parivar Kalyan',
          description: 'Population control, disease prevention, and family planning awareness through video screenings, nukkad natak, and poster exhibitions.',
          fullDescription: 'Comprehensive health outreach programme focusing on population control, disease prevention, and family planning awareness. Activities include video screenings, nukkad natak (street plays), and poster exhibitions. Condom and contraceptive distribution in rural and slum areas to promote family planning.',
          category: 'health', status: 'active', isJoinable: true, order: 2
        },
        {
          title: 'AIDS Awareness Campaign',
          description: 'AIDS awareness in partnership with Rajasthan AIDS Control Society. Featured stalls at Teej Samaroh 2010, Jaipur with nukkad natak and film screenings.',
          fullDescription: 'Partnered with Rajasthan AIDS Control Society to conduct AIDS awareness campaigns. Set up stalls at Teej Samaroh 2010, Jaipur for 2 days. Organized nukkad natak (street plays) and film screenings to educate the public about HIV/AIDS prevention and support.',
          category: 'health', status: 'active', isJoinable: true, order: 3
        },
        {
          title: 'Raktdan Hastakshar Abhiyan',
          description: 'World Blood Donor Day event on 14 June 2009. State-level event at OTS with Health Minister A.A. Khan. Pledge drives at Gaurav Tower, Central Park, Jantar Mantar.',
          fullDescription: 'State-level blood donation awareness campaign on World Blood Donor Day (14 June 2009) at OTS Jaipur. Health Minister A.A. Khan participated and led the initiative. Pledge drives conducted at Gaurav Tower, Central Park, and Jantar Mantar to mobilize voluntary blood donors across Jaipur.',
          category: 'health', status: 'active', isJoinable: true, order: 4
        },
        {
          title: 'Women and Youth Empowerment',
          description: 'Livelihood training for women in various trades. Social support for widows, divorcees, and elderly. Human resource development programmes.',
          fullDescription: 'Comprehensive women and youth empowerment programme providing livelihood training in various trades and vocational skills. Special social support initiatives for widows, divorcees, and elderly women. Human resource development programmes to enhance employability and self-reliance among youth.',
          category: 'empowerment', status: 'active', isJoinable: true, order: 5
        },
        {
          title: 'Pollution Prevention Programme',
          description: 'Eco-system balance and hazardous pollution control awareness. Environmental education and community action against pollution.',
          fullDescription: 'The Pollution Prevention Programme (PPP) focuses on creating awareness about eco-system balance and the dangers of hazardous pollution. Educational campaigns, community workshops, and awareness drives to promote environmental responsibility and sustainable practices.',
          category: 'environment', status: 'active', isJoinable: true, order: 6
        },
        {
          title: 'Consumer Care and Counselling',
          description: 'Consumer Care and Counseling Centre offering consumer awareness seminars and consumer-supportive pleadings.',
          fullDescription: 'The Consumer Care and Counseling Centre provides essential services to consumers including awareness seminars, legal guidance, and consumer-supportive pleadings. The centre empowers citizens to know their rights and seek redressal for consumer grievances.',
          category: 'education', status: 'active', isJoinable: true, order: 7
        },
        {
          title: 'Education and Research',
          description: 'Development research, management seminars, entrepreneurship programmes. Placement support and pre-examination training camps for underprivileged youth.',
          fullDescription: 'A comprehensive education and research initiative offering development research, management seminars, and entrepreneurship programmes. Special focus on placement support and pre-examination training camps for underprivileged youth to bridge the opportunity gap and support career development.',
          category: 'education', status: 'active', isJoinable: true, order: 8
        }
      ];
      await NGO_Programme.insertMany(programmes);
      console.log('✅ NGO Programmes seeded');
    }

    // Seed Sur-Sukoon Events
    const existingEvents = await Sur_Sukoon_Event.countDocuments();
    if (existingEvents === 0) {
      const events = [
        {
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
          description: 'A celebration of music, culture, and voices. Sur-Sukoon — the magical evening where every voice finds its moment. Join us for an evening of soulful melodies and vibrant performances.',
          promoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
      ];
      await Sur_Sukoon_Event.insertMany(events);
      console.log('✅ Sur-Sukoon Events seeded');
    }

    // Seed sample media
    const existingMedia = await Media.countDocuments();
    if (existingMedia === 0) {
      const mediaItems = [
        {
          type: 'press',
          title: 'Utkarsh NGO launches Jal Bachao Abhiyan across 13 Rajasthan cities',
          source: 'Dainik Bhaskar',
          url: 'https://via.placeholder.com/400x200/0F4C3A/D4AF37?text=Dainik+Bhaskar',
          date: new Date('2010-05-11'),
          category: 'campaigns',
          order: 1
        },
        {
          type: 'press',
          title: 'Blood Donation Drive on World Blood Donor Day at OTS Jaipur',
          source: 'Rajasthan Patrika',
          url: 'https://via.placeholder.com/400x200/0F4C3A/D4AF37?text=Rajasthan+Patrika',
          date: new Date('2009-06-14'),
          category: 'campaigns',
          order: 2
        },
        {
          type: 'press',
          title: 'Sur-Sukoon: A Musical Evening that Touched Hearts',
          source: 'Times of India',
          url: 'https://via.placeholder.com/400x200/8B005D/FFD700?text=Times+of+India',
          date: new Date('2024-01-20'),
          category: 'sursukoon',
          order: 3
        }
      ];
      await Media.insertMany(mediaItems);
      console.log('✅ Sample media seeded');
    }

    console.log('✅ Database seeding complete');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};

module.exports = seedData;
