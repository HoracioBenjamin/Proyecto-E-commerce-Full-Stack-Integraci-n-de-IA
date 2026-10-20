import { authorizeReceiptJob, runReceiptWorker } from '../../../../../../lib/server/receipt-worker';
import { privateJson, errorResponse } from '../../../../../../lib/server/http';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  try {
    authorizeReceiptJob(request);
    return privateJson({ data: await runReceiptWorker(2) });
  } catch (error) { return errorResponse(error); }
}
