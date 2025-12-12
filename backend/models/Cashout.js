const mongoose = require('mongoose');

const CashoutSchema = new mongoose.Schema(
  {
    operationCode: { type: String, required: true, trim: true },
    operatorName: { type: String, required: true, trim: true },
    company: {
      type: String,
      required: true,
      enum: ['Play Play Play', 'Lucky Lady', 'Wise Gang', 'Ballerz World', 'Ocean Sluggerz', 'Elite']
    },

    // Observación del operador (y luego supervisor puede complementar en el mismo campo)
    observacion: { type: String, default: '', trim: true },

    // workflow
    estado: {
      type: String,
      enum: ['pendiente', 'verificado', 'rechazado'],
      default: 'pendiente'
    },
    supervisorName: { type: String, default: '', trim: true }
  },
  {
    timestamps: true // crea createdAt y updatedAt automáticamente
  }
);

// Índices para que la “cola” vuele: filtrar por estado y ordenar por createdAt
CashoutSchema.index({ estado: 1, createdAt: -1 });
CashoutSchema.index({ operationCode: 1 });

module.exports = mongoose.model('Cashout', CashoutSchema);