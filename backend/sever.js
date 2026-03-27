// ──────────────────────────────────────────────
// Import modules
// ──────────────────────────────────────────────
const express       = require('express');           // web framework
const swaggerJsdoc  = require('swagger-jsdoc');     // อ่าน JSDoc comment → สร้าง spec
const swaggerUi     = require('swagger-ui-express'); // serve spec เป็น Interactive UI
const bodyParser    = require('body-parser');       // อ่าน JSON body
// ถ้าต้องการ JWT authentication placeholder
// const jwt        = require('jsonwebtoken');

// ──────────────────────────────────────────────
// สร้าง Express app
// ──────────────────────────────────────────────
const app = express();
const port = 3001;

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
app.use(bodyParser.json()); // parse application/json

// ──────────────────────────────────────────────
// Swagger / OpenAPI Configuration
// ──────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Hotel Booking API',
      version:     '1.0.0',
      description: 'REST API สำหรับระบบจองห้องพักออนไลน์ — ใบงาน Lab02A',
    },
    servers: [
      { url: `http://localhost:${port}`, description: 'Development Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Booking: {
          type: 'object',
          required: ['fullname','email','phone','checkin','checkout','roomtype','guests'],
          properties: {
            id:         { type: 'integer', example: 68030072 },
            fullname:   { type: 'string',  example: 'Thitikan Prasit' },
            email:      { type: 'string',  format: 'email', example: 'somchai@example.com' },
            phone:      { type: 'string',  example: '0812345678' },
            checkin:    { type: 'string',  format: 'date',  example: '2026-12-01' },
            checkout:   { type: 'string',  format: 'date',  example: '2026-12-03' },
            roomtype:   { type: 'string',  enum: ['standard','deluxe','suite'], example: 'standard' },
            guests:     { type: 'integer', minimum: 1, maximum: 4, example: 2 },
            status:     { type: 'string',  example: 'pending' },
            comment:    { type: 'string',  example: 'ต้องการห้องชั้นล่าง' },
            created_at: { type: 'string',  example: '2026-01-01T00:00:00.000Z' },
          }
        }
      }
    }
  },
  apis: ['./server.js'], // path ของไฟล์ที่มี @swagger comment
};

// สร้าง OpenAPI spec
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log(`📄 Swagger UI: http://localhost:${port}/api-docs`);

// ──────────────────────────────────────────────
// Placeholder Middleware สำหรับ JWT (แก้ตามจริง)
// ──────────────────────────────────────────────
function authenticateToken(req, res, next) {
  // ตัวอย่าง placeholder
  // ตรวจ JWT token จาก Authorization header
  next();
}

// ──────────────────────────────────────────────
// ตัวอย่าง API routes
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Mock Data & Helper
// ──────────────────────────────────────────────
let bookings = []; // เก็บ booking ทั้งหมดแบบ in-memory
let nextId = 1;    // auto-increment id

// Middleware placeholder สำหรับ JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "ไม่ได้ส่ง Token" });
  // ตัวอย่าง dummy verification
  if (authHeader !== "Bearer dummy-jwt-token") return res.status(403).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  next();
}

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "ไม่ได้ส่ง username หรือ password" });

  // ตัวอย่างตรวจ username/password แบบ dummy
  if (username !== "admin" || password !== "admin123") {
    return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }

  res.json({
    token: "dummy-jwt-token",
    user: { id: 1, username: "admin", role: "admin" }
  });
});

// Create Booking
app.post('/api/bookings', (req, res) => {
  const newBooking = {
    id: nextId++,
    status: "pending",
    created_at: new Date().toISOString(),
    ...req.body
  };

  // Validate required fields
  const requiredFields = ['fullname','email','phone','checkin','checkout','roomtype','guests'];
  for (let field of requiredFields) {
    if (!newBooking[field]) return res.status(400).json({ message: `ขาดข้อมูล ${field}` });
  }

  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

// Get all Bookings
app.get('/api/bookings', authenticateToken, (req, res) => {
  // เรียงจากใหม่ไปเก่า
  const sorted = bookings.slice().sort((a,b) => b.id - a.id);
  res.json(sorted);
});

// Update Booking
app.put('/api/bookings/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ message: "ไม่พบข้อมูลการจอง" });

  // อัปเดตข้อมูล
  bookings[index] = { ...bookings[index], ...req.body };
  res.json(bookings[index]);
});

// Delete Booking
app.delete('/api/bookings/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ message: "ไม่พบข้อมูลการจอง" });

  bookings.splice(index, 1);
  res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
});