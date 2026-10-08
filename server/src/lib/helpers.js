const HttpError = require('./HttpError');
const find = (list, id, label) => {
  const item = list.find((x) => x.id === id);
  if (!item) throw new HttpError(404, `${label} not found`);
  return item;
};
module.exports = { find };
