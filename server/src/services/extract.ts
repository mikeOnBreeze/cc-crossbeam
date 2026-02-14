import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { supabase, insertMessage } from './supabase.js';

/**
 * Extract a PDF binder into page PNGs + title block crops on Cloud Run,
 * then upload the archives back to Supabase Storage and insert file records.
 *
 * This runs on the Cloud Run server (which has poppler + imagemagick baked
 * into the Docker image), so the Vercel Sandbox never needs system packages.
 */
export async function extractPdfForProject(projectId: string): Promise<void> {
  // 1. Find the PDF binder in the project's file records
  const { data: files, error: filesErr } = await supabase
    .schema('crossbeam')
    .from('files')
    .select('*')
    .eq('project_id', projectId);

  if (filesErr) throw new Error(`Failed to get files: ${filesErr.message}`);

  // Already extracted?
  const hasArchives = (files || []).some(
    (f: { filename: string }) => f.filename === 'pages-png.tar.gz',
  );
  if (hasArchives) {
    console.log(`Project ${projectId}: archives already exist, skipping extraction`);
    return;
  }

  const pdfFile = (files || []).find(
    (f: { filename: string }) => f.filename.toLowerCase().endsWith('.pdf'),
  );
  if (!pdfFile) {
    console.log(`Project ${projectId}: no PDF found, skipping extraction`);
    return;
  }

  // Parse bucket and path from storage_path
  let bucket: string;
  let storagePath: string;
  if (pdfFile.storage_path.startsWith('crossbeam-demo-assets/')) {
    bucket = 'crossbeam-demo-assets';
    storagePath = pdfFile.storage_path.replace('crossbeam-demo-assets/', '');
  } else if (pdfFile.storage_path.startsWith('crossbeam-uploads/')) {
    bucket = 'crossbeam-uploads';
    storagePath = pdfFile.storage_path.replace('crossbeam-uploads/', '');
  } else {
    bucket = 'crossbeam-uploads';
    storagePath = pdfFile.storage_path;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-extract-'));
  console.log(`Extracting PDF for project ${projectId} in ${tmpDir}`);
  insertMessage(projectId, 'system', 'Extracting plan pages from PDF...').catch(() => {});

  try {
    // 2. Download PDF
    const { data: pdfData, error: dlErr } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (dlErr || !pdfData) throw new Error(`PDF download failed: ${dlErr?.message}`);

    const pdfPath = path.join(tmpDir, 'binder.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(await pdfData.arrayBuffer()));
    console.log(`Downloaded PDF: ${(fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1)} MB`);

    // 3. pdftoppm → page PNGs at 200 DPI
    const pagesDir = path.join(tmpDir, 'pages-png');
    fs.mkdirSync(pagesDir);

    execSync(`pdftoppm -png -r 200 "${pdfPath}" "${pagesDir}/page"`, {
      timeout: 120_000,
    });

    // Rename to zero-padded: page-01.png, page-02.png, ...
    for (const f of fs.readdirSync(pagesDir).filter(n => n.startsWith('page-'))) {
      const match = f.match(/page-0*(\d+)\.png/);
      if (match) {
        const padded = match[1].padStart(2, '0');
        const newName = `page-${padded}.png`;
        if (f !== newName) {
          fs.renameSync(path.join(pagesDir, f), path.join(pagesDir, newName));
        }
      }
    }

    const pageCount = fs.readdirSync(pagesDir).filter(n => n.endsWith('.png')).length;
    console.log(`Extracted ${pageCount} pages at 200 DPI`);

    // 4. Crop title blocks (bottom-right 25% × 35%)
    const tbDir = path.join(tmpDir, 'title-blocks');
    fs.mkdirSync(tbDir);

    for (const pageFile of fs.readdirSync(pagesDir).filter(n => n.endsWith('.png')).sort()) {
      const pagePath = path.join(pagesDir, pageFile);
      const num = pageFile.replace('page-', '').replace('.png', '');
      const tbPath = path.join(tbDir, `title-block-${num}.png`);

      try {
        const dims = execSync(`identify -format "%w %h" "${pagePath}"`)
          .toString()
          .trim();
        const [w, h] = dims.split(' ').map(Number);

        const cropW = Math.floor(w * 25 / 100);
        const cropH = Math.floor(h * 35 / 100);
        const cropX = w - cropW;
        const cropY = h - cropH;

        execSync(
          `magick "${pagePath}" -crop ${cropW}x${cropH}+${cropX}+${cropY} +repage "${tbPath}"`,
          { timeout: 30_000 },
        );
      } catch (e) {
        // Try convert fallback (older ImageMagick)
        try {
          const dims = execSync(`identify -format "%w %h" "${pagePath}"`)
            .toString()
            .trim();
          const [w, h] = dims.split(' ').map(Number);
          const cropW = Math.floor(w * 25 / 100);
          const cropH = Math.floor(h * 35 / 100);
          const cropX = w - cropW;
          const cropY = h - cropH;
          execSync(
            `convert "${pagePath}" -crop ${cropW}x${cropH}+${cropX}+${cropY} +repage "${tbPath}"`,
            { timeout: 30_000 },
          );
        } catch {
          console.warn(`Failed to crop title block for ${pageFile}`);
        }
      }
    }

    const tbCount = fs.readdirSync(tbDir).filter(n => n.endsWith('.png')).length;
    console.log(`Cropped ${tbCount} title blocks`);

    // 5. Create tar.gz archives
    const pagesArchive = path.join(tmpDir, 'pages-png.tar.gz');
    const tbArchive = path.join(tmpDir, 'title-blocks.tar.gz');

    execSync(`tar czf "${pagesArchive}" -C "${tmpDir}" pages-png`, { timeout: 60_000 });
    execSync(`tar czf "${tbArchive}" -C "${tmpDir}" title-blocks`, { timeout: 60_000 });

    const pagesMB = (fs.statSync(pagesArchive).size / 1024 / 1024).toFixed(1);
    const tbMB = (fs.statSync(tbArchive).size / 1024 / 1024).toFixed(1);
    console.log(`Archives: pages=${pagesMB}MB, title-blocks=${tbMB}MB`);

    // 6. Upload archives to Supabase Storage
    // Use same bucket as the original PDF for consistency
    const archiveBucket = 'crossbeam-uploads';
    const prefix = storagePath.replace(/\/[^/]+$/, ''); // parent path of the PDF

    for (const { localPath, name } of [
      { localPath: pagesArchive, name: 'pages-png.tar.gz' },
      { localPath: tbArchive, name: 'title-blocks.tar.gz' },
    ]) {
      const archiveStoragePath = `${prefix}/${name}`;
      const { error: upErr } = await supabase.storage
        .from(archiveBucket)
        .upload(archiveStoragePath, fs.readFileSync(localPath), {
          contentType: 'application/gzip',
          upsert: true,
        });
      if (upErr) {
        console.error(`Upload failed for ${name}: ${upErr.message}`);
        throw upErr;
      }
      console.log(`Uploaded: ${archiveBucket}/${archiveStoragePath}`);

      // Insert file record
      await supabase.schema('crossbeam').from('files').insert({
        project_id: projectId,
        file_type: 'other',
        filename: name,
        storage_path: `${archiveBucket}/${archiveStoragePath}`,
        mime_type: 'application/gzip',
      });
    }

    insertMessage(projectId, 'system', `Extraction complete: ${pageCount} pages, ${tbCount} title blocks`).catch(() => {});
    console.log(`Extraction complete for project ${projectId}`);

  } finally {
    // Clean up temp directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
