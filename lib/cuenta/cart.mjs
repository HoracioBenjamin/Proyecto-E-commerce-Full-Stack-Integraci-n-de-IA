/** Solo permite limpiar una bolsa que siga siendo exactamente la pagada. */
export function cartFingerprint(cart) {
  return JSON.stringify(cart.map((item) => ({
    id: String(item.id), size: String(item.size), quantity: Number(item.quantity), price: Number(item.price_raw)
  })).sort((a, b) => `${a.id}/${a.size}`.localeCompare(`${b.id}/${b.size}`)));
}
