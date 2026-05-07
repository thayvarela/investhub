import express from 'express';
// Force restart 2
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import historyRoutes from './routes/historyRoutes';
import rebalanceRoutes from './routes/rebalanceRoutes';
import pluggyRoutes from './routes/pluggyRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/assets', assetRoutes);
app.use('/history', historyRoutes);
app.use('/rebalance', rebalanceRoutes);
app.use('/pluggy', pluggyRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('AssetFlow Intelligence Backend is running');
});

export default app;
