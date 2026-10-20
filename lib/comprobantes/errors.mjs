export class PurchaseError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'PurchaseError';
    this.code = code;
    this.status = status;
  }
}

export function assertPurchase(condition, code, message, status = 400) {
  if (!condition) throw new PurchaseError(code, message, status);
}

export function identifier(value) {
  const text = String(value ?? '');
  assertPurchase(/^(?:[1-9]\d{0,18}|[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})$/i.test(text),
    'INVALID_ID', 'El identificador de la compra no es válido.');
  return text.toLowerCase();
}

export function receiptNumber(number) {
  return `COMP-${String(number).padStart(8, '0')}`;
}
