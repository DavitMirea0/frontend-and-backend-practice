const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name:  { type: String, required: true },
    age:        { type: Number, required: true, min: 0 },
    created_at: { type: Number },
    updated_at: { type: Number },
  },
  { timestamps: false, versionKey: false }
);

userSchema.pre('save', function (next) {
  const now = Math.floor(Date.now() / 1000);
  if (this.isNew) this.created_at = now;
  this.updated_at = now;
  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updated_at: Math.floor(Date.now() / 1000) });
  next();
});

module.exports = mongoose.model('User', userSchema);
