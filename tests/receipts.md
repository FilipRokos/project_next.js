# Receipt segmentation verification

Set `RECEIPT_API_URL` and `RECEIPT_API_KEY` in `.env.local` using `.env.example`, then restart Next.js. The desktop service must be reachable from the Next.js machine on the local network.

Run `node tests/receipt-segmentation.cjs` with Microsoft Edge installed. This synthetic browser test checks the response validator, normalized coordinates, polygon bounds, clipping, transparent output, overlay exclusion, EXIF orientation, preview rendering without PNG export, and dotted filenames. It does not contact the desktop service or storage providers.

For a live check, sign in and open the Google Drive upload dialog. Select a JPEG/PNG, verify the full photo with the blue selection, then click **Potvrdit a uložit**. Verify the stored file is the cropped PNG. Also test replacement while segmentation is pending, no detections, service unavailable, and retry. `/collector` is intentionally unchanged.
