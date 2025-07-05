import User from '../models/user.js';

export const scheduler = () => {
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const result = await User.deleteMany({
        createdAt: { $lt: cutoff },
      });

      console.log(`[SCHEDULER] Cutoff (UTC): ${cutoff.toISOString()}`);
      console.log(`[SCHEDULER] ${result.deletedCount} användare togs bort.`);
    } catch (err) {
      console.error(`[SCHEDULER] Fel vid borttagning: ${err.message}`);
    }
  }, 24 * 60 * 60 * 1000);
};
