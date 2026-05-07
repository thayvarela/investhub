import dotenv from 'dotenv';
import app from './app';
import { startPriceUpdateJob } from './jobs/priceUpdateJob';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Start Background Jobs
startPriceUpdateJob();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
