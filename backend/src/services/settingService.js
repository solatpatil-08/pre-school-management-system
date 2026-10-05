const Setting = require('../models/Setting');

class SettingService {
  async getSettings() {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        schoolName: 'Sunshine Kids Academy & Pre-School',
        schoolEmail: 'contact@sunshinekids.edu',
        schoolPhone: '+1 (555) 345-6789',
        schoolAddress: '742 Evergreen Terrace, Sunnyvale, CA 94086',
        academicYear: '2026-2027',
        currentTerm: 'Fall Term',
        currency: 'USD ($)',
        admissionPrefix: 'SKA-',
      });
    }
    return settings;
  }

  async updateSettings(updateData) {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(updateData);
    } else {
      Object.assign(settings, updateData);
    }

    await settings.save();
    return settings;
  }
}

module.exports = new SettingService();
