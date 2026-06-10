'use strict';

const path = require('path');
const express = require('express');
const config = require('./src/config');
const seed = require('./src/seed');

const authRoutes = require('./src/routes/auth');
const { router: studentRoutes } = require('./src/routes/students');
const retentionRoutes = require('./src/routes/retention');
const whatsappRoutes = require('./src/routes/whatsapp');
const dashboardRoutes = require('./src/routes/dashboard');
const wa = require('./src/services/whatsapp');
const ai = require('./src/services/ai');

const app = express();
app.use(express.json());

// Healthcheck + estado das integracoes
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    whatsappEnabled: wa.isEnabled(),
    aiEnabled: ai.isEnabled(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/retention', retentionRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Frontend estatico
app.use(express.static(path.join(__dirname, 'public')));

// Handler de erros
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicializa banco/seed e sobe o servidor.
seed.run();

app.listen(config.port, () => {
  console.log('');
  console.log('  RETENTION MVP rodando');
  console.log(`  -> http://localhost:${config.port}`);
  console.log(`  -> Login: ${config.admin.email} / ${config.admin.password}`);
  console.log(`  -> WhatsApp (Twilio): ${wa.isEnabled() ? 'ATIVO' : 'inativo (preencha .env)'}`);
  console.log(`  -> IA (Claude): ${ai.isEnabled() ? 'ATIVA' : 'inativa (preencha .env)'}`);
  console.log('');
});
