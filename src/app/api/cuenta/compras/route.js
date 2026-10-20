import { requireUser } from '../../../../../lib/server/auth';
import { createServerAdmin } from '../../../../../lib/server/supabase';
import { privateJson, errorResponse, checkDatabase } from '../../../../../lib/server/http';
import { listOwnedOrders } from '../../../../../lib/comprobantes/orders.mjs';
import { PurchaseError } from '../../../../../lib/comprobantes/errors.mjs';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const params = new URL(request.url).searchParams;
    const page = Number(params.get('page') ?? 1);
    const pageSize = Number(params.get('pageSize') ?? 10);
    if (!Number.isInteger(page) || page < 1 || page > 10_000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      throw new PurchaseError('INVALID_PAGINATION', 'La página o tamaño de página no es válido.');
    }
    return privateJson(await listOwnedOrders(createServerAdmin(), user.id, { page, pageSize }, checkDatabase));
  } catch (error) { return errorResponse(error); }
}
