import User from '../models/user.js';

export const scheduler = () => {
  setInterval(async () => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    await User.deleteMany({
      role: 'Player',
      createdAt: { $lt: cutoff },
    });

    console.log('Spelare som varit inaktiva längre än 24 timmar har tagits bort.');
  }, 60 * 60 * 1000);
};