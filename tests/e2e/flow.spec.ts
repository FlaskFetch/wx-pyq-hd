// @ts-nocheck
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function pngBuffer1x1(): Buffer {
  // Minimal 1x1 transparent PNG
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X1h0EAAAAASUVORK5CYII=';
  return Buffer.from(b64, 'base64');
}

test.describe('[E2E] 上传-预览-旋转-自定义背景-下载全链路', () => {
  test('happy path works and download size is under 5MB', async ({ page }) => {
    // Go to site root configured by baseURL in Playwright config
    await page.goto('/');

    // App header rendered
    await expect(page.getByRole('heading', { name: '朋友圈高清图画布工具' })).toBeVisible();

    // Upload: set a generated PNG buffer to the hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'in.png',
      mimeType: 'image/png',
      buffer: pngBuffer1x1(),
    });

    // Preview canvas should appear
    const previewCanvas = page.locator('canvas.preview-canvas');
    await expect(previewCanvas).toBeVisible();

    // Rotate canvas (orientation toggle)
    await page.getByRole('button', { name: '旋转画布' }).click();

    // Select custom background color and enter a valid hex
    await page.getByLabel('自定义').check();
    const hexInput = page.getByLabel('自定义背景色（十六进制）');
    await hexInput.fill('#123456');

    // Trigger Download and capture the download artifact
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '下载' }).click(),
    ]);

    // Suggested filename should match our pattern
    const suggested = download.suggestedFilename();
    expect(suggested).toMatch(/^wx-hd-(landscape|portrait)-\d+x\d+-\d{8}_\d{6}\.jpg$/);

    // Save to a temp file so we can assert the size
    const tmpPath = path.join(os.tmpdir(), suggested);
    await download.saveAs(tmpPath);

    const stat = await fs.promises.stat(tmpPath);
    const sizeBytes = stat.size;
    // Expect file size under 5MB
    expect(sizeBytes).toBeLessThanOrEqual(5 * 1024 * 1024);

    // Toast should indicate size status (either met or best-effort info)
    const status = page.getByRole('status');
    await expect(status).toContainText(/(已满足体积条件|导出体积)/);
  });
});