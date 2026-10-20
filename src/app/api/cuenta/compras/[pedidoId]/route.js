import { requireUser } from '../../../../../../lib/server/auth';
import { createServerAdmin } from '../../../../../../lib/server/supabase';
import { privateJson, errorResponse, checkDatabase } from '../../../../../../lib/server/http';
import { orderDetail } from '../../../../../../lib/comprobantes/orders.mjs';

export const runtime = 'nodejs';

export async function GET(request, context) {
  try {
    const user = await requireUser(request);
    const { pedidoId } = await context.params;
    return privateJson({ data: await orderDetail(createServerAdmin(), user.id, pedidoId, checkDatabase) });
  } catch (error) { return errorResponse(error); }
}
