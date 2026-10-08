const router = require('express').Router();
const { db, uid } = require('../store');
const HttpError = require('../lib/HttpError');
const { find } = require('../lib/helpers');

function clean(b) {
  const name = String(b.name || '').trim(), fee = Number(b.fee), quantity = Number(b.quantity);
  if (name.length < 2) throw new HttpError(400, 'Add-on name must be at least 2 characters');
  if (!(fee >= 0)) throw new HttpError(400, 'Fee must be 0 or more');
  if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, 'Quantity must be a whole number of at least 1');
  return { name, fee, quantity };
}
router.get('/', (req, res) => res.json(db.equipment));
router.post('/', (req, res) => { const e = { id: uid(), ...clean(req.body) }; db.equipment.push(e); res.status(201).json(e); });
router.put('/:id', (req, res) => { const e = find(db.equipment, req.params.id, 'Equipment'); Object.assign(e, clean(req.body)); res.json(e); });
router.delete('/:id', (req, res) => {
  const e = find(db.equipment, req.params.id, 'Equipment');
  if (db.bookings.some((b) => b.equipmentIds.includes(e.id))) throw new HttpError(400, 'This add-on is used in bookings and cannot be deleted');
  db.equipment.splice(db.equipment.indexOf(e), 1);
  res.json({ message: 'Equipment deleted' });
});
module.exports = router;
