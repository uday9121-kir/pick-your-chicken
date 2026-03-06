require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');

const app    = express();
const server = http.createServer(app);
const PORT   = parseInt(process.env.PORT) || 3001;

// Allow ALL origins (handles any Replit URL automatically)
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Socket.io - allow all origins for Replit
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

io.on('connection', (socket) => {
  socket.on('join-farm', () => socket.join('farm'));
  socket.on('join-customer', (uid) => { if(uid) socket.join('customer-'+uid); });
});
app.set('io', io);

// Routes
app.use('/api/auth',      require('./routes/customer-auth'));
app.use('/api/farm/auth', require('./routes/farm-auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/coupons',   require('./routes/coupons'));

app.get('/health', (req, res) => res.json({ status:'ok', app:'Pick Your Chicken API', port:PORT, time:new Date().toISOString() }));
app.use((req,res) => res.status(404).json({ error: `${req.method} ${req.path} not found` }));
app.use((err,req,res,_next) => { console.error(err.message); res.status(500).json({ error:'Server error' }); });

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🐔  Pick Your Chicken API');
  console.log(`📡  Port: ${PORT}`);
  console.log(`🗄️   DB:  ${process.env.DATABASE_URL ? 'Neon ✅' : '❌ Set DATABASE_URL'}`);
  console.log('📱  Socket.io: ✅');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});
