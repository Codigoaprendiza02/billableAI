// Error handler utility stub
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
}; 